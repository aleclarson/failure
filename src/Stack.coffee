
isConstructor = require "isConstructor"
NamedFunction = require "named-function"
repeatString = require "repeat-string"
flattenStack = require "flattenStack"
setType = require "setType"

module.exports =
Stack = NamedFunction "Stack", (array) ->
  setType { array }, Stack

Stack::push = (stack) ->
  @array.push stack

Stack::flatten = ->
  Stack.flatten @array

Stack::print = ->
  console.log Stack.format @flatten()

Stack.flatten = flattenStack

Stack.format = (stack) ->
  longestMethodName = 0
  locations = stack.map (frame) ->
    return unless isConstructor frame, Object
    frame.methodName ?= "[anonymous]"
    longestMethodName = frame.methodName.length if longestMethodName < frame.methodName.length
    frame.file + ":" + frame.lineNumber + ":" + frame.column
  stack.map (frame, index) ->
    return frame unless isConstructor frame, Object
    whitespace = repeatString " ", 2 + longestMethodName - frame.methodName.length
    frame.methodName + whitespace + locations[index]
  .join "\n"
