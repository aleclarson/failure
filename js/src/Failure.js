var Accumulator, Failure, NamedFunction, Stack, isConstructor, isObject, setType;

require("isReactNative");

require("isNodeJS");

NamedFunction = require("NamedFunction");

isConstructor = require("isConstructor");

Accumulator = require("accumulator");

isObject = require("isObject");

setType = require("setType");

Stack = require("./Stack");

module.exports = Failure = NamedFunction("Failure", function(error, values) {
  var self;
  self = {
    isFatal: true,
    error: error,
    stacks: Stack([error]),
    values: Accumulator()
  };
  setType(self, Failure);
  self.track(values);
  return self;
});

Failure.fatality = null;

Failure.errorCache = [];

Failure.trackFailure = function(error, values) {
  var failure;
  failure = error.failure;
  if (isConstructor(failure, Failure)) {
    failure.track(values);
  } else {
    error.failure = Failure(error, values);
    Failure.errorCache.push(error);
  }
};

Failure.throwFailure = function(error, values) {
  Failure.trackFailure(error, values);
  throw error;
};

Failure.useGlobalHandler = function() {
  var ExceptionsManager;
  if (isReactNative) {
    ExceptionsManager = require("ExceptionsManager");
    return (require("ErrorUtils")).setGlobalHandler(function(error, isFatal) {
      var failure;
      failure = error.failure || Failure(error);
      if (!isFatal) {
        failure.isFatal = false;
      }
      return failure["throw"]();
    });
  } else if (isNodeJS) {
    return process.on("uncaughtException", function(error) {
      var failure;
      failure = error.failure || Failure(error);
      return failure["throw"]();
    });
  }
};

Failure.prototype.track = function(values) {
  if (!isObject(values)) {
    return;
  }
  if (values.isFatal != null) {
    this.isFatal = values.isFatal === true;
    delete values.isFatal;
  }
  if (values.stack != null) {
    this.stacks.push(values.stack);
    delete values.stack;
  }
  return this.values.push(values);
};

Failure.prototype["throw"] = function() {
  var EM, e, message, values;
  if (!this.isFatal) {
    return;
  }
  if (Failure.fatality) {
    return;
  }
  Failure.fatality = this;
  console.error(this.error.stack);
  if (isReactNative) {
    if (global.nativeLoggingHook) {
      message = "\nJS Error: " + this.error.message + "\n" + this.stacks.flatten();
      global.nativeLoggingHook(message);
      return;
    }
    EM = require("ExceptionsManager");
    EM.reportException(this.error, this.isFatal, this.stacks.flatten());
    return;
  }
  if (!isNodeJS) {
    return;
  }
  try {
    if (!global.log) {
      throw this.error;
    }
    log.moat(1);
    log.red("Error: ");
    log.white(this.error.message);
    log.moat(1);
    log.gray.dim(this.stacks.format());
    log.moat(1);
    if (global.repl) {
      repl.loopMode = "default";
      values = this.values.flatten();
      values.error = this.error;
      repl.sync(values);
    }
  } catch (error1) {
    e = error1;
    console.log("");
    console.log(e.stack);
    console.log("");
  }
  return process.exit();
};

if (isReactNative) {
  Failure.prototype.print = function() {
    var EM, isFatal, stack;
    isFatal = this.isFatal;
    stack = this.stacks.flatten();
    EM = require("ExceptionsManager");
    return EM.createException(this.error, isFatal, stack, function(exception) {
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
  if (index < 0) {
    return;
  }
  this.failure = null;
  Failure.errorCache.splice(index, 1);
};

//# sourceMappingURL=../../map/src/Failure.map
