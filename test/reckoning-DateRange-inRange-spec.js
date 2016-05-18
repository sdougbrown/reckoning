describe('Reckoning.constructors.DateRange.inRange', function () {
  'use strict';

  it('should be "inRange" if the date matches exactly', function () {
    var date = '2012-02-02';
    var range = Reckoning.mapRange([date]);
    expect(range.inRange(date)).to.be.true;
  });

  describe('From/To Ranges', function () {
    describe('From and To', function () {
      var range = Reckoning.mapRange({ fromDate: '2012-02-01', toDate: '2012-02-03' });

      it('should be "inRange" when the date is on "from"', function () {
        expect(range.inRange('2012-02-01')).to.be.true;
      });

      it('should be "inRange" when the date is on "to"', function () {
        expect(range.inRange('2012-02-03')).to.be.true;
      });

      it('should be "inRange" when the date is between "from" and "to"', function () {
        expect(range.inRange('2012-02-02')).to.be.true;
      });

      it('should not be "inRange" when the date is before "from"', function () {
        expect(range.inRange('2012-01-02')).to.be.false;
      });

      it('should not be "inRange" when the date is after "to"', function () {
        expect(range.inRange('2012-03-02')).to.be.false;
      });
    });

    describe('Reversed From and To', function () {
      // don't cross the streams!
      var range = Reckoning.mapRange({ fromDate: '2012-02-03', toDate: '2012-02-01' });

      it('should not be "inRange" when the date is on "from"', function () {
        expect(range.inRange('2012-02-01')).to.be.false;
      });

      it('should not be "inRange" when the date is on "to"', function () {
        expect(range.inRange('2012-02-03')).to.be.false;
      });

      it('should not be "inRange" when the date is between "from" and "to"', function () {
        expect(range.inRange('2012-02-02')).to.be.false;
      });

      it('should not be "inRange" when the date is before "from"', function () {
        expect(range.inRange('2012-01-02')).to.be.false;
      });

      it('should not be "inRange" when the date is after "to"', function () {
        expect(range.inRange('2012-03-02')).to.be.false;
      });
      // basically it just doesn't work.  is this desired?  I dunno.
    });

    describe('From Without To', function () {
      var range = Reckoning.mapRange({ fromDate: '2012-02-02' });

      it('should not be "inRange" if before "from"', function () {
        expect(range.inRange('2012-02-01')).to.be.false;
      });

      it('should be "inRange" if on "from"', function () {
        expect(range.inRange('2012-02-02')).to.be.true;
      });

      it('should be "inRange" after "from"', function () {
        expect(range.inRange('2012-02-03')).to.be.true;
      });
    });

    describe('To Without From', function () {
      var range = Reckoning.mapRange({ toDate: '2012-02-02' });

      it('should be "inRange" if before "to"', function () {
        expect(range.inRange('2012-02-01')).to.be.true;
      });

      it('should be "inRange" if on "to"', function () {
        expect(range.inRange('2012-02-02')).to.be.true;
      });

      it('should not be "inRange" after "to"', function () {
        expect(range.inRange('2012-02-03')).to.be.false;
      });
    });
  });

  describe('Repeat/Recurring Matches', function () {
    describe('With Repeating Months', function () {
      var range = Reckoning.mapRange({ everyMonth: 'February' });

      it('should be "inRange" if the month matches', function () {
        expect(range.inRange('2012-02-02')).to.be.true;
      });

      it('should not be "inRange" if the month does not match', function () {
        expect(range.inRange('2012-01-02')).to.be.false;
      });
    });

    describe('With Repeating Weekdays', function () {
      var range = Reckoning.mapRange({ everyWeekday: 'Thursday' });

      it('should be "inRange" if the day matches', function () {
        expect(range.inRange('2012-02-02')).to.be.true;
      });

      it('should not be "inRange" if the day does not match', function () {
        expect(range.inRange('2012-02-01')).to.be.false;
      });
    });

    describe('With Repeating Dates', function () {
      var range = Reckoning.mapRange({ everyDate: 2 });

      it('should be "inRange" if the day matches', function () {
        expect(range.inRange('2012-02-02')).to.be.true;
      });

      it('should not be "inRange" if the day does not match', function () {
        expect(range.inRange('2012-02-01')).to.be.false;
      });
    });

    describe('With Repeating Months and Weekdays', function () {
      var range = Reckoning.mapRange({
        everyMonth: 'February',
        everyWeekday: 'Thursday'
      });

      it('should be "inRange" if both the month and day match', function () {
        expect(range.inRange('2012-02-02')).to.be.true;
        expect(range.inRange('2012-02-09')).to.be.true;
      });

      it('should not be "inRange" if the day does not match', function () {
        expect(range.inRange('2012-02-01')).to.be.false;
      });

      it('should not be "inRange" if the month does not match', function () {
        // this is a Thursday, trust me...
        // or try Reckoning.getDay('2012-01-05')
        expect(range.inRange('2012-01-05')).to.be.false;
      });
    });

    describe('With Repeating Months, Dates, and Weekdays', function () {
      var range = Reckoning.mapRange({
        everyMonth: 'February',
        everyWeekday: 'Thursday',
        everyDate: 2
      });

      it('should be "inRange" only if all the month, date, and weekday match', function () {
        expect(range.inRange('2012-02-02')).to.be.true;
        expect(range.inRange('2012-02-09')).to.be.false;
        expect(range.inRange('2013-02-02')).to.be.false;
        expect(range.inRange('2013-01-05')).to.be.false;
      });
    });

    describe('With Repeating Dates and Weekdays', function () {
      var range = Reckoning.mapRange({
        everyWeekday: 'Thursday',
        everyDate: 2
      });

      it('should be "inRange" only if date and weekday match', function () {
        expect(range.inRange('2012-02-02')).to.be.true;
        expect(range.inRange('2014-10-02')).to.be.true;
        expect(range.inRange('2012-02-09')).to.be.false;
        expect(range.inRange('2013-02-02')).to.be.false;
      });
    });
  });
});

