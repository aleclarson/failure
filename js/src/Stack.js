var NamedFunction, Stack, flattenStack, isConstructor, setType;

isConstructor = require("isConstructor");

NamedFunction = require("NamedFunction");

flattenStack = require("flattenStack");

setType = require("setType");

module.exports = Stack = NamedFunction("Stack", function(array) {
  return setType({
    array: array
  }, Stack);
});

Stack.prototype.push = function(stack) {
  return this.array.push(stack);
};

Stack.prototype.flatten = function() {
  return Stack.flatten(this.array);
};

Stack.prototype.format = function() {
  return Stack.format(this.flatten());
};

Stack.prototype.print = function() {
  return console.log("\n" + this.format());
};

Stack.flatten = flattenStack;

Stack.format = function(stack) {
  var locations, longestMethodName;
  longestMethodName = 0;
  locations = stack.map(function(frame) {
    if (!isConstructor(frame, Object)) {
      return;
    }
    if (frame.methodName == null) {
      frame.methodName = "[anonymous]";
    }
    if (longestMethodName < frame.methodName.length) {
      longestMethodName = frame.methodName.length;
    }
    return frame.file + ":" + frame.lineNumber + ":" + frame.column;
  });
  return stack.map(function(frame, index) {
    if (!isConstructor(frame, Object)) {
      return frame;
    }
    return frame.methodName + "\n" + locations[index];
  }).join("\n\n");
};

//# sourceMappingURL=../../map/src/Stack.map
