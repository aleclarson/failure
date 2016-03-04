
var Failure = require('./js/src/Failure');

Object.defineProperties(GLOBAL || global, {
  Failure: {
    configurable: false,
    writable: false,
    value: Failure,
  },
  throwFailure: {
    configurable: false,
    writable: false,
    value: Failure.throwFailure,
  },
  failure: {
    configurable: false,
    get: function() {
      return Failure.fatalError;
    },
  },
  errors: {
    configurable: false,
    get: function() {
      return Failure.errorCache;
    },
  },
});
