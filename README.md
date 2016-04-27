# Reckoning

A Legendary Javascript Calendar Framework

Full Documentation Forthcoming

Check out the [demo page](http://reckoning.douggo.com) for the current feature-set

---

## What is Reckoning?

Reckoning is a data-driven time visualization library.  That's a very fancy way of saying 'calendar'.

Reckoning is currently built in [Mithril](http://mithril.js.org), which is a nice small framework that handles rendering the views and some other great stuff.

### What's the point?

A lot of calendar libraries are either document-driven (i.e. a jQuery plugin) or are difficult to style (i.e. ... a jQuery plugin).  The goal for this project is to produce a highly-reusable calendar library that can be used in a multitude of ways while always looking and feeling amazing.

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
    selected: {
      dates: today
    }
  }
});

// add tomorrow as another selected date
todayCal.ranges.selected.setDate(tomorrow);
```

### Roadmap
 - Timeline Visuals
 - Test Suite
 - Nicer Build Script
 - Second Sample Theme
 - Alternate Implmentations - React? Riot?

