describe('Reckoning', function () {
  'use strict';

  it('Reckoning should be globally available', function () {
    expect(Reckoning).to.exist;
  });

  it('should have a public "parse" function', function () {
    expect(Reckoning.parse).to.be.a('function');
  });

  it('should have a public "format" function', function () {
    expect(Reckoning.format).to.be.a('function');
  });

  it('should have a public "between" function', function () {
    expect(Reckoning.between).to.be.a('function');
  });

  it('should have a public "mapRange" function', function () {
    expect(Reckoning.mapRange).to.be.a('function');
  });

  it('should have a public "getDateKey" function', function () {
    expect(Reckoning.getDateKey).to.be.a('function');
  });

  it('should have a public "getMonth" function', function () {
    expect(Reckoning.getMonth).to.be.a('function');
  });

  it('should have a public "getDay" function', function () {
    expect(Reckoning.getDay).to.be.a('function');
  });

  it('should have a public "locale" function', function () {
    expect(Reckoning.locale).to.be.a('function');
  });
});

describe('new Reckoning()', function () {
  'use strict';

  var rk;

  beforeEach(function () {
    rk = new Reckoning();
  });

  it('should have a custom "toString" method', function () {
    expect(rk.toString()).to.equal('[object Reckoning]');
  });

  it('should have a custom "toJSON" method', function () {
    expect(rk.toJSON).to.be.a('function');
  });

  it('should have an empty "ranges" object', function () {
    expect(rk.ranges).to.be.an('object');
  });

  it('should have a declared model with mapped "days" and "months"', function () {
    expect(rk.model).to.be.an('object');
    expect(rk.model.days()).to.be.an('array');
    expect(rk.model.months()).to.be.an('array');
  });
});

