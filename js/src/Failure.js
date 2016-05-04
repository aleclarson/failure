var Accumulator, ExceptionsManager, Failure, NamedFunction, Stack, isConstructor, isObject, printErrorStack, setType, steal;

require("isNodeJS");

require("isReactNative");

NamedFunction = require("NamedFunction");

isConstructor = require("isConstructor");

Accumulator = require("accumulator");

isObject = require("isObject");

setType = require("setType");

steal = require("steal");

Stack = require("./Stack");

if (isReactNative) {
  ExceptionsManager = require("ExceptionsManager");
  (require("ErrorUtils")).setGlobalHandler(function(error, isFatal) {
    var failure;
    failure = error.failure || Failure(error, {
      isFatal: isFatal
    });
    if (failure.isFatal) {
      if (Failure.fatality) {
        return;
      }
      Failure.fatality = failure;
      if (GLOBAL.nativeLoggingHook) {
        GLOBAL.nativeLoggingHook("\nJS Error: " + error.message + "\n" + error.stack);
      } else {
        console.warn(failure.reason);
      }
    }
    return failure["throw"]();
  });
} else if (isNodeJS) {
  process.on("exit", function() {
    var errorCache, failure, message, ref;
    errorCache = require("failure").errorCache;
    if (errorCache.length === 0) {
      return;
    }
    ref = errorCache[errorCache.length - 1], message = ref.message, failure = ref.failure;
    log.moat(1);
    if (message) {
      log.red("Error: ");
      log.white(message);
      log.moat(1);
    }
    repl.sync({
      values: failure.values.flatten(),
      stacks: failure.stacks
    });
  });
}

module.exports = Failure = NamedFunction("Failure", function(error, values) {
  var self;
  self = {
    isFatal: true,
    reason: error.message,
    stacks: Stack([error]),
    values: Accumulator()
  };
  self.values.DEBUG = true;
  setType(self, Failure);
  self.track(values);
  return self;
});

Failure.fatality = null;

Failure.errorCache = [];

Failure.throwFailure = function(error, values) {
  var failure;
  failure = error.failure;
  if (isConstructor(failure, Failure)) {
    failure.track(values);
  } else {
    error.failure = Failure(error, values);
  }
  Failure.errorCache.push(error);
  throw error;
};

Failure.prototype.track = function(values) {
  var isFatal, stack;
  if (!isObject(values)) {
    return;
  }
  isFatal = steal(values, "isFatal");
  if (isFatal !== void 0) {
    this.isFatal = isFatal === true;
  }
  stack = steal(values, "stack");
  if (stack) {
    this.stacks.push(stack);
  }
  return this.values.push(values);
};

Failure.prototype["throw"] = function() {
  if (isReactNative) {
    ExceptionsManager.reportException(this.stacks.array[0], this.isFatal, this.stacks.flatten());
  }
  if (this.isFatal) {
    throw this.stacks.array[0];
  }
};

if (isReactNative) {
  printErrorStack = require("printErrorStack");
  Failure.prototype.print = function() {
    var error, isFatal, stack;
    isFatal = this.isFatal;
    error = Error(this.reason);
    stack = this.stacks.flatten();
    return ExceptionsManager.createException(error, isFatal, stack, function(exception) {
      var message;
      message = exception.reason + "\n\n";
      message += Stack.format(exception.stack);
      return console.log(message);
    });
  };
}

Error.prototype.trace = function(title, options) {
  var tracer;
  if (options == null) {
    options = {};
  }
  if (!this.failure) {
    return;
  }
  tracer = Error();
  tracer.skip = options.skip;
  tracer.filter = options.filter;
  this.failure.stacks.push([title != null ? title : title = "::  Further up the stack  ::", tracer]);
};

Error.prototype["throw"] = function() {
  if (!this.failure) {
    return;
  }
  this.failure["throw"]();
};

Error.prototype["catch"] = function() {
  var index;
  if (!this.failure) {
    return;
  }
  index = Failure.errorCache.indexOf(this);
  this.failure = null;
  if (index < 0) {
    return;
  }
  Failure.errorCache.splice(index, 1);
};

//# sourceMappingURL=../../map/src/Failure.map
