describe('Reckoning.locale', function () {
  'use strict';

  it('should always have a default', function () {
    expect(Reckoning.locale()).to.not.be.empty;
  });

  it('should be possible to change', function () {
    expect(Reckoning.locale('es')).to.equal('es');
  });

  it('should be possible to reset by passing "null"', function () {
    expect(Reckoning.locale(null)).to.not.equal(null);
  });
});
