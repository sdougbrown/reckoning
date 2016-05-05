(function () {

  Reckoning.prototype._redraw = refreshView;

  var today = new Date();

  var demoEl = document.getElementById('demo');
  var demoCalView;

  var toggleDateSelection = function (e, rk, date) {
    rk.ranges.selected.setDate(date);
    refreshView();
  };

  var demoCal = new Reckoning({
    calendar: {
      controls: {
        previous: true,
        next: true,
        reset: true
      },
      onDayClick: toggleDateSelection,
      numberOfMonths: 2,
      today: today,
      startDate: today
    },
    ranges: {
      today: { dates: today },
      selected: {}
    }
  });

  function refreshView () {
    var newView = demoCal.view();
    demoEl.replaceChild(newView, demoCalView);
    demoCalView = newView;
  };

  demoCalView = demoEl.appendChild(demoCal.view());

})(this);
