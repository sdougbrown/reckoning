(function (global, factory) {

  var Reckoning = factory();

  // bind to the global scope without polyfills
  if (typeof module === "object" && module != null && module.exports) {
    module.exports = Reckoning;
  } else if (typeof define === "function" && define.amd) {
    define(function () { return Reckoning; });
  } else {
    global.Reckoning = Reckoning;
  }

})(typeof window !== "undefined" ? window : {}, function () {
  'use strict';

  // simple non-locale maps
  //
  // Reckoning will fall back to this
  // if locale support fails in the browser
  // also, used create locale maps
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // utils - borrowed concept from mithril core.
  var hasOwn = {}.hasOwnProperty;
  var type = {}.toString;

  function isFunction (object) {
    return typeof object === "function";
  };

  function isObject (object) {
    return type.call(object) === "[object Object]";
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
  Reckoning = function (attrs) {
    attrs = attrs || {};

    // set locale from passed attr (falls back internally)
    this.locale(attrs.locale);

    this.string = assign(this.defaults.string, attrs.string);
    this.months = (!!attrs.months) ? m.prop(attrs.months) : m.prop(this.mapMonths());
    this.days = (!!attrs.days) ? m.prop(attrs.days) : m.prop(this.mapDays());

    if (attrs.calendar) {
      this.calendar = new Calendar(this, assign(this.defaults.calendar, attrs.calendar));
    }
    if (attrs.timeline) {
      this.timeline = new Timeline(this, assign(this.defaults.timeline, attrs.timeline));
    }

    return {
      calendar: this.calendar,
      timeline: this.timeline,
      months: this.months,
      days: this.days,

      mapRange: this.mapRange,
      mapMonths: this.mapMonths,
      mapDays: this.mapDays,

      locale: this.locale,
      format: this.format,
      parse: this.parse,

      getMonth: this.getMonth,
      getDay: this.getDay
    };
  };

  Reckoning.prototype = {
    string: {},

    constructor: Reckoning,

    defaults: {
      locale: navigatior.userLanguage || navigator.language || 'en-US',

      range: {
        name: null,
        dates: null,
        events: null,
        legend: null,
        toDate: null,
        fromDate: null,
        everyDay: null,
        everyDate: null,
        everyMonth: null
      },

      timeline: {
        today: null,
        units: 'day'
      },

      calendar: {
        today: null,
        months: 1,
        startWeekOnDay: 0,
        startMonth: 0
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
      // bail if invalid
      if (!date || !isString(date)) return null;
      // pass through date objects
      if (isDate(date)) return date;
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
      date = this.parse(date);
      if (!date) return null;
      if (this._format) return this._format(date);

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
      var map = {};

      return function (key) {
        if (!map[key]) {
          map[key] = this._getLocaleMap('month', ops);
        }
        return map[key];
      };
    },

    mapDays: function (ops) {
      // cannot map via locale - send english
      if (!canUseLocales) return DAYS;
      var map = {};

      return function (key) {
        if (!map[key]) {
          map[key] = this._getLocaleMap('weekday', ops);
        }
        return map[key];
      };
    },

    mapRange: function (range) {

    },

    _getLocaleMap: function (type, ops) {
      ops = ops || {};
      var string = ops.string[type] || this.string[type] || this.defaults.string[type];
      var locale = ops.locale || this.locale();
      var map = [];

      // arbitrary starting point
      // Feb 2015 has days that map nicely to weekdays
      // (1st is a Sunday)
      var date = new Date(2015, 01);

      // acceptable type maps hardcoded here
      var typeMap = {
        weekday: {
          adjust: date.setDate,
          index: DAYS
        },
        month: {
          adjust: date.setMonth
          index: MONTHS
        }
      };

      // bail if type is not pre-defined
      if (typeMap[type]) return null;

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


    },

  };

  // child constructors
  var Range = function (parent, ops) {
    this.parent = parent;
  },

  Range.prototype = {
    constructor: Range
  },

  var Timeline = function (parent, ops) {
    this.parent = parent;
  },

  Timeline.prototype = {
    constructor: Timeline,

    unitMap: {
      day: Date.prototype.getDate,
      month: Date.prototype.getMonth,
      year: Date.prototype.getFullYear
    }
  },

  var Calendar = function (parent, ops) {
    this.parent = parent;
  },

  Calendar.prototype = {
    constructor: Calendar
  },

  var Month = function (parent, ops) {
    this.parent = parent;
  },

  Month.prototype = {
    constructor: Month
  };

  var Day = function (parent, ops) {
    this.parent = parent;
  },

  Day.prototype = {
    constructor: Day
  };

  return Reckoning;
});
