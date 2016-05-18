describe('Reckoning.constructors.DateRange', function () {
  'use strict';

  var range;

  beforeEach(function () {
    range = Reckoning.mapRange();
  });

  it('should have a "toJSON" method', function () {
    expect(range.toJSON).to.be.a('function');
  });

  it('should allow the "byDate" field to be populated later', function () {
    range.addDate('2012-02-02');
    expect(range.byDate['2012-2-2']).to.be.true;
  });

  it('should allow items in "byDate" to be "removed"', function () {
    expect(range.byDate['2012-2-2']).to.not.exist;
    range.addDate('2012-02-02');
    range.removeDate('2012-02-02');
    expect(range.byDate['2012-2-2']).to.not.be.true;
  });

  it('should allow the "byDate" range to be cleared completely', function () {
    range.addDate('2012-02-02');
    range.addDate('2012-02-03');
    range.addDate('2012-02-04');
    range.clearDates();
    expect(range.byDate['2012-2-2']).to.not.be.true;
    expect(range.byDate['2012-2-3']).to.not.be.true;
    expect(range.byDate['2012-2-4']).to.not.be.true;
  });

  it('should have an "inRange" function', function () {
    expect(range.inRange).to.be.a('function');
  });
});
