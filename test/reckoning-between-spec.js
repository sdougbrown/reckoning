describe('Reckoning.between', function () {
  'use strict';

  it('should return the number of days between two date strings', function () {
    expect(Reckoning.between('2016-02-02','2016-02-04')).to.equal(2);
  });

  it('should always be a positive value, even if the order is flipped', function () {
    expect(Reckoning.between('2016-02-04','2016-02-02')).to.equal(2);
  });
});
