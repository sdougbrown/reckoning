(function (Reckoning) {

  // views in mithril-style templates
  var views = {
    main: function (ctrl) {
      return m('.rk', [
        (ctrl.timeline) ? ctrl.timeline.view() : '',
        (ctrl.calendar) ? ctrl.calendar.view() : ''
      ]);
    },
    calendar: function (ctrl) {
      return m('.rk-cal', {
        onfocus: ctrl.onFocus.bind(ctrl),
        tabindex: '0'
      }, [
        (ctrl.calendarControls) ? ctrl.calendarControls.view() : '',
        ctrl.calendarMonths.map(function(month) {
          return (ctrl.monthView) ? ctrl.monthView(ctrl, month) : month.view();
        })
      ]);
    },
    month: function (ctrl) {
      var vm = ctrl.vm;

      return m('table.rk-cal__month', {
        className: vm.className(),
        role: 'grid',
        key: ctrl.key
      }, [
        m('thead.rk-cal__head', { role: 'rowgroup' }, [
          m('tr.rk-cal__head__row', {
            role: 'row',
            className: 'rk-cal__head__row--month'
          }, [
            m('th.rk-cal__head__month', { colspan: 7 }, vm.title()),
          ]),
          m('tr.rk-cal__head__row', {
            role: 'row',
            className: 'rk-cal__head__row--weekday'
          }, [
            ctrl.weekdays().map(function(day) {
              return m('th.rk-cal__head__weekday', [
                m('span', { role: 'columnheader' }, day)
              ]);
            })
          ])
        ]),
        m('tbody.rk-cal__body', { role: 'rowgroup' }, [
          vm.weeks.map(function(week) {
            return m('tr.rk-cal__body__row', { role: 'row' }, [
              week.map(function(day) {
                return day.view();
              })
            ]);
          })
        ])
      ]);
    },
    day: function (ctrl) {
      var vm = ctrl.vm;
      var handlers = ctrl.handlers;
      var indexes = ctrl.indexes;
      var calendar = ctrl.calendar;

      return m('td.rk-cal__day', {
        key: ctrl.key,
        role: 'gridcell',
        'aria-rowindex': indexes.week + 1,
        'aria-colindex': indexes.weekday + 1,
        className: ctrl.classNames(),
        tabindex: vm.tabindex(),
        onblur: handlers.onBlur,
        onfocus: handlers.onFocus,
        onclick: handlers.onClick,
        onkeydown: handlers.onKeydown,
        config: ctrl.config.bind(ctrl)
      }, [
        m('span.rk-cal__day__num', { 'aria-label': ctrl.date }, vm.textDate()),
        (calendar.dayView) ? calendar.dayView(ctrl) : ''
      ]);
    },
    controls: function (ctrl) {
      var views = ctrl.views;
      var vm = ctrl.vm;

      var getView = function (name) {
        if (!vm[name]()) return '';

        var onClick = ctrl.onClick[name] || noop;
        return m('button.rk-cal__controls__'+name, {
          'aria-label': name,
          onclick: onClick.bind(ctrl)
        }, (views[name]) ? views[name]() : '');
      };

      return m('.rk-cal__controls', [
        m('.rk-cal__controls__wrap', [
          getView('previous'),
          getView('reset'),
          getView('next')
        ])
      ]);
    }
  };

  // actual DOM stuff
  var configs = {
    // 'this' context is resolved when appended to the prototype
    day: function (element) {
      if (element && this.vm.focus()) element.focus();
    }
  };

  Reckoning.prototype._view = views.main;

  var components = Reckoning.prototype.components;

  components.Calendar.prototype._view = views.calendar;
  components.Controls.prototype._view = views.controls;
  components.Month.prototype._view = views.month;
  components.Day.prototype._view = views.day;
  components.Day.prototype.config = configs.day;

})(Reckoning);
