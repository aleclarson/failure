var Failure;

Failure = require("./Failure");

Object.defineProperties(GLOBAL || global, {
  Failure: {
    configurable: false,
    value: Failure
  },
  fatality: {
    configurable: false,
    get: function() {
      return Failure.fatality;
    }
  },
  errorCache: {
    configurable: false,
    get: function() {
      return Failure.errorCache;
    }
  }
});

//# sourceMappingURL=../../map/src/global.map
