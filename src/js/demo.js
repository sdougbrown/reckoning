(function () {

  var demo = {};

  demo.controller = function () {
    var today = new Date(2016, 04, 15);

    // actions
    this.toggleDateSelection = function (rk, date) {
      rk.ranges.selected.setDate(date);
    };

    this.toggleValidDateSelection = function (rk, date) {
      // this is kind of an extreme example
      if (rk.ranges.invalid.inRange(date)
         || rk.ranges.invalidBefore.inRange(date)
         || rk.ranges.invalidAfter.inRange(date)) {
        return false;
      }

      rk.ranges.selected.setDate(date);
    };

    // instances
    this.basicCal = new Reckoning({calendar: true});

    this.todayCal = new Reckoning({
      calendar: {
        today: today,
        startDate: today
      },
      ranges: {
        today: { dates: today }
      }
    });

    this.selectCal = new Reckoning({
      calendar: {
        today: today,
        startDate: today,
        onDayClick: this.toggleDateSelection
      },
      ranges: {
        today: { dates: today },
        selected: {}
      }
    });

    this.restrictedCal = new Reckoning({
      calendar: {
        today: today,
        startDate: today,
        onDayClick: this.toggleValidDateSelection
      },
      ranges: {
        today: { dates: today },
        selected: {},
        invalidBefore: { toDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 10) },
        invalidAfter: { fromDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5) },
        invalid: { dates: [new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1), new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2)] }
      }
    });

  };

  demo.view = function (ctrl) {
    return m('.calendar-demo-wrap', [
      m('h1', 'Reckoning Calendar Examples'),
      m('h4', 'Basic Calendar View'),
      ctrl.basicCal.calendar.view(),
      m('h4', 'Highlight "Today"'),
      ctrl.todayCal.calendar.view(),
      m('h4', 'Selections'),
      ctrl.selectCal.calendar.view(),
      m('h4', 'Invalid Ranges with Selections'),
      ctrl.restrictedCal.calendar.view()
    ]);
  };

  m.mount(document.body, demo);

})(this);
