describe('Reckoning.mapRange', function () {
  'use strict';

  it('should create a "DateRange" object', function () {
    var range = Reckoning.mapRange();
    expect(range.toString()).to.equal('[object DateRange]');
  });

  it('should not totally break if passing a truthy value', function () {
    var range = Reckoning.mapRange(true);
    expect(range).to.be.an('object');
  });

  describe('Range Names', function () {
    it('should use a provided "name"', function () {
      var range = Reckoning.mapRange({ name: 'foo' });
      expect(range.name).to.equal('foo');
    });

    it('should use a provided string as a second argument for the name', function () {
      var range = Reckoning.mapRange({}, 'bar');
      expect(range.name).to.equal('bar');
    });

    it('should use a provided key in the second argument object for the name', function () {
      var range = Reckoning.mapRange({}, { key: 'baz' });
      expect(range.name).to.equal('baz');
    });

    it('should kebab-case any given name', function () {
      var range = Reckoning.mapRange({}, { key: 'fooBar' });
      expect(range.name).to.equal('foo-bar');
    });

    it('should default to just "range"', function () {
      var range = Reckoning.mapRange();
      expect(range.name).to.equal('range');
    });
  });

  describe('Date Options', function () {
    it('should map a date provided in the "dates" parameter', function () {
      // this is cheating - I know the keys!
      var dateKey = '2012-2-2';
      var range = Reckoning.mapRange({ dates: dateKey });
      expect(range.byDate[dateKey]).to.exist;
    });

    it('should map any dates (an array) provided in the "dates" parameter', function () {
      var dateKey1 = '2012-2-2';
      var dateKey2 = '2012-2-3';
      var range = Reckoning.mapRange({ dates: [dateKey1, dateKey2] });
      expect(range.byDate[dateKey1]).to.exist;
      expect(range.byDate[dateKey2]).to.exist;
    });

    it('should map any dates (an array) provided as the first argument', function () {
      var dateKey1 = '2012-2-2';
      var dateKey2 = '2012-2-3';
      var range = Reckoning.mapRange([dateKey1, dateKey2]);
      expect(range.byDate[dateKey1]).to.exist;
      expect(range.byDate[dateKey2]).to.exist;
    });
  });

  describe('Repeat Options', function () {
    it('should map individual dates with the "fixedBetween" option', function () {
      var dateKey1 = '2012-2-1';
      var dateKey2 = '2012-2-2';
      var dateKey3 = '2012-2-3';
      var range = Reckoning.mapRange({ fromDate: dateKey1, toDate: dateKey3, fixedBetween: true });
      expect(range.byDate[dateKey1]).to.exist;
      expect(range.byDate[dateKey2]).to.exist;
      expect(range.byDate[dateKey3]).to.exist;
    });

    it('should map "byDay" from "everyDate"', function () {
      var everyDate = 12;
      var range = Reckoning.mapRange({ everyDate: everyDate });
      expect(range.byDay).to.be.an('object');
    });

    it('should map "byMonth" from "everyMonth"', function () {
      var everyMonth = '0';
      var range = Reckoning.mapRange({ everyMonth: everyMonth });
      expect(range.byMonth).to.be.an('object');
    });

    it('should map "byWeekday" from "everyWeekday"', function () {
      var everyWeekday = ['0',1,'2'];
      var range = Reckoning.mapRange({ everyWeekday: everyWeekday });
      expect(range.byWeekday).to.be.an('object');
    });

    describe('every* String Matching', function () {
      it('should match exact strings in "everyMonth"', function () {
        var range = Reckoning.mapRange({ everyMonth: 'January' });
        expect(range.byMonth[0]).to.be.true;
      });
      it('should match exact strings in "everyWeekday"', function () {
        var range = Reckoning.mapRange({ everyWeekday: 'Monday' });
        expect(range.byWeekday[1]).to.be.true;
      });
    });
  });
});
