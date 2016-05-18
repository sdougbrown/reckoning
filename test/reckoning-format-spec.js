describe('Reckoning.format', function () {
  'use strict';

  it('should return "null" if given an invalid date', function () {
    expect(Reckoning.format()).to.equal(null);
  });

  it('should format a valid date to a nicer string', function () {
    expect(Reckoning.format(new Date())).to.be.a('string');
  });

  // no browser support for locales & options (probably phantom/cli)
  // let's test some custom formatting!
  if (!toLocaleStringSupportsLocales()) {
    describe('Custom Formatting', function () {
      var date = Reckoning.parse('2012-02-02');
      // manually override the toLocaleDateString function like a chump
      date.toLocaleDateString = null;

      it('should provide a full string with default values', function () {
        expect(Reckoning.format(date)).to.equal('Thursday, February 2, 2012');
      });

      it('should ignore the locale because we cannot use it :(', function () {
        expect(Reckoning.format(date, { locale: 'fr' })).to.equal('Thursday, February 2, 2012');
      });

      it('should evaluate the "string" object', function () {
        // note that this DIFFERS from the spec
        // Reckoning doesn't care that 'weekday' is set to 'short'
        // in this fallback case - all values are evaluated
        // as truthy or falsy, so this test just uses 'true'
        expect(Reckoning.format(date, {
          string: {
            weekday: true,
            month: true,
            day: true,
            year: true
          }
        })).to.equal('Thursday, February 2, 2012');

        expect(Reckoning.format(date, {
          string: {
            month: true,
            day: true,
            year: true
          }
        })).to.equal('February 2, 2012');
        expect(Reckoning.format(date, { string: { month: true, year: true } })).to.equal('February, 2012');
        expect(Reckoning.format(date, { string: { month: true, day: true } })).to.equal('February 2');
        expect(Reckoning.format(date, { string: { month: true } })).to.equal('February');
        expect(Reckoning.format(date, { string: true })).to.equal('Thursday 2');
      });
    });
  }
});
