(function () {

  var demo = {};

  demo.controller = function () {
    var today = new Date(2016, 04, 15);

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
  };

  demo.view = function (ctrl) {
    return m('.calendar-demo-wrap', [
      ctrl.basicCal.calendar.view(),
      ctrl.todayCal.calendar.view()
    ]);
  };

  m.mount(document.body, demo);

})(this);
