var ExceptionsManager, Failure, NamedFunction, has, isReactNative, parseErrorStack, setType, steal;

require("lotus-require");

parseErrorStack = require("parseErrorStack");

NamedFunction = require("named-function");

isReactNative = require("isReactNative");

setType = require("set-type");

steal = require("steal");

has = require("has");

if (isReactNative) {
  ExceptionsManager = require("ExceptionsManager");
  (require("ErrorUtils")).setGlobalHandler(function(error, isFatal) {
    var failure;
    if (isFatal == null) {
      isFatal = true;
    }
    failure = error.failure;
    if (failure == null) {
      failure = Failure(error, {
        isFatal: isFatal
      });
    }
    return failure["throw"]();
  });
}

module.exports = Failure = NamedFunction("Failure", function(error, newData) {
  var failure, key, ref, value;
  if (newData == null) {
    newData = {};
  }
  if (error.failure instanceof Failure) {
    error.trace();
    error.addData(newData);
    return error.failure;
  }
  failure = {
    isFatal: false,
    reason: error.message,
    stack: parseErrorStack(error)
  };
  setType(failure, Failure);
  Failure.errors.push(error);
  error.failure = failure;
  ref = Failure.ErrorMixin;
  for (key in ref) {
    value = ref[key];
    error[key] = value;
  }
  failure.addData(newData);
  return failure;
});

Failure.prototype.dedupe = function(key) {
  var values;
  values = [];
  if (has(this, key)) {
    values.push(this[key]);
  }
  if ((this.dupes != null) && (has(this.dupes, key))) {
    values = values.concat(this.dupes[key]);
  }
  return values;
};

Failure.prototype["throw"] = function() {
  var exception;
  if (this.isFatal) {
    if (Failure.fatalError != null) {
      return;
    }
    Failure.fatalError = this;
    console.warn(this.reason);
  }
  exception = Error(this.reason);
  if (isReactNative) {
    ExceptionsManager.reportException(exception, this.isFatal, this.stack);
  } else if (this.isFatal) {
    throw exception;
  }
};

Failure.prototype.addData = function(newData) {
  var base, key, stack, value;
  if (newData == null) {
    newData = {};
  }
  if (steal(newData, "isFatal", true)) {
    this.isFatal = true;
  }
  stack = steal(newData, "stack");
  if (stack != null) {
    Failure.combineStacks(this.stack, stack);
  }
  for (key in newData) {
    value = newData[key];
    if (this[key] != null) {
      if (this.dupes == null) {
        this.dupes = {};
      }
      if ((base = this.dupes)[key] == null) {
        base[key] = [];
      }
      this.dupes.push(value);
    } else {
      this[key] = value;
    }
  }
};

Failure.errors = [];

Failure.fatalError = null;

Failure.throwFailure = function(error, newData) {
  Failure(error, newData);
  throw error;
};

Failure.combineStacks = function(stack1, stack2) {
  var frame, i, len, stack3;
  if (!(stack2 instanceof Array)) {
    stack2 = [stack2];
  }
  for (i = 0, len = stack2.length; i < len; i++) {
    frame = stack2[i];
    if (frame == null) {
      continue;
    }
    if (frame instanceof Array) {
      combineStacks(stack1, frame);
    } else if (frame instanceof Error) {
      stack3 = parseErrorStack(frame);
      if ((frame.skip instanceof Number) && (frame.skip > 0)) {
        stack3 = stack3.slice(frame.skip);
      }
      combineStacks(stack1, stack3);
    } else if ((frame.constructor === Object) || (frame instanceof String)) {
      stack1.push(frame);
    }
  }
};

Failure.ErrorMixin = {
  trace: function(title) {
    var fakeError;
    if (this.failure == null) {
      return;
    }
    fakeError = Error();
    fakeError.skip = 2;
    combineStacks(this.failure.stack, [title != null ? title : title = "::  Further up the stack  ::", fakeError]);
  },
  "throw": function() {
    var ref;
    return (ref = this.failure) != null ? ref["throw"]() : void 0;
  },
  "catch": function() {
    var index;
    if (this.failure == null) {
      return;
    }
    index = Failure.errors.indexOf(this);
    this.failure = null;
    if (index < 0) {
      return;
    }
    Failure.errors.splice(index, 1);
  }
};

//# sourceMappingURL=../../map/src/index.map
