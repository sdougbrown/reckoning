// basic node compatabiity test (for now)
var Reckoning = require("../reckoning");

var chai = require('chai');
var sinon = require('sinon');
var sinon_chai = require('sinon-chai');

global.expect = chai.expect;
global.Reckoning = Reckoning;
global.toLocaleStringSupportsLocales = function() {
  try {
    new Date().toLocaleString('i');
  } catch (e) {
    return e.name === 'RangeError';
  }
  return false;
}

console.log(Reckoning.parse('2012-01-01'));
console.log(Reckoning.format('2012-01-01'));
