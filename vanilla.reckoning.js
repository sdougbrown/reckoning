(function (factory) {

  var d = document;
  var dce = document.createElement;
  var dct = document.createTextNode;

  // simple 'vanilla template'
  // no validation - be careful
  function vt = (tag, pairs, appendTo) {
    var el = dce(tag);
    if (pairs) for (var prop in pairs) el.setAttribute(prop: pairs[prop]);
    if (appendTo) appendTo.appendChild(el);
    return el;
  };
  function vx = (text, appendTo) {
    var tx = dct(text);
    if (appendTo) appendTo.appendChild(tx);
    return tx;
  };

  // views in vanilla templates
  var views = {
    main: function (ctrl) {
      var rkDiv = vt('div', { className: 'rk' });
      if (ctrl.timeline) rkDiv.appendChild(ctrl.timeline.view());
      if (ctrl.calendar) rkDiv.appendChild(ctrl.calendar.view());
      return rkDiv;
    },
    calendar: function (ctrl) {
      var cal = vt('div', {
        className: 'rk-cal',
        onfocus: ctrl.onFocus.bind(ctrl),
        tabindex: '0'
      });

      if (ctrl.calendarControls) cal.appendChild(ctrl.calendarControls.view());

      ctrl.calendarMonths.forEach(function(month) {
        var monthView = (ctrl.monthView) ? ctrl.monthView(ctrl, month) : month.view();
        cal.appendChild(monthView);
      });

      return cal;
    },
    month: function (ctrl) {
      var vm = ctrl.vm;
      var calVM = ctrl.calendar.vm;

      var table = vt('table', {
        className: 'rk-cal__month ' + vm.className(),
        role: 'grid'
      });

      var thead = vt('thead.rk-cal__head', {
        role: 'rowgroup'
      }, table);

      var monthRow = vt('tr', {
        role: 'row',
        className: 'rk-cal__head__row rk-cal__head__row--month'
      }, thead);

      var monthCell = vt('th.rk-cal__head__month', { colspan: 7 }, monthRow);
      var monthTitle = vx(vm.title(), monthCell);

      var weekdayRow = vt('tr', {
        className: 'rk-cal__head__row',
        role: 'row',
        className: 'rk-cal__head__row--weekday'
      }, thead);

      calVM.weekdays().forEach(function(day) {
        var weekdayCell = vt('th', {
         className: 'rk-cal__head__weekday'
        }, weekdayRow);
        var weekdaySpan = vt('span', {
          role: 'columnheader'
        }, weekdayCell);
        vx(day, weekdaySpan);
      });

      var tbody = vt('tbody', {
        className: 'rk-cal__body',
        role: 'rowgroup'
      }, table);

      vm.weeks.forEach(function(week) {
        var weekRow = vt('tr', {
          className: 'rk-cal__body__row',
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
      var indexes = ctrl.indexes;
      var calendar = ctrl.calendar;

      var dayCell = vt('td', {
        className: 'rk-cal__day ' + ctrl.classNames(),
        key: ctrl.key,
        role: 'gridcell',
        'aria-rowindex': indexes.week + 1,
        'aria-colindex': indexes.weekday + 1,
        tabindex: vm.tabindex(),
        onblur: ctrl.onBlur.bind(ctrl),
        onfocus: ctrl.onFocus.bind(ctrl),
        onclick: function(e) { ctrl.onClick(e) },
        onkeydown: function(e) { ctrl.onKeydown(e) }
      });

      var dayNum = vt('span', {
        className: 'rk-cal__day__num',
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

        var button = vt('button' {
          className: 'rk-cal__controls__'+name,
          'aria-label': name,
          onclick: onClick.bind(ctrl)
        });

        if (views[name]) vx(views[name](), button);

        return button;
      };

      var controls = vt('div', {
        className: 'rk-cal__controls'
      });

      var controlsWrap = vt('div', {
        className: 'rk-cal__controls__wrap'
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

  factory.prototype._view = views.main;

  var components = factory.prototype.components;

  components.Calendar.prototype._view = views.calendar;
  components.Controls.prototype._view = views.controls;
  components.Month.prototype._view = views.month;
  components.Day.prototype._view = views.day;

})(Reckoning);

