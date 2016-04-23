(function () {

  var demo = {};

  demo.controller = function () {
    var today = new Date();
    var fakeToday = new Date(2016, 04, 15);

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
    this.basicCal = new Reckoning({ calendar: true });
    this.basicLocalizedCal = new Reckoning({ locale: 'ja', calendar: true });

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
        selected: {}
      }
    });

    this.sharedRangeCal = new Reckoning({
      calendar: {
        today: today,
        startDate: today,
        onDayClick: this.toggleDateSelection
      },
      mappedRanges: this.selectCal.ranges
    });

    var invalidBeforeDate = new Date(fakeToday);
    var invalidAfterDate = new Date(fakeToday);
    var invalidDate1 = new Date(fakeToday);
    var invalidDate2 = new Date(fakeToday);

    invalidBeforeDate.setDate(fakeToday.getDate() - 12);
    invalidAfterDate.setDate(fakeToday.getDate() + 7);
    invalidDate1.setDate(fakeToday.getDate() + 1);
    invalidDate2.setDate(fakeToday.getDate() - 4);

    this.restrictedCal = new Reckoning({
      calendar: {
        today: fakeToday,
        startDate: fakeToday,
        onDayClick: this.toggleValidDateSelection
      },
      ranges: {
        today: { dates: fakeToday },
        selected: {},
        invalidBefore: {
          name: 'invalid',
          toDate: invalidBeforeDate
        },
        invalidAfter: {
          name: 'invalid',
          fromDate: invalidAfterDate
        },
        invalid: {
          dates: [ invalidDate1, invalidDate2 ]
        }
      }
    });
  };

  demo.view = function (ctrl) {
    return m('.calendar-demo-wrap', [
      m('h1', 'Reckoning Calendar Examples'),
      m('h4', 'Basic Calendar View'),
      ctrl.basicCal.calendar.view(),
      m('h4', 'Custom Locale Calendar'),
      ctrl.basicLocalizedCal.calendar.view(),
      m('h4', 'Highlight "Today"'),
      ctrl.todayCal.calendar.view(),
      m('h4', 'Selections'),
      ctrl.selectCal.calendar.view(),
      m('h4', 'Shared Range Selections'),
      ctrl.sharedRangeCal.calendar.view(),
      m('h4', 'Invalid Ranges with Selections'),
      ctrl.restrictedCal.calendar.view()
    ]);
  };

  m.mount(document.body, demo);

})(this);
