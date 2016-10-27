(function (Reckoning) {

  var d = document;
  // simple 'vanilla template'
  // no validation - be careful
  function vt (tag, pairs, appendTo) {
    var el = d.createElement(tag);
    if (pairs) {
      for (var prop in pairs) {
        el.setAttribute( prop, pairs[prop] );
      }
    }
    if (appendTo) appendTo.appendChild(el);
    return el;
  };
  function vx (text, appendTo) {
    var tx = d.createTextNode(text);
    if (appendTo) appendTo.appendChild(tx);
    return tx;
  };

  // views in vanilla templates
  var views = {
    main: function (ctrl) {
      var rkDiv = vt('div', { 'class': 'rk' });
      if (ctrl.timeline) rkDiv.appendChild(ctrl.timeline.view());
      if (ctrl.calendar) rkDiv.appendChild(ctrl.calendar.view());
      return rkDiv;
    },
    calendar: function (ctrl) {
      var cal = vt('div', {
        'class': 'rk-cal',
        tabindex: '0'
      });
      cal.onfocus = ctrl.onFocus.bind(ctrl);

      if (ctrl.calendarControls) cal.appendChild(ctrl.calendarControls.view());

      ctrl.calendarMonths.forEach(function(month) {
        var monthView = (ctrl.monthView) ? ctrl.monthView(ctrl, month) : month.view();
        cal.appendChild(monthView);
      });

      return cal;
    },
    month: function (ctrl) {
      var vm = ctrl.vm;

      var table = vt('table', {
        'class': 'rk-cal__month ' + vm.className(),
        role: 'grid'
      });

      var thead = vt('thead', {
        'class': 'rk-cal__head',
        role: 'rowgroup'
      }, table);

      var monthRow = vt('tr', {
        role: 'row',
        'class': 'rk-cal__head__row rk-cal__head__row--month'
      }, thead);

      var monthCell = vt('th', {
        'class': 'rk-cal__head__month',
        colspan: 7
      }, monthRow);
      var monthTitle = vx(vm.title(), monthCell);

      var weekdayRow = vt('tr', {
        'class': 'rk-cal__head__row',
        role: 'row',
        'class': 'rk-cal__head__row--weekday'
      }, thead);

      ctrl.weekdays().forEach(function(day) {
        var weekdayCell = vt('th', {
         'class': 'rk-cal__head__weekday'
        }, weekdayRow);
        var weekdaySpan = vt('span', {
          role: 'columnheader'
        }, weekdayCell);
        vx(day, weekdaySpan);
      });

      var tbody = vt('tbody', {
        'class': 'rk-cal__body',
        role: 'rowgroup'
      }, table);

      vm.weeks.forEach(function(week) {
        var weekRow = vt('tr', {
          'class': 'rk-cal__body__row',
          role: 'row'
        });
        week.forEach(function(day) {
          weekRow.appendChild(day.view());
        });
        tbody.appendChild(weekRow);
      });

      return table;
    },
    day: function (ctrl) {
      var vm = ctrl.vm;
      var handlers = ctrl.handlers;
      var indexes = ctrl.indexes;
      var calendar = ctrl.calendar;

      var dayCell = vt('td', {
        'class': 'rk-cal__day ' + ctrl.classNames(),
        key: ctrl.key,
        role: 'gridcell',
        'aria-rowindex': indexes.week + 1,
        'aria-colindex': indexes.weekday + 1,
        tabindex: vm.tabindex()
      });

      dayCell.onblur = handlers.onBlur;
      dayCell.onfocus = handlers.onFocus;
      dayCell.onclick = handlers.onClick;
      dayCell.onkeydown = handlers.onKeydown;

      var dayNum = vt('span', {
        'class': 'rk-cal__day__num',
        'aria-label': ctrl.date
      }, dayCell);

      vx(vm.textDate(), dayNum);

      if (calendar.dayView) dayCell.appendChild(calendar.dayView(ctrl));

      return dayCell;
    },
    controls: function (ctrl) {
      var views = ctrl.views;
      var vm = ctrl.vm;

      var getView = function (name) {
        if (!vm[name]()) return '';

        var onClick = ctrl.onClick[name] || noop;

        var button = vt('button', {
          'class': 'rk-cal__controls__'+name,
          'aria-label': name
        });

        button.onclick = onClick.bind(ctrl);

        if (views[name]) vx(views[name](), button);

        return button;
      };

      var controls = vt('div', {
        'class': 'rk-cal__controls'
      });

      var controlsWrap = vt('div', {
        'class': 'rk-cal__controls__wrap'
      }, controls);

      var prev = getView('previous');
      if (prev) controlsWrap.appendChild(prev);

      var reset = getView('reset');
      if (reset) controlsWrap.appendChild(reset);

      var next = getView('next');
      if (next) controlsWrap.appendChild(next);

      return controls;
    }
  };

  Reckoning.prototype._view = views.main;

  var components = Reckoning.prototype.components;

  components.Calendar.prototype._view = views.calendar;
  components.Controls.prototype._view = views.controls;
  components.Month.prototype._view = views.month;
  components.Day.prototype._view = views.day;

})(Reckoning);

