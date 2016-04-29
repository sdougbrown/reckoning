(function (global, factory) {

  var Reckoning = factory(global);
  var rk = new Reckoning({ string: { weekday: 'long' } });

  // bind to the global scope without polyfills
  if (typeof module === "object" && module != null && module.exports) {
    module.exports = Reckoning;
    module.exports = rk;
  } else if (typeof define === "function" && define.amd) {
    define(function () { return Reckoning; });
    define(function () { return rk; });
  } else {
    global.Reckoning = Reckoning;
    global.rk = rk;
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
    for (var prop in defaults) obj[prop] = defaults[prop];
    // allow 'true' to just use defaults
    if (isObject(attrs)) {
      for (var prop in attrs) obj[prop] = attrs[prop];
    }
    return obj;
  };

  function mapViewModel (ops) {
    var map = {};

    for (var prop in ops) {
      map[prop] = m.prop(ops[prop]);
    }

    return map;
  };

  function subMod(mod, attrs) {
    return mod.view.bind(this, new mod.controller(attrs));
  };

  function getLocale (nav) {
    nav = nav || navigator || global.navigator;

    return nav.languages || nav.userLanguage || nav.language || 'en-US';
  };

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
    if (!this) return;

    attrs = attrs || {};

    // set locale from passed attr (falls back internally)
    this.locale(attrs.locale);

    // set external parse/format if provided
    this._parse = attrs.parse;
    this._format = attrs.format;

    this.ranges = (!!attrs.mappedRanges) ? attrs.mappedRanges : this._mapRanges(attrs.ranges);
    this.string = assign(this.defaults.string, attrs.string);

    this.model = {
      days: (!!attrs.days) ? m.prop(attrs.days) : m.prop(this.mapDays()),
      months: (!!attrs.months) ? m.prop(attrs.months) : m.prop(this.mapMonths())
    };

    if (attrs.calendar) {
      this.calendar = new Calendar(this, assign(this.defaults.calendar, attrs.calendar));
    }
    if (attrs.timeline) {
      this.timeline = new Timeline(this, assign(this.defaults.timeline, attrs.timeline));
    }

    this.view = this._view.bind(this, this);
  };

  Reckoning.prototype = {
    string: {},

    constructor: Reckoning,

    toString: function () {
      return '[object Reckoning]';
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

      timeline: {
        today: null,
        units: 'day'
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
        onDayClick: null
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
      // set passed value
      // can un-set and go to default (null value only)
      if (!!locale || locale === null) {
        this._locale = locale;
      }
      // fall back to default if unset
      if (!this._locale) {
        this._locale = this.defaults.locale;
      }

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
      if (this._format) return this._format(date);

      var string = ops.string || this.string || this.defaults.string;

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
        if (!isObject(ranges[prop])) continue;
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
        map[i] = getString(i);
      }

      return map;
    },

    _getDateKey: function (date) {
      date = this.parse(date);
      if (!date) return null;

      return '' + date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
    },

    _view: function (ctrl) {
      return m('.rk', [
        (ctrl.timeline) ? ctrl.timeline.view() : '',
        (ctrl.calendar) ? ctrl.calendar.view() : ''
      ]);
    }
  };


  // child constructors
  var DateRange = function (rk, range, ops) {
    this.parent = rk;
    this.model = rk.model;

    range = range || {};
    ops = ops || {};

    this.name =  this._getRangeName(range, ops);
    // parse and assign to this._*
    this.fromDate(range.fromDate);
    this.toDate(range.toDate);

    // create fintie maps
    this.byDate = (range.fixedBetween) ? this._getMapBetween(range.fromDate, range.toDate) : {};
    this.byMonth = this._getMapByRepeat(range.everyMonth, 'month');
    this.byWeekday = this._getMapByRepeat(range.everyWeekday, 'weekday');
    this.byDay = this._getMapByRepeat(range.everyDate);

    // add to dates map
    if (range.dates) {
      var dates = (isArray(range.dates)) ? range.dates : [range.dates];

      for (var i in dates) this.addDate(dates[i]);
    }

  };

  DateRange.prototype = {
    constructor: DateRange,

    toString: function () {
      return '[object DateRange]';
    },

    setDate: function (date, value) {
      var rk = this.parent;
      date = rk.parse(date);
      if (!date) return;

      // assigns value, or toggles if no value
      this.byDate[rk._getDateKey(date)] = (value) ? value : !this.byDate[rk._getDateKey(date)];
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

      var isMatch = !!this.byDate[rk._getDateKey(date)];
      if (isMatch) return isMatch;

      if (this._toDate || this._fromDate) {
        var isMatchTo, isMatchFrom;
        if (this._toDate) isMatchTo = date.getTime() <= this._toDate.getTime();
        if (this._fromDate) isMatchFrom = date.getTime() >= this._fromDate.getTime();

        isMatch = (this._toDate && this._fromDate) ? isMatchTo && isMatchFrom : isMatchTo || isMatchFrom;

        // do not check any further if not within the from/to range
        if (!isMatch) return isMatch;
      }

      if (this.byMonth) {
        isMatch = !!this.byMonth[date.getMonth() + 1];
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

      return isMatch;
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
      // and all month keys should be 'human' style
      // (i.e. getDate() + 1)
      // others can be exact
      // for now, assume that this will be provided correctly
      if (!isDefined(value)) return null;

      var key = parseInt(value);

      if (key !== NaN) {
        return key;
      }

      if (type === 'month') {
        var index = this.model.months().indexOf(value);
        return (index > -1) ? index + 1 : null;
      }

      if (type === 'weekday') {
        var index = this.model.days().indexOf(value);
        return (index > -1) ? index : null;
      }

      return null;
    },

    _getMapBetween: function (from, to) {
      from = this.parent.parse(from);
      to = this.parent.parse(to);
      if (!from || !to) return {};
      // flip the order if the dates were transposed
      var date = (to > from) ? new Date(from) : new Date(to);
      var difference = this.parent.between(from, to);
      var days = 0;
      var map = {};

      for (;days <= difference; days++) {
        map[this.parent._getDateKey(date)] = true;
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
        key = this._getNumericalKey(everyValue[i], type);
        map[key] = true;
      }

      return map;
    },

    _getRangeName: function (range, ops) {
      var key = range.name || ops.key;
      var str = '' + key;

      return str.replace(/\W+/g, '-')
                .replace(/([a-z\d])([A-Z])/g, '$1-$2')
                .toLowerCase();
    }
  };

  var Timeline = function (rk, ops) {
    this.parent = rk;
    this.model = rk.model;
  };

  Timeline.prototype = {
    constructor: Timeline,

    unitMap: {
      day: Date.prototype.getDate,
      month: Date.prototype.getMonth,
      year: Date.prototype.getFullYear
    }
  };

  var Calendar = function (rk, ops) {
    this.parent = rk;
    this.model = rk.model;

    this._onFocus = ops.onFocus;
    this._onDayClick = ops.onDayClick;
    this._onDayKeydown = ops.onDayKeydown;

    var startDate = this.parent.parse(ops.startDate);
    var controls = (ops.controls) ? assign(this.parent.defaults.controls, ops.controls) : null;

    this.calendarMonths = [];
    this.calendarControls = this._createControls(controls);

    this.today = m.prop(this.parent.parse(ops.today) || new Date());
    this.getDisplayDate = (canUseLocales) ? this._getLocaleDisplayDate : this._getSimpleDisplayDate;

    this.vm = {
      advanceBy: m.prop(1),
      resetDate: m.prop(startDate || this.today()),
      numberOfMonths: m.prop(ops.numberOfMonths),
      startWeekOnDay: m.prop(ops.startWeekOnDay),
      year: m.prop((!!startDate) ? startDate.getFullYear() : this.today().getFullYear()),
      month: m.prop((!!startDate) ? startDate.getMonth() : ops.month)
    };

    this.model.weekdays = m.prop(this.getWeekdayOrder());
    this.updateMonths(this.calendarMonths);

    this.monthView = ops.monthView || null;
    this.dayView = ops.dayView || this._dayView;
    this.view = this._view.bind(this, this);
  };

  Calendar.prototype = {
    constructor: Calendar,

    advance: function (amount) {
      if (!isDefined(amount) || !parseInt(amount)) return false;

      var vm = this.vm;
      var newDate = this.getModifiedDate(vm.month() + amount, vm.year());
      vm.month(newDate.month);
      vm.year(newDate.year);
      this.updateMonths(this.calendarMonths);
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
    },

    updateMonths: function (months) {
      months = months || this.calendarMonths;
      var vm = this.vm;
      var rk = this.parent;
      var total = vm.numberOfMonths();
      // this should check the month value (>0, <12)
      // and set the month/year index accordingly
      for (var i = 0, monthyear, date; i < total; i++) {
        monthyear = this.getModifiedDate(vm.month() + i, vm.year());
        date = new Date(monthyear.year, monthyear.month, 1);
        months[i] = subMod(Month, {
          model: this.model,
          calendar: this,
          title: rk.format(date, { string: { month: rk.string.month, year: rk.string.year } }),
          ranges: rk.ranges,
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

    getWeekdayOrder: function () {
      var days = this.model.days();
      var startDay = this.vm.startWeekOnDay();
      return [].concat(
        days.slice(startDay),
        days.slice(0, startDay)
      );
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

    _getSimpleDisplayDate: function (date) {
      return date.getDate();
    },

    _getLocaleDisplayDate: function (date) {
      return this.parent.format(date, { string: { day: 'numeric' } });
    },

    _createControls: function (ops) {
      if (!ops) return null;

      return subMod(Controls, {
        calendar: this,
        model: this.model,
        vm: ops
      })
    },

    _view: function (ctrl) {
      return m('.rk-cal', {
        onfocus: ctrl.onFocus.bind(ctrl),
        tabindex: '0'
      }, [
        (ctrl.calendarControls) ? ctrl.calendarControls() : '',
        ctrl.calendarMonths.map(function(monthView) {
          return (ctrl.monthView) ? ctrl.monthView(ctrl, monthView) : monthView();
        })
      ]);
    },

    _dayView: function (date) {
      return '';
    }
  };

  var Month = {
    controller: function (attrs) {
      this.model = attrs.model;
      this.calendar = attrs.calendar;
      this.ranges = attrs.ranges;
      this.month = attrs.month;
      this.year = attrs.year;

      var dates = {};
      var days = [];

      this.vm = {
        title: m.prop(attrs.title),
        className: m.prop('is-'+attrs.counter+'-of-'+attrs.total),
        // object refs rather than props
        weeks: this.mapWeeks({ dates: dates, days: days }),
        dates: dates,
        days: days
      };
    },
    view: function (ctrl) {
      var vm = ctrl.vm;
      var model = ctrl.model;

      return m('table.rk-cal__month', { className: vm.className(), role: 'grid' }, [
        m('thead.rk-cal__head', { role: 'rowgroup' }, [
          m('tr.rk-cal__head__row', {
            role: 'row',
            className: 'rk-cal__head__row--month'
          }, [
            m('th.rk-cal__head__month', { colspan: 7 }, vm.title()),
          ]),
          m('tr.rk-cal__head__row', {
            role: 'row',
            className: 'rk-cal__head__row--weekday'
          }, [
            model.weekdays().map(function(day) {
              return m('th.rk-cal__head__weekday', [
                m('span', { role: 'columnheader' }, day)
              ]);
            })
          ])
        ]),
        m('tbody.rk-cal__body', { role: 'rowgroup' }, [
          vm.weeks.map(function(week) {
            return m('tr.rk-cal__body__row', { role: 'row' }, [
              week.map(function(day) {
                return day.view();
              })
            ]);
          })
        ])
      ]);
    }
  };

  Month.controller.prototype = {
    mapWeeks: function (ops) {
      var dayMap = ops.days;
      var dateMap = ops.dates;
      var weeks = [[],[],[],[],[]];
      // start at day 1 :)
      var startDate = new Date(this.year, this.month, 1);
      // generate calendar from the first day of the week
      // to create an even grid - so count backwards until we hit it
      startDate.setDate(startDate.getDate() - (startDate.getDay() - this.calendar.vm.startWeekOnDay()));
      // normal monthly calendar grid is 7 x 5 - maybe adapt for non-standard calendars?
      for (var i = 0, week = 0, day = 0; i < 35; i++) {
        var dateKey = this.calendar.parent._getDateKey(startDate);
        weeks[week][day] = new Day({
          calendar: this.calendar,
          ranges: this.ranges,
          month: this.month,
          date: new Date(startDate),
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
    }
  };

  var Day = function (attrs) {
    this.calendar = attrs.calendar;
    this.ranges = attrs.ranges;
    this.month = attrs.month;
    this.date = attrs.date;
    this.indexes = attrs.indexes;
    this.key = attrs.key;

    this.vm = mapViewModel({
      textDate: this.calendar.getDisplayDate(this.date),
      focus: false,
      tabindex: -1,
      inFocusClassName: '',
      inMonthClassName: (this.month === this.date.getMonth()) ? ' is-month' : ' is-not-month'
    });

    // this is kind of weird...
    this.view = this._view.bind(this, this);
  };

  Day.prototype = {
    config: function (element) {
      // actual DOM stuff
      if (element && this.vm.focus()) element.focus();
    },

    classNames: function () {
      var vm = this.vm;
      return vm.inFocusClassName() + vm.inMonthClassName() + this.inRangeClassNames();
    },

    inRangeClassNames: function () {
      var range, className = '';
      for (var prop in this.ranges) {
        range = this.ranges[prop];
        if (range.inRange(this.date)) {
          className += ' is-range-' + range.name;
        }
      }
      return className;
    },

    onFocus: function () {
      this.vm.inFocusClassName(' in-focus');
    },

    onBlur: function () {
      this.vm.inFocusClassName('');
    },

    onClick: function (e) {
      this.calendar.onDayClick(e, this.date);
    },

    onKeydown: function (e) {
      this.calendar.onDayKeydown(e, this.date, this.indexes);
    },

    _view: function (ctrl) {
      var vm = ctrl.vm;

      return m('td.rk-cal__day', {
        key: ctrl.key,
        role: 'gridcell',
        'aria-rowindex': ctrl.indexes.week + 1,
        'aria-colindex': ctrl.indexes.weekday + 1,
        className: ctrl.classNames(),
        tabindex: vm.tabindex(),
        onblur: ctrl.onBlur.bind(ctrl),
        onfocus: ctrl.onFocus.bind(ctrl),
        onclick: function(e) { ctrl.onClick(e) },
        onkeydown: function(e) { ctrl.onKeydown(e) },
        config: ctrl.config.bind(ctrl)
      }, [
        m('span.rk-cal__day__num', { 'aria-label': ctrl.date }, vm.textDate()),
        ctrl.calendar.dayView(ctrl)
      ]);
    }
  };

  var Controls = {
    controller: function (ops) {
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
          this.views[prop] = m.prop(setting);
        }
        this.vm[prop] = m.prop(!!setting);
      }
    },

    view: function (ctrl) {
      var views = ctrl.views;
      var vm = ctrl.vm;

      var getView = function (name) {
        if (!vm[name]()) return '';

        var onClick = ctrl.onClick[name] || noop;
        return m('button.rk-cal__controls__'+name, {
          'aria-label': name,
          onclick: onClick.bind(ctrl)
        }, (views[name]) ? views[name]() : '');
      };

      return m('.rk-cal__controls', [
        m('.rk-cal__controls__wrap', [
          getView('previous'),
          getView('reset'),
          getView('next')
        ])
      ]);
    }
  };

  Controls.controller.prototype = {
    onClick: {
      next: function () {
        this.calendar.next();
      },
      previous: function () {
        this.calendar.previous();
      },
      reset: function () {
        this.calendar.reset();
      }
    }
  };

  return Reckoning;
});