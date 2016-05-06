(function () {

  var today = new Date();

  var DemoRanges = {
    today: Reckoning.mapRange({ name: 'today', dates: today }),
    selected: Reckoning.mapRange({ name: 'selected' })
  };

  var toggleSelected = function (e, rk, date) {
    DemoRanges.selected.setDate(date);
  };

  var Calendar = React.createClass({
    render: function () {
      return React.createElement(Reckoning.react.Calendar, { calendar: this.props.rk.calendar });
    }
  });

  var RangeCalendar = React.createClass({
    getInitialState: function () {
      return DemoRanges;
    },

    handleDayClick: function (date) {
      this.setState(DemoRanges);
    },

    render: function () {
      return React.createElement(Reckoning.react.Calendar, { calendar: this.props.rk.calendar, handleDayClick: this.handleDayClick });
    }
  });

  var basicCal = new Reckoning({ calendar: true });

  var selectCal = new Reckoning({
    mappedRanges: DemoRanges,
    calendar: {
      controls: {
        previous: true,
        next: true,
        reset: true
      },
      onDayClick: toggleSelected,
      numberOfMonths: 2,
      today: today,
      startDate: today
    }
  });

  var Demo = React.createElement('div', null,
    React.createElement('div', { className: 'grid-cal' },
      React.createElement('h4', null, 'Basic Calendar View'),
      React.createElement(Calendar, { rk: basicCal })
    ),
    React.createElement('div', { className: 'grid-cal--wide' },
      React.createElement('h4', null, 'Multi-Month Selection Calendar'),
      React.createElement(RangeCalendar, { rk: selectCal })
    )
  );

  ReactDOM.render(Demo, document.getElementById('demo'));

})(this);
