(function (global, factory) {

  var Reckoning = factory(global);

  // bind to the global scope without polyfills
  if (typeof module === "object" && module != null && module.exports) {
    module.exports = Reckoning;
  } else if (typeof define === "function" && define.amd) {
    define(function () { return Reckoning; });
  } else {
    global.Reckoning = Reckoning;
  }

})(typeof window !== "undefined" ? window : {}, function (global) {
  'use strict';

  // simple non-locale maps
  //
  // Reckoning will fall back to this
  // if locale support fails in the browser.
  // also, used create locale maps
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  var DAY_IN_MS = 24 * 60 * 60 * 1000;

  // utils - borrowed concept from mithril core.
  var hasOwn = {}.hasOwnProperty;
  var type = {}.toString;

  function isDefined (value) {
    return typeof value !== "undefined";
  };

  function isFunction (object) {
    return typeof object === "function";
  };

  function isObject (object) {
    return type.call(object) === "[object Object]";
  };

  function isNumber (object) {
    return type.call(object) === "[object Number]";
  };

  function isString (object) {
    return type.call(object) === "[object String]";
  };

  function isDate (object) {
    return type.call(object) === "[object Date]";
  };

  function isDateRange (object) {
    return type.call(object) === "[object DateRange]";
  };

  var isArray = Array.isArray || function (object) {
    return type.call(object) === "[object Array]";
  };

  // shallow copy defaults + attrs
  function assign (defaults, attrs) {
    var obj = {};
    for (var prop in defaults) {
      if (hasOwn.call(defaults, prop)) obj[prop] = defaults[prop];
    }
    // allow 'true' to just use defaults
    if (isObject(attrs)) {
      for (var prop in attrs) {
        if (hasOwn.call(attrs, prop)) obj[prop] = attrs[prop];
      }
    }
    return obj;
  };

  // modified `m.prop` from mithril.
  // drops the promise support, adds a
  // callback option
  function gettersetter(store, cb) {
    function prop() {
      if (arguments.length) {
        cb = (arguments[1]) ? arguments[1] : cb;
        store = arguments[0];
        // fire callback if store changed
        if (cb) cb(store);
      }
      return store;
    }

    prop.toJSON = function () {
      return store;
    }

    return prop;
  }

  function proppy (store, cb) {
    return gettersetter(store, cb)
  }

  function mapViewModel (ops) {
    var map = {};

    for (var prop in ops) {
      map[prop] = proppy(ops[prop]);
    }

    return map;
  };

  function getLocale (nav) {
    nav = nav || global.navigator || {};

    return nav.languages || nav.userLanguage || nav.language || 'en-US';
  };

  function useIf (newVal, prevVal) {
    return isDefined(newVal) ? newVal : prevVal;
  }

  function noop () {};


  // use clever native locale strings, if supported
  function toLocaleStringSupportsLocales() {
    try {
      new Date().toLocaleString('i');
    } catch (e) {
      return e.name === 'RangeError';
    }
    return false;
  };

  var canUseLocales = toLocaleStringSupportsLocales();

  // Reckoning core
  var Reckoning = function (attrs) {
    if (!this) return { months: MONTHS, days: DAYS, now: Date() };

    attrs = attrs || {};

    // set locale from passed attr (falls back internally)
    this.locale(attrs.locale);

    // set external parse/format if provided
    this._parse = attrs.parse;
    this._format = attrs.format;

    this.ranges = (!!attrs.mappedRanges) ? attrs.mappedRanges : this._mapRanges(attrs.ranges);
    this.string = assign(this.defaults.string, attrs.string);

    this.model = {
      days: (!!attrs.days) ? proppy(attrs.days) : proppy(this.mapDays()),
      months: (!!attrs.months) ? proppy(attrs.months) : proppy(this.mapMonths())
    };

    if (attrs.calendar) {
      this.calendar = this.createCalendar(attrs.calendar);
    }

    this.view = this._view.bind(this, this);
    this.redraw = this._redraw;
  };

  Reckoning.prototype = {
    string: {},

    constructor: Reckoning,

    toString: function () {
      return '[object Reckoning]';
    },

    toJSON: function () {
      var json = {
        calendar: (this.calendar) ? this.calendar.toJSON() : null,
        timeline: (this.timeline) ? this.timeline.toJSON() : null,
        months: (this.model) ? this.model.months.toJSON() : MONTHS,
        days: (this.model) ? this.model.days.toJSON() : DAYS,
        string: (this.string) ? this.string : null,
        locale: this.locale(),
        ranges: {}
      };

      for (var range in this.ranges) {
        json.ranges[range] = this.ranges[range].toJSON();
      }

      return json;
    },

    defaults: {
      locale: getLocale(),

      range: {
        id: null,
        name: null,
        dates: null,
        events: null,
        legend: null,
        toDate: null,
        fromDate: null,
        fixedBetween: null,
        everyDate: null,
        everyWeekday: null,
        everyMonth: null
      },

      calendar: {
        controls: false,
        today: null,
        dayView: null,
        numberOfMonths: 1,
        startWeekOnDay: 0,
        startDate: null,
        year: null,
        month: 0,
        onDayClick: null,
        onDayKeydown: null
      },

      string: {
        weekday: 'short', // narrow/short/long
        month: 'long', // narrow/short/long
        year: 'numeric',
        day: 'numeric'
      },

      controls: {
        previous: true,
        reset: false,
        next: true,
        list: false
      }
    },

    locale: function (locale) {
      var redraw = false;
      // set passed value
      // can un-set and go to default (null value only)
      if (!!locale || locale === null) {
        this._locale = locale;
        redraw = true;
      }
      // fall back to default if unset
      if (!this._locale) {
        this._locale = (this.defaults) ? this.defaults.locale : getLocale();
      }
      // could potentially update month/day lists as well
      if (redraw && this.redraw) this.redraw(this, { event: 'locale' });

      return this._locale;
    },

    parse: function (date) {
      if (!date) return null;
      // pass through date objects
      if (isDate(date)) return date;
      // bail if invalid
      if (!isString(date)) return null;
      // use custom parser, if it exists
      if (this._parse) return this._parse(date);

      // parse via digits only
      // assumes yyyy mm dd
      var splitDate = date.split(/\D+/).map(function(part) {
        return parseInt(part, 10)
      });

      try {
        var dateObj = new Date(splitDate[0], splitDate[1]-1, splitDate[2]);
        // validate the format was expected
        if (dateObj.getMonth()+1 === splitDate[1] && dateObj.getDate() === splitDate[2]) {
          return dateObj;
        }

        throw 'Malformed date string.  Consider a custom parse function.';
        return null;
      }
      catch(er) {
        return null;
      }
    },

    format: function (date, ops) {
      ops = ops || {};
      date = this.parse(date);
      if (!date) return null;
      if (this._format) return this._format(date, ops);

      var string = ops.string || this.string || this.prototype.defaults.string;

      // use the built-in browser behaviour if we can
      if (canUseLocales) {
        var locale = ops.locale || this.locale();
        return date.toLocaleDateString(locale, string);
      }

      // no parser, no browser support for localized strings...
      // let's go ahead and build this thing ourselves
      // note that this is NOT comprehensive.
      // intentionally skipping weird combinations like month & weekday
      // a custom formatter is better-suited to weird stuff like that
      if (!!string.day && !!string.month) {
        // add the day of the week if set
        var dateString = (!!string.weekday) ? this.getDay(date).string + ', ' : '';

        if (!!string.year) {
          // use the basic behaviour if available
          // otherwise, manually build the formatted string
          dateString += (!!date.toLocaleDateString) ? date.toLocaleDateString() : this.getMonth(date).string + ' ' + date.getDate() + ', ' + date.getFullYear();
          return dateString;
        }

        return dateString + this.getMonth(date).string + ' ' + date.getDate();
      }
      if (!!string.month) {
        var str = this.getMonth(date).string;
        return (!!string.year) ? str + ', ' + date.getFullYear() : str;
      }
      // otherwise just the weekday + date?
      return this.getDay(date).string + ' ' + date.getDate();
    },

    // XXX: Extend to check months/weeks/years/etc?
    between: function (date1, date2, ops) {
      date1 = this.parse(date1);
      date2 = this.parse(date2);
      if (!date1 || !date2) return null;

      var diff = date1.getTime() - date2.getTime();
      return Math.round(Math.abs(diff) / DAY_IN_MS);
    },

    // creating things
    createCalendar: function (calendarOps) {
      return new Calendar(this, assign(this.defaults.calendar, calendarOps));
    },

    // getting things
    getMonth: function (date) {
      date = this.parse(date);
      if (!date) return null;

      var index = date.getMonth();
      return {
        index: index,
        numeric: index + 1,
        string: (this.months) ? this.months()[index] : MONTHS[index]
      }
    },

    getDay: function (date) {
      date = this.parse(date);
      if (!date) return null;

      var index = date.getDay();
      return {
        index: index,
        numeric: index + 1,
        string: (this.days) ? this.days()[index] : DAYS[index]
      }
    },

    getDateKey: function (date) {
      date = this.parse(date);
      if (!date) return null;

      return '' + date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
    },


    mapMonths: function (ops) {
      var type = 'month';
      // cannot map via locale - send english
      if (!canUseLocales) return this._getTrimmedStringMap(MONTHS, type, ops);

      return this._getLocaleMap(type, ops);
    },

    mapDays: function (ops) {
      var type = 'weekday';
      // cannot map via locale - send english
      if (!canUseLocales) return this._getTrimmedStringMap(DAYS, type, ops);

      return this._getLocaleMap(type, ops);
    },

    mapRange: function (range, ops) {
      return (isDateRange(range)) ? range : new DateRange(this, range, ops);
    },

    _mapRanges: function (ranges) {
      if (!ranges) return {};
      var map = {};
      for (var prop in ranges) {
        if (!hasOwn.call(ranges, prop) || !isObject(ranges[prop])) continue;
        var key = ranges[prop].id || prop;
        map[key] = this.mapRange(ranges[prop], { key: key });
      }
      return map;
    },

    // duplicates the native browser method for triming
    // months/days/etc based on string values
    _getTrimmedStringMap: function (array, type, ops) {
      ops = ops || {};
      ops.string = ops.string || {};
      var stringFormat = ops.string[type] || this.string[type] || this.defaults.string[type];
      var map = array.slice(0);
      var stringFormatMap = {
        // ignore '2-digit' and 'numeric',
        // those are easier to get at more directly
        // and this is only intended as a last-ditch
        // fallback anyway so no need to go crazy
        long: function (string) {
          return string; // lol do nothing
        },
        short: function (string) {
          return string.substr(0,3); // 3-character
        },
        narrow: function (string) {
          return string.substr(0,1); // 1-character
        }
      };

      return map.map(function(string) {
        return (stringFormatMap[stringFormat]) ? stringFormatMap[stringFormat](string) : string;
      });
    },

    _getLocaleMap: function (type, ops) {
      if (ops && isString(ops)) {
        ops = { locale: ops };
      }
      ops = ops || {};
      ops.string = ops.string || {};
      var string = ops.string[type] || this.string[type] || this.defaults.string[type];
      var locale = ops.locale || this.locale();
      var map = [];

      // arbitrary starting point
      // Feb 2015 has days that map nicely to weekdays
      // (1st is a Sunday)
      var date = new Date(2015, 1, 1);

      // acceptable type maps hardcoded here
      var typeMap = {
        weekday: {
          adjust: date.setDate,
          indexOffset: 1,
          index: DAYS
        },
        month: {
          adjust: date.setMonth,
          index: MONTHS
        }
      };

      // bail if type is not pre-defined
      if (!typeMap[type]) return null;

      // map object for string display
      var stringOps = {};
      stringOps[type] = string;

      // re-map back to date object for clarity
      date.adjust = typeMap[type].adjust;

      // allow for date offset (0-index does crazy things)
      var offset = typeMap[type].indexOffset || 0;

      var getString = function (value) {
        date.adjust(parseInt(value) + offset);

        return date.toLocaleDateString(locale, stringOps)
      };

      // iterate over known index to get the desired string
      for (var i in typeMap[type].index) {
        if (hasOwn.call(typeMap[type].index, i)) map[i] = getString(i);
      }

      return map;
    },

    _redraw: noop,
    _view: noop
  };

  // map for use without a constructor
  Reckoning.getDateKey = Reckoning.prototype.getDateKey;
  Reckoning.getMonth = Reckoning.prototype.getMonth;
  Reckoning.getDay = Reckoning.prototype.getDay;
  Reckoning.mapRange = Reckoning.prototype.mapRange;
  Reckoning.between = Reckoning.prototype.between;
  Reckoning.locale = Reckoning.prototype.locale;
  Reckoning.format = Reckoning.prototype.format;
  Reckoning.parse = Reckoning.prototype.parse;


  // child constructors
  var DateRange = function (rk, rangeArg, opsArg) {
    this.parent = rk;
    this.model = rk.model || { months: proppy(MONTHS), days: proppy(DAYS) };

    var range = isObject(rangeArg) ? rangeArg : {};
    var ops = isObject(opsArg) ? opsArg : {};

    this.name =  this._getRangeName(range, ops, opsArg);
    // parse and assign to this._*
    this.fromDate(range.fromDate);
    this.toDate(range.toDate);

    // create fintie maps
    this.byDate = (range.fixedBetween) ? this._getMapBetween(range.fromDate, range.toDate) : {};
    this.byMonth = range.byMonth || this._getMapByRepeat(range.everyMonth, 'month');
    this.byWeekday = range.byWeekday || this._getMapByRepeat(range.everyWeekday, 'weekday');
    this.byDay = range.byDay || this._getMapByRepeat(range.everyDate);

    // add to dates map
    if (!!range.dates || isArray(rangeArg)) {
      var dates = (!!range.dates) ? range.dates : rangeArg;
      dates = (isArray(dates)) ? dates : [dates];

      for (var i in dates) {
        if (hasOwn.call(dates, i)) this.addDate(dates[i]);
      }
    }
  };

  DateRange.prototype = {
    constructor: DateRange,

    toString: function () {
      return '[object DateRange]';
    },

    toJSON: function () {
      var json = {
        dates: [],
        name: this.name,
        toDate: (this._toDate) ? this._toDate.toJSON() : null,
        fromDate: (this._fromDate) ? this._fromDate.toJSON() : null,
        byWeekday: this.byWeekday,
        byMonth: this.byMonth,
        byDay: this.byDay
      };

      for (var date in this.byDate) {
        if (hasOwn.call(this.byDate, date) && !!this.byDate[date]) {
          json.dates.push(date);
        }
      }

      return json;
    },

    setDate: function (date, value) {
      var rk = this.parent;
      date = rk.parse(date);
      if (!date) return;

      // assigns value, or toggles if no value
      var key = rk.getDateKey(date);
      this.byDate[key] = (value) ? value : !this.byDate[key];
    },

    addDate: function (date) {
      this.setDate(date, true);
    },

    removeDate: function (date) {
      this.setDate(date, false);
    },

    clearDates: function () {
      for (var prop in this.byDate) {
        this.byDate[prop] = false;
      }
    },

    // if city, population: you
    inRange: function (date) {
      var rk = this.parent;
      date = rk.parse(date);
      if (!date) return false;

      var isMatch = !!this.byDate[rk.getDateKey(date)];
      if (isMatch) return isMatch;

      if (this._toDate || this._fromDate) {
        var isMatchTo, isMatchFrom;
        if (this._toDate) isMatchTo = date.getTime() <= this._toDate.getTime();
        if (this._fromDate) isMatchFrom = date.getTime() >= this._fromDate.getTime();

        isMatch = (this._toDate && this._fromDate) ? isMatchTo && isMatchFrom : isMatchTo || isMatchFrom;

        // do not check any further if not within the from/to range
        if (!isMatch) return !!isMatch;
      }

      if (this.byMonth) {
        isMatch = !!this.byMonth[date.getMonth()];
        if (isMatch && this.byWeekday) isMatch = !!this.byWeekday[date.getDay()];
        if (isMatch && this.byDay) isMatch = !!this.byDay[date.getDate()];
      }
      if (this.byWeekday && !this.byMonth) {
        isMatch = !!this.byWeekday[date.getDay()];
        if (isMatch && this.byDay) isMatch = !!this.byDay[date.getDate()];
      }
      if (this.byDay && !this.byMonth && !this.byWeekday) {
        isMatch = this.byDay[date.getDate()];
      }

      return !!isMatch;
    },


    fromDate: function (date) {
      if (date) this._fromDate = this.parent.parse(date);

      return this._fromDate;
    },

    toDate: function (date) {
      if (date) this._toDate = this.parent.parse(date);

      return this._toDate;
    },

    _getNumericalKey: function (value, type) {
      // this is tricky and we need to
      // make some assumptions (for now)
      // basically numbers can be directly mapped,
      // strings should run through parseInt,
      // NaN should be mapped against 'months',
      // for now, assume that this will be provided correctly
      if (!isDefined(value)) return null;

      var key = parseInt(value);

      if (key > -1) {
        return key;
      }

      if (type === 'month') {
        var index = this.model.months().indexOf(value);
        return (index > -1) ? index : null;
      }

      if (type === 'weekday') {
        var index = this.model.days().indexOf(value);
        return (index > -1) ? index : null;
      }

      return null;
    },

    _getMapBetween: function (from, to) {
      var rk = this.parent;
      from = rk.parse(from);
      to = rk.parse(to);
      if (!from || !to) return {};
      // flip the order if the dates were transposed
      var date = (to > from) ? new Date(from) : new Date(to);
      var difference = rk.between(from, to);
      var days = 0;
      var map = {};

      for (;days <= difference; days++) {
        map[rk.getDateKey(date)] = true;
        date.setTime(date.getTime() + DAY_IN_MS);
      }

      return map;
    },

    _getMapByRepeat: function (everyValue, type) {
      if (!isDefined(everyValue) || isObject(everyValue)) return null;

      var map = {};
      var key;

      if (!isArray(everyValue)) {
        everyValue = [everyValue];
      }

      for (var i in everyValue) {
        if (hasOwn.call(everyValue, i)) {
          key = this._getNumericalKey(everyValue[i], type);
          if (key !== null) map[key] = true;
        }
      }

      return map;
    },

    _getRangeName: function (range, ops, str) {
      var key = (range.name) ? range.name : (ops.key) ? ops.key : isString(str) ? str : 'range';
      var str = '' + key;

      return str.replace(/\W+/g, '-')
                .replace(/([a-z\d])([A-Z])/g, '$1-$2')
                .toLowerCase();
    }
  };

  var Calendar = function (rk, ops) {
    this.parent = rk;
    this.model = rk.model;

    this._onFocus = ops.onFocus;
    this._onDayClick = ops.onDayClick;
    this._onDayKeydown = ops.onDayKeydown;

    var controls = (ops.controls) ? assign(this.parent.defaults.controls, ops.controls) : null;

    this.calendarMonths = [];
    this.calendarControls = this._createControls(controls);

    this.handlers = {};
    this.createHandlers = this._createHandlers.bind(this);

    this.today = proppy(this.parent.parse(ops.today) || new Date());
    this.getDisplayDate = (canUseLocales || this.parent._format) ? this._getLocaleDisplayDate : this._getSimpleDisplayDate;

    var startDate = this._getStartDate(ops);

    this.vm = mapViewModel({
      advanceBy: 1,
      resetDate: startDate,
      weekdays: this.getWeekdayOrder(ops.startWeekOnDay),
      year: startDate.getFullYear(),
      month: startDate.getMonth()
    });
    // vm props w/ callbacks
    this.vm.numberOfMonths = proppy(ops.numberOfMonths, this.updateMonths.bind(this, this.calendarMonths));
    this.vm.startWeekOnDay = proppy(ops.startWeekOnDay, this.setWeekdayOrder.bind(this));

    this.updateMonths(this.calendarMonths);

    this.monthView = ops.monthView || null;
    this.dayView = ops.dayView || null;
    this.view = this._view.bind(this, this);
  };

  Calendar.prototype = {
    constructor: Calendar,

    toJSON: function () {
      var vm = this.vm;

      return {
        today: this.today().toJSON(),
        startWeekOnDay: vm.startWeekOnDay.toJSON(),
        numberOfMonths: vm.numberOfMonths.toJSON(),
        startDate: vm.year.toJSON() + '-' + vm.month.toJSON() + '-1'
      };
    },

    setState: function (ops) {
      this._onFocus = useIf(ops.onFocus, this._onFocus);
      this._onDayClick = useIf(ops.onDayClick, this._onDayClick);
      this._onDayKeydown = useIf(ops.onDayKeydown, this._onDayKeydown);
      this.monthView = useIf(ops.monthView, this.monthView);
      this.dayView = useIf(ops.dayView, this.dayView);

      if (ops.controls) {
        var controls = assign(this.parent.defaults.controls, ops.controls);
        this.calendarControls = this._createControls(controls);
      }
      if (ops.startDate) {
        this.vm.resetDate(this._getStartDate(ops));
      }
      if (ops.today) {
        this.today(this.parent.parse(ops.today));
      }
      if (ops.numberOfMonths) {
        this.vm.numberOfMonths(ops.numberOfMonths);
      }
      if (isDefined(ops.startWeekOnDay)) {
        this.vm.startWeekOnDay(ops.startWeekOnDay);
      }
      if (ops.year || ops.month) {
        if (isDefined(ops.year)) this.vm.year(ops.year);
        if (isDefined(ops.month)) this.vm.month(ops.month);

        this.updateMonths(this.calendarMonths);
      }
    },

    advance: function (amount) {
      if (!isDefined(amount) || !parseInt(amount)) return false;

      var vm = this.vm;
      var newDate = this.getModifiedDate(vm.month() + amount, vm.year());
      vm.month(newDate.month);
      vm.year(newDate.year);
      this.updateMonths(this.calendarMonths);
      this.parent.redraw(this, { event: 'advance' });
    },

    previous: function () {
      this.advance(this.vm.advanceBy() * -1);
    },

    next: function () {
      this.advance(this.vm.advanceBy());
    },

    reset: function () {
      var vm = this.vm;

      vm.month(vm.resetDate().getMonth());
      vm.year(vm.resetDate().getFullYear());
      this.updateMonths(this.calendarMonths);
      this.parent.redraw(this, { event: 'reset' });
    },

    updateMonths: function (months, total) {
      months = months || this.calendarMonths;
      var vm = this.vm;
      var rk = this.parent;
      total = total || vm.numberOfMonths();
      // this should check the month value (>0, <12)
      // and set the month/year index accordingly
      for (var i = 0, monthyear, date; i < total; i++) {
        monthyear = this.getModifiedDate(vm.month() + i, vm.year());
        date = new Date(monthyear.year, monthyear.month, 1);
        months[i] = new Month({
          calendar: this,
          title: rk.format(date, { isCalendarMonth: true, string: { month: rk.string.month, year: rk.string.year } }),
          ranges: rk.ranges,
          weekdays: vm.weekdays,
          month: monthyear.month,
          year: monthyear.year,
          counter: i + 1,
          total: total
        });
      }
    },

    getModifiedDate: function (month, year) {
      var yearDiff = 0;
      if (month < 0 || month > 11) {
        yearDiff = Math.floor(month / 11);
        month = Math.abs(month - (12 * yearDiff));
      }

      return {
        month: month,
        year: year + yearDiff
      };
    },

    getWeekdayOrder: function (startDay) {
      var days = this.model.days();
      startDay = (isDefined(startDay)) ? startDay : this.vm.startWeekOnDay();
      return [].concat(
        days.slice(startDay),
        days.slice(0, startDay)
      );
    },

    setWeekdayOrder: function (startDay) {
      // set to vm
      this.vm.weekdays(this.getWeekdayOrder(startDay));
      // refresh immediately
      this.updateMonths(this.calendarMonths);
      this.parent.redraw(this, { event: 'order' });
    },

    onFocus: function () {
      if (this._onFocus) this._onFocus(this);
    },

    onDayClick: function (e, date) {
      if (this._onDayClick) this._onDayClick(e, this.parent, date);
    },

    onDayKeydown: function (e, date, indexes) {
      if (this._onDayKeydown) this._onDayKeydown(e, this.parent, date, indexes);
    },

    _getStartDate: function (ops) {
      var startDate = this.parent.parse(ops.startDate);
      if (!startDate) {
        startDate = (ops.year && ops.month) ? new Date(ops.year, ops.month) : this.today();
      }
      return startDate;
    },

    _getSimpleDisplayDate: function (date) {
      return date.getDate();
    },

    _getLocaleDisplayDate: function (date) {
      return this.parent.format(date, { isCalendarDay: true, string: { day: 'numeric' } });
    },

    _createControls: function (ops) {
      if (!ops) return null;

      return new Controls({
        calendar: this,
        model: this.model,
        vm: ops
      });
    },

    // pre-bind handlers, store to a handlers key
    _createHandlers: function(key, date, indexes, handlerMap) {
      function onClick(e) {
        this.onDayClick(e, date);
      }

      function onKeydown(e) {
        this.onDayKeydown(e, date, indexes);
      }

      this.handlers[key] = assign({
        onClick: onClick.bind(this),
        onKeydown: onKeydown.bind(this)
      }, handlerMap);

      return this.handlers[key];
    },

    _view: noop
  };

  var Month = function (attrs) {
    this.calendar = attrs.calendar;
    this.weekdays = attrs.weekdays;
    this.ranges = attrs.ranges;
    this.month = attrs.month;
    this.year = attrs.year;
    this.key = attrs.year + '-' + attrs.month;

    var dates = {};
    var days = [];

    this.vm = {
      title: proppy(attrs.title),
      className: proppy('is-'+attrs.counter+'-of-'+attrs.total),
      // object refs rather than props
      weeks: this.mapWeeks({ dates: dates, days: days }),
      dates: dates,
      days: days
    };

    this.view = this._view.bind(this, this);
  };

  Month.prototype = {
    mapWeeks: function (ops) {
      var rk = this.calendar.parent;
      var dayMap = ops.days;
      var dateMap = ops.dates;
      var handlerMap = this.calendar.handlers;
      var weeks = [[],[],[],[],[]];
      // start at day 1 :)
      var startDate = new Date(this.year, this.month, 1);
      // generate calendar from the first day of the week
      // to create an even grid - so count backwards until we hit it
      startDate.setDate(startDate.getDate() - (startDate.getDay() - this.calendar.vm.startWeekOnDay()));
      // normal monthly calendar grid is 7 x 5 - maybe adapt for non-standard calendars?
      for (var i = 0, week = 0, day = 0; i < 35; i++) {
        var dateKey = rk.getDateKey(startDate);
        weeks[week][day] = new Day({
          calendar: this.calendar,
          ranges: this.ranges,
          month: this.month,
          date: new Date(startDate),
          handlers: handlerMap[dateKey] || this.calendar.createHandlers,
          key: dateKey,
          indexes: {
            grid: i,
            week: week,
            weekday: day
          }
        });

        // map controllers to expose API
        dateMap[dateKey] = dayMap[i] = weeks[week][day];

        startDate.setDate(startDate.getDate() + 1);
        day++;

        // reset and go to the next week
        if (day > 6) {
          day = 0;
          week++;
        }
      }
      return weeks;
    },

    _view: noop
  };

  var Day = function (attrs) {
    this.calendar = attrs.calendar;
    this.ranges = attrs.ranges;
    this.month = attrs.month;
    this.date = attrs.date;
    this.indexes = attrs.indexes;
    this.key = attrs.key;
    this.handlers = isFunction(attrs.handlers) ? this.createHandlers(attrs.handlers) : attrs.handlers;

    this.vm = mapViewModel({
      textDate: this.calendar.getDisplayDate(this.date),
      focus: false,
      tabindex: -1,
      inFocusClassName: '',
      inMonthClassName: (this.month === this.date.getMonth()) ? ' is-month' : ' is-not-month'
    });


    this.view = this._view.bind(this, this);
  };

  Day.prototype = {
    createHandlers: function (createHandlers) {
      return createHandlers(this.key, this.date, this.indexes, {
        onFocus: this.onFocus.bind(this),
        onBlur: this.onBlur.bind(this)
      });
    },

    classNames: function () {
      var vm = this.vm;
      return vm.inFocusClassName() + vm.inMonthClassName() + this.inRangeClassNames();
    },

    inRanges: function () {
      var range, ranges = [];
      for (var prop in this.ranges) {
        range = this.ranges[prop];
        if (range.inRange(this.date)) {
          ranges.push(range.name);
        }
      }
      return ranges;
    },

    inRangeClassNames: function () {
      return this.inRanges().map(function (rangeName) {
        return ' is-range-' + rangeName;
      }).join('');
    },

    onFocus: function () {
      this.vm.inFocusClassName(' in-focus');
    },

    onBlur: function () {
      this.vm.inFocusClassName('');
    },

    _view: noop
  };

  var Controls = function (ops) {
    this.calendar = ops.calendar;
    this.model = ops.model;

    this.vm = {};
    this.views = {};
    for (var prop in ops.vm) {
      var setting = ops.vm[prop];
      if (isFunction(setting)) {
        this.views[prop] = setting;
      }
      if (isString(setting)) {
        this.views[prop] = proppy(setting);
      }
      this.vm[prop] = proppy(!!setting);
    }
    this.view = this._view.bind(this, this);
  };

  Controls.prototype = {
    onClick: {
      next: function (cb) {
        this.calendar.next();
        if (isFunction(cb)) cb();
      },
      previous: function (cb) {
        this.calendar.previous();
        if (isFunction(cb)) cb();
      },
      reset: function (cb) {
        this.calendar.reset();
        if (isFunction(cb)) cb();
      }
    },

    _view: noop
  };

  // save components to the parent constructor
  Reckoning.prototype.components = {
    DateRange: DateRange,
    Calendar: Calendar,
    Controls: Controls,
    Month: Month,
    Day: Day
  };

  return Reckoning;
});
