(function (Reckoning, React) {

  Reckoning.react = Reckoning.react || {};

  var rc = React.createElement;

  var Calendar = Reckoning.react.Calendar = React.createClass({
    getInitialState: function () {
      var vm = this.props.calendar.vm;

      return {
        month: vm.month(),
        year: vm.year()
      };
    },

    _bindHandlers: function(props) {
      var calendar = props.calendar;
      this._handleFocus = calendar.onFocus.bind(calendar);
    },

    componentWillMount: function() {
      this._bindHandlers(this.props);
    },

    componentWillReceiveProps: function(newProps) {
      this._bindHandlers(newProps);

      var vm = newProps.calendar.vm;

      this.setState({
        month: vm.month(),
        year: vm.year(),
      });
    },

    handleDayKeydown: function (date) {
      var dayKeydown = this.props.handleDayKeydown;
      if (dayKeydown) dayKeydown(date);
    },

    handleDayClick: function (date) {
      var dayClick = this.props.handleDayClick;
      if (dayClick) dayClick(date);
    },

    handleControlsClick: function () {
      var vm = this.props.calendar.vm;

      this.setState({
        month: vm.month(),
        year: vm.year()
      });
    },

    handleCalendarFocus: function () {
      return this._handleFocus && this._handleFocus();
    },

    render: function () {
      var calendar = this.props.calendar;
      var handleDayClick = this.handleDayClick;
      var handleDayKeydown = this.handleDayKeydown;
      var handleControlsClick = this.handleControlsClick;

      function getControls () {
        if (!calendar.calendarControls) return '';
        return rc(Controls, {
          controls: calendar.calendarControls,
          onClick: handleControlsClick
        });
      };

      return rc('div', {
        className: 'rk-cal',
        onFocus: this.handleCalendarFocus,
        tabIndex: '0'
      },
        getControls(),
        calendar.calendarMonths.map(function(month) {
          return rc(Month, {
            month: month,
            calendar: calendar,
            key: month.key,
            handleDayClick: handleDayClick,
            handleDayKeydown: handleDayKeydown
          });
        })
      );
    }
  });


  var Month = function (props) {
    var handleDayClick = props.handleDayClick;
    var handleDayKeydown = props.handleDayKeydown;
    var month = props.month;
    var vm = month.vm;

    return rc('table', {
      key: month.key,
      role: 'grid',
      className: 'rk-cal__month ' + vm.className()
    },
      rc('thead', {
        role: 'rowgroup',
        className: 'rk-cal__head'
      },
        rc('tr', {
          role: 'row',
          className: 'rk-cal__head__row rk-cal__head__row--month'
        },
          rc('th', {
            colSpan: 7,
            className: 'rk-cal__head__month'
          }, vm.title())
        ),
        rc('tr', {
          role: 'row',
          className: 'rk-cal__head__row rk-cal__head__row--weekday'
        },
          month.weekdays().map(function(weekday, index) {
            return rc('th', {
              className: 'rk-cal__head__weekday',
              key: index
            },
              rc('span', { role: 'columnheader' }, weekday)
            );
          })
        )
      ),
      rc('tbody', {
        role: 'rowgroup',
        className: 'rk-cal__body'
      },
        vm.weeks.map(function(week, index) {
          return rc('tr', {
            key: index,
            role: 'row',
            className: 'rk-cal__body__row'
          },
            week.map(function(day) {
              return rc(Day, { day: day, key: day.key, handleDayClick: handleDayClick });
            })
          );
        })
      )
    );
  };


  var Day = React.createClass({

    handleBlur: function () {
      this.props.day.onBlur.call(this.props.day);
    },

    handleFocus: function () {
      this.props.day.onFocus.call(this.props.day);
    },

    handleClick: function () {
      var day = this.props.day;
      day.onClick(this);

      this.props.handleDayClick(day.date);
    },

    handleKeydown: function () {
      var day = this.props.day;
      day.onKeydown(this);

      this.props.handleDayKeydown(day.date);
    },

    render: function () {
      var day = this.props.day;
      var vm = day.vm;
      var indexes = day.indexes;

      return rc('td', {
        key: day.key,
        role: 'gridcell',
        'aria-rowindex': indexes.week + 1,
        'aria-colindex': indexes.weekday + 1,
        className: 'rk-cal__day ' + day.classNames(),
        tabIndex: vm.tabindex(),
        onBlur: this.handleBlur,
        onFocus: this.handleFocus,
        onClick: this.handleClick,
        onKeyDown: this.handleKeydown
      },
        rc('span', {
          'aria-label': day.date,
          className: 'rk-cal__day__num'
        }, vm.textDate())
      );
    }
  });


  var Controls = function (props) {
    var controls = props.controls;
    var onClick = props.onClick;

    return rc('div', {
      className: 'rk-cal__controls'
    },
      rc('div', {
        className: 'rk-cal__controls__wrap'
      },
        rc(Control, { name: 'previous', controls: controls, onClick: onClick }),
        rc(Control, { name: 'reset', controls: controls, onClick: onClick }),
        rc(Control, { name: 'next', controls: controls, onClick: onClick })
      )
    );
  };


  var Control = function (props) {
    var name = props.name;
    var ctrl = props.controls;
    var views = ctrl.views;
    var vm = ctrl.vm;

    if (!vm[name]()) return null;

    var onClick = ctrl.onClick[name] || noop;
    return rc('button', {
      'aria-label': name,
      className: 'rk-cal__controls__'+name,
      onClick: onClick.bind(ctrl, props.onClick)
    }, (views[name]) ? views[name]() : '');
  };

})(Reckoning, React);
