# Reckoning

A Legendary Javascript Calendar Framework

Full Documentation Forthcoming

Check out the [demo page](http://reckoning.douggo.com) for the current feature-set

---

## What is Reckoning?

Reckoning is a data-driven time visualization library.  That's a very fancy way of saying a 'calendar'.

Reckoning is currently built in [Mithril](http://mithril.js.org), which is a nice small framework that handles rendering the views and some other great stuff.

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

Maybe you don't want to generate an entire calendar and you just want to map a range using Reckoning's API?  Cool dude - I've got you there.  Check out the global `rk` helper for utilities like that.  (It's just an empty Reckoning instantiation).

```javascript
// explictly map today, tomorrow, and every weekend
var partyTime = rk.mapRange({ dates: [today, tomrorow], everyWeekday: [0,6] });
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

 - Timeline Visuals
 - Test Suite
 - Nicer Build Script
 - Second Sample Theme
 - Alternate Implementations - React? Riot?

