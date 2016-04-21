(function (global, factory) {

  var Reckoning = factory(global);
  var reckoning = new Reckoning();

  // bind to the global scope without polyfills
  if (typeof module === "object" && module != null && module.exports) {
    module.exports = Reckoning;
    module.exports = reckoning;
  } else if (typeof define === "function" && define.amd) {
    define(function () { return Reckoning; });
    define(function () { return reckoning; });
  } else {
    global.Reckoning = Reckoning;
    global.reckoning = reckoning;
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

    return function(key) {
      if (!map[key]) {
        map[key] = {};
        for (var prop in ops) {
          map[key][prop] = m.prop(ops[prop]());
        }
      }
      return map[key]
    };
  };

  function getLocale (navigator) {
    navigator = navigator || global.navigator;

    return navigator.languages || navigatior.userLanguage || navigator.language || 'en-US';
  };


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

    this.string = assign(this.defaults.string, attrs.string);
    this.days = (!!attrs.days) ? m.prop(attrs.days) : m.prop(this.mapDays());
    this.months = (!!attrs.months) ? m.prop(attrs.months) : m.prop(this.mapMonths());

    if (attrs.calendar) {
      this.calendar = new Calendar(this, assign(this.defaults.calendar, attrs.calendar));
    }
    if (attrs.timeline) {
      this.timeline = new Timeline(this, assign(this.defaults.timeline, attrs.timeline));
    }
  };

  Reckoning.prototype = {
    string: {},

    constructor: Reckoning,

    defaults: {
      locale: getLocale(),

      range: {
        name: null,
        dates: null,
        events: null,
        legend: null,
        toDate: null,
        fromDate: null,
        everyDate: null,
        everyWeekday: null,
        everyMonth: null
      },

      timeline: {
        today: null,
        units: 'day'
      },

      calendar: {
        today: null,
        numberOfMonths: 1,
        startWeekOnDay: 0,
        month: 0
      },

      string: {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
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

      if (canUseLocales) {
        var locale = ops.locale || this.locale();
        var string = ops.string || this.string || this.defaults.string;
        return date.toLocaleDateString(locale, string);
      }

      // manually build the formatted string
      return '' + this.getDay(date) + ', ' + this.getMonth(date) + date.getDate() + ', ' + date.getFullYear();
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
      // cannot map via locale - send english
      if (!canUseLocales) return MONTHS;

      return this._getLocaleMap('month', ops);
    },

    mapDays: function (ops) {
      // cannot map via locale - send english
      if (!canUseLocales) return DAYS;

      return this._getLocaleMap('weekday', ops);
    },

    mapRange: function (range, ops) {
      return new DateRange(this, range, ops);
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
      var date = new Date(2015, 1);

      // acceptable type maps hardcoded here
      var typeMap = {
        weekday: {
          adjust: date.setDate,
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

      var getString = function (value) {
        date.adjust(value);

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
    }
  };


  // child constructors
  var DateRange = function (parent, range, ops) {
    this.parent = parent;

    range = range || {};
    ops = ops || {};

    // parse and assign to this._*
    this.fromDate(range.fromDate);
    this.toDate(range.toDate);

    // create fintie maps
    this.byDate = (ops.between) ? this._getMapBetween(range.fromDate, range.toDate) : {};
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

    setDate: function (date, value) {
      date = this.parent.parse(date);
      if (!date) return;

      this.byDate[this.parent._getDateKey(date)] = value;
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
      date = this.parent.parse(date);
      if (!date) return false;

      var isMatch = !!this.byDate[this.parent._getDateKey(date)];
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
      if (!value) return null;

      var key = parseInt(value);

      if (key !== NaN) {
        return key;
      }

      if (type === 'month') {
        var index = this.parent.months().indexOf(value);
        return (index > -1) ? index + 1 : null;
      }

      if (type === 'weekday') {
        var index = this.parent.days().indexOf(value);
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
      if (!everyValue || isObject(everyValue)) return null;

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
    }
  };

  var Timeline = function (parent, ops) {
    this.parent = parent;
  };

  Timeline.prototype = {
    constructor: Timeline,

    unitMap: {
      day: Date.prototype.getDate,
      month: Date.prototype.getMonth,
      year: Date.prototype.getFullYear
    }
  };

  var Calendar = function (parent, ops) {
    this.parent = parent;

    this.today = m.prop(ops.today);
    this.numberOfMonths = m.prop(ops.numberOfMonths);
    this.startWeekOnDay = m.prop(ops.startWeekOnDay);
    this.month = m.prop(ops.month);
  };

  Calendar.prototype = {
    constructor: Calendar
  };

  var Month = function (parent, ops) {
    this.parent = parent;
  };

  Month.prototype = {
    constructor: Month
  };

  var Day = function (parent, ops) {
    this.parent = parent;
  };

  Day.prototype = {
    constructor: Day
  };

  return Reckoning;
});
