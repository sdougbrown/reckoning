describe('Reckoning.parse', function () {
  'use strict';

  it('should return "null" if given invalid parameters', function () {
    expect(Reckoning.parse()).to.equal(null);
  });

  it('should return an unmutated Date object if given a Date object', function () {
    var date = new Date();
    expect(Reckoning.parse(date)).to.equal(date);
  });

  it('should disregard non-string numbers or other arguments and return "null"', function () {
    expect(Reckoning.parse(123)).to.equal(null);
    expect(Reckoning.parse({})).to.equal(null);
    expect(Reckoning.parse([])).to.equal(null);
  });

  it('should refuse to parse malformed date strings', function () {
    expect(Reckoning.parse('2016-13-13')).to.equal(null);
  });

  it('should correctly parse legit short strings', function () {
    var feb6 = Reckoning.parse('2016-02-06');

    expect(feb6.getDate()).to.equal(6);
    expect(feb6.getMonth()).to.equal(1);
    expect(feb6.getFullYear()).to.equal(2016);
  });

  it('should correctly parse ISO strings', function () {
    var now = new Date();
    // this is contrived but you get the idea, surely
    var parsedNow = Reckoning.parse(now.toISOString());

    expect(parsedNow.getDate()).to.equal(now.getDate());
    expect(parsedNow.getMonth()).to.equal(now.getMonth());
    expect(parsedNow.getFullYear()).to.equal(now.getFullYear());
  });

  // TODO: custom parser tests
});
