var Reckoning = function (ops) {

};

Reckoning.prototype = {
  locale: navigatior.userLanguage || navigator.language,

  defaults: {
    invalidDates: [],
    invalidBefore: '',
    invalidAfter: '',

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

  mapViewModel: function (ops) {
    var map = {}
    return function(key) {
      if (!map[key]) {
        map[key] = {}
        for (var prop in ops) map[key][prop] = m.prop(ops[prop]())
      }
    return map[key]
    }
  },

  Month: function (ops) {

  },

  Day: function (ops) {

  }
};

Reckoning.Month.prototype = {

};

Reckoning.Day.prototype = {

};
