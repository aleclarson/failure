
var Failure = require('./js/src/index');

Object.defineProperties(obj, {
  failure: {
    configurable: no,
    get: function() {
      return Failure.fatalError;
    },
  },
  errors: {
    configurable: no,
    get: function() {
      return Failure.errors;
    },
  },
});
