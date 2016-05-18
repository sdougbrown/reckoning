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

    render: function () {
      var calendar = this.props.calendar;
      var handleDayClick = this.handleDayClick;
      var handleDayKeydown = this.handleDayKeydown;

      function getControls () {
        if (!calendar.calendarControls) return '';
        return rc(Controls, {
          controls: calendar.calendarControls,
          handleClick: this.handleControlsClick
        });
      };

      return rc('div', {
        className: 'rk-cal',
        onFocus: calendar.onFocus.bind(calendar),
        tabindex: '0'
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


  var Month = React.createClass({
    render: function () {
      var handleDayClick = this.props.handleDayClick;
      var handleDayKeydown = this.props.handleDayKeydown;
      var month = this.props.month;
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
    }
  });


  var Day = React.createClass({

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
        tabindex: vm.tabindex(),
        onBlur: day.onBlur.bind(day),
        onFocus: day.onFocus.bind(day),
        onClick: this.handleClick,
        onKeydown: this.handleKeydown
      },
        rc('span', {
          'aria-label': day.date,
          className: 'rk-cal__day__num'
        }, vm.textDate())
      );
    }
  });


  var Controls = React.createClass({
    render: function () {
      var controls = this.props.controls;
      var handleClick = this.props.handleClick;

      return rc('div', {
        className: 'rk-cal__controls'
      },
        rc('div', {
          className: 'rk-cal__controls__wrap'
        },
          rc(Control, { name: 'previous', controls: controls, handleClick: handleClick }),
          rc(Control, { name: 'reset', controls: controls, handleClick: handleClick }),
          rc(Control, { name: 'next', controls: controls, handleClick: handleClick })
        )
      );
    }
  });


  var Control = React.createClass({
    render: function () {
      var name = this.props.name;
      var ctrl = this.props.controls;
      var views = ctrl.views;
      var vm = ctrl.vm;

      if (!vm[name]()) return '';

      var onClick = ctrl.onClick[name] || noop;
      return rc('button', {
        'aria-label': name,
        className: 'rk-cal__controls__'+name,
        onClick: onClick.bind(ctrl, this.props.handleClick)
      }, (views[name]) ? views[name]() : '');
    }
  });

})(Reckoning, React);
