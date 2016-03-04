
require "lotus-require"

parseErrorStack = require "parseErrorStack"
NamedFunction = require "named-function"
isReactNative = require "isReactNative"
setType = require "set-type"
steal = require "steal"
has = require "has"

if isReactNative
  ExceptionsManager = require "ExceptionsManager"
  (require "ErrorUtils").setGlobalHandler (error, isFatal = yes) ->
    { failure } = error
    failure ?= Failure error, { isFatal }
    if isFatal
      return if Failure.fatalError?
      Failure.fatalError = failure
      console.warn failure.reason
    failure.throw()

module.exports =
Failure = NamedFunction "Failure", (error, newData = {}) ->

  if error.failure instanceof Failure
    error.trace()
    error.failure.addData newData
    return error.failure

  failure = {
    isFatal: no
    reason: error.message
    stack: parseErrorStack error
  }

  setType failure, Failure

  Failure.errorCache.push error

  error.failure = failure

  error[key] = value for key, value of Failure.ErrorMixin

  failure.addData newData

  failure

if isReactNative
  Failure::print = ->
    error = Error @reason
    printErrorStack = require "printErrorStack"
    printErrorStack error, @stack

Failure::dedupe = (key) ->

  values = []

  if has this, key
    values.push this[key]

  if @dupes? and (has @dupes, key)
    values = values.concat @dupes[key]

  values

Failure::throw = ->

  exception = Error @reason

  if isReactNative
    ExceptionsManager.reportException exception, @isFatal, @stack

  else if @isFatal
    throw exception

Failure::addData = (newData = {}) ->

  if steal newData, "isFatal", yes
    @isFatal = yes

  stack = steal newData, "stack"
  Failure.combineStacks @stack, stack if stack?

  for key, value of newData

    if this[key]?
      @dupes ?= {}
      @dupes[key] ?= []
      @dupes[key].push value

    else
      this[key] = value

  return

Failure.errorCache = []

Failure.fatalError = null

Failure.throwFailure = (error, newData) ->
  Failure error, newData
  throw error

Failure.combineStacks = (stack1, stack2) ->
  unless stack2 instanceof Array
    stack2 = [ stack2 ]
  for frame in stack2
    continue unless frame?
    if frame instanceof Array
      Failure.combineStacks stack1, frame
    else if frame instanceof Error
      stack3 = parseErrorStack frame
      if (frame.skip instanceof Number) and (frame.skip > 0)
        stack3 = stack3.slice frame.skip
      Failure.combineStacks stack1, stack3
    else if (frame.constructor is Object) or (frame.constructor is String)
      stack1.push frame
  return

Failure.ErrorMixin =

  trace: (title) ->
    return unless @failure?
    fakeError = Error()
    # fakeError.skip = 2
    Failure.combineStacks @failure.stack, [
      title ?= "::  Further up the stack  ::"
      fakeError
    ]
    return

  throw: ->
    @failure?.throw()

  catch: ->
    return unless @failure?
    index = Failure.errorCache.indexOf this
    @failure = null
    return if index < 0
    Failure.errorCache.splice index, 1
    return
