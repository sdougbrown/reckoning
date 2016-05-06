# Reckoning

A Legendary Javascript Calendar Framework

Full Documentation Forthcoming

Check out the [demo page](http://reckoning.douggo.com) for the current feature-set

---

## What is Reckoning?

Reckoning is a data-driven time visualization library.  That's a very fancy way of saying a 'calendar'.

Reckoning is currently built in native JS and has 'vanilla views', but there is a heavy leaning towards integration with [Mithril](http://mithril.js.org), which is a nice small framework that handles smart on-the-fly re-rendering.

### What's the point?

A lot of calendar libraries are either document-driven (i.e. a jQuery plugin) or are difficult to style (i.e. ... a jQuery plugin).  The goal for this project is to produce a highly-reusable calendar library that can be used in a multitude of ways while always looking and feeling amazing.

### Key Features

 - Dynamic range mapping, display & checking
 - Easy theme creation & styling hooks
 - Built-in date parsing & formatting
 - External parsing & formatting API (easy [moment.js](http://momentjs.com) integration)
 - Simple keyboard/click API for calendar interactions
 - Semantic table markup
 - Accessiblity by default
 - Localization by default

### Using Reckoning

Reckoning acts as a constructor and spits out views and simple API endpoints to modify the view on-the-fly.

```javascript
var today = new Date();
var tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

var todayCal = new Reckoning({
  calendar: {
    today: today
  },
  ranges: {
    // intialize with a 'selected' range
    selected: {
      dates: today
    }
  }
});

// add tomorrow as another selected date
todayCal.ranges.selected.setDate(tomorrow);

// add another range to highlight 'today'
todayCal.ranges.today = todayCal.mapRange({ name: 'today', dates: today });

// add a range between two dates
var demoDateFrom = new Date(today);
var demoDateTo = new Date(today);

demoDateFrom.setDate(3);
demoDateTo.setDate(7);

todayCal.ranges.demo = todayCal.mapRange({
  name: 'demo',
  fromDate: demoDateFrom,
  toDate: demoDateTo
});

// add repeating months/dates/weekdays
todayCal.ranges.weekend = todayCal.mapRange({
  name: 'weekend',
  everyWeekday: [0,6]
});
```

And oh yeah, you know all those ranges you've created?  There's a simple method to check if any given date is within one of those ranges...

```javascript
todayCal.ranges.today.inRange(today);
// true
todayCal.ranges.today.inRange(tomorrow);
// false
```

### Constructor Profile

Reckoning currently accepts the following options, with defaults pre-defined for each (see `Reckoning.prototype.defaults`).

```javascript
{
  locale: [String | Array<String>],

  range: {
    id: [String],
    name: String,
    dates: [String<YYYYMMDD> | Array<String<YYYYMMDD>>],
    toDate: [String<YYYYMMDD> | Date],
    fromDate: [String<YYYYMMDD> | Date],
    fixedBetween: [Boolean],
    everyDate: [Number | Array<Number>],
    everyWeekday: [String | Number | Array<String | Number>],
    everyMonth: [String | Number | Array<String | Number>]
  },

  calendar: {
    controls: [Boolean]
    today: [String<YYYYMMDD> | Date],
    dayView: [Function],
    numberOfMonths: [Number],
    startWeekOnDay: [Number],
    startDate: [String<YYYYMMDD> | Date],
    year: [Number],
    month: [Number],
    onDayClick: [Function]
  },

  string: {
    weekday: [String], // narrow/short/long
    month: [String], // narrow/short/long
    year: [String], // numeric/2-digit
    day: [String] // numeric/2-digit
  },

  controls: {
    previous: [Boolean | String | Function],
    reset: [Boolean | String | Function],
    next: [Boolean | String | Function]
  }
}
```
More features are planned (and some already have defined defaults).  When they are fully functional the profile above will be updated.

### Using Reckoning as a Utility

Maybe you don't want to generate an entire calendar and you just want to map a range using Reckoning's API?  Cool dude - I've got you there.  Use `Reckoning` methods directly.

##### Available non-instance methods:
```javascript
Reckoning.mapRange
Reckoning.between
Reckoning.locale
Reckoning.format
Reckoning.parse
```

##### e.g.
```javascript
// explictly map today, tomorrow, and every weekend
var partyTime = Reckoning.mapRange({ dates: [today, tomrorow], everyWeekday: [0,6] });
partyTime.inRange(today);
// true - time to party
```

### Using with Mithril

Mithril expects every `component` to have a `controller` and a `view` (at least).

Reckoning expects to live in either your controller or model layer, and will provide you with a `view` function that you can pass to your application's view, and can thereafter be displayed using `m.render` or `m.mount`.  It *could* act as its own controller, but this is unwise - (how will you interact with a Reckoning instance that way?)

This might sound difficult to wrap your head around, but it gives everyone the most amount of flexibility.  The smallest possible mountable calendar might look something like...

```javascript
// could be condensed to one line but then who could read it? :)
// don't do this in the real world - you'll make me sad.
m.mount(document.body, {
  controller: function () {
    this.rk = new Reckoning({calendar: true});
  },
  view: function (ctrl) {
    return ctrl.rk.view();
  }
});
```

Generally you'd more likely want to access the calendar or timeline view separately and wrap them in different page components, though...

```javascript
m.mount(document.body, {
  controller: function () {
    this.rk = new Reckoning({
      calendar: true,
      timeline: true
    });
  },
  view: function (ctrl) {
    var rk = ctrl.rk;
    return m('div', [
      rk.timeline.view(),
      rk.calendar.view()
    ]);
  }
});
```

### Roadmap

 - Test Suite
 - Timeline Visuals
 - Second Sample Theme
 - Alternate Implementations - React? Riot?

