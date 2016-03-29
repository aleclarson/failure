
NamedFunction = require "named-function"
isReactNative = require "isReactNative"
isConstructor = require "isConstructor"
Accumulator = require "accumulator"
isObject = require "isObject"
setType = require "setType"
steal = require "steal"

Stack = require "./Stack"

if isReactNative
  ExceptionsManager = require "ExceptionsManager"
  (require "ErrorUtils").setGlobalHandler (error, isFatal) ->
    failure = error.failure or Failure error, { isFatal }
    if failure.isFatal
      return if Failure.fatality
      Failure.fatality = failure
      console.warn failure.reason
    failure.throw()

module.exports =
Failure = NamedFunction "Failure", (error, values) ->

  self =
    isFatal: yes
    reason: error.message
    stacks: Stack [ error ]
    values: Accumulator()

  self.values.DEBUG = yes

  setType self, Failure

  self.track values

  return self

#
# Static data setup
#

Failure.fatality = null

Failure.errorCache = []

Failure.throwFailure = (error, values) ->

  failure = error.failure
  if isConstructor failure, Failure
    error.trace()
    failure.track values
  else
    error.failure = Failure error, values

  Failure.errorCache.push error
  throw error

#
# Failure.prototype
#

Failure::track = (values) ->

  return unless isObject values

  isFatal = steal values, "isFatal"
  @isFatal = isFatal is yes if isFatal isnt undefined

  stack = steal values, "stack"
  @stacks.push stack if stack

  @values.push values

Failure::throw = ->

  if isReactNative
    ExceptionsManager.reportException @stacks.array[0], @isFatal, @stacks.flatten()

  if @isFatal
    throw @stacks.array[0]

if isReactNative

  printErrorStack = require "printErrorStack"
  Failure::print = ->
    isFatal = @isFatal
    error = Error @reason
    stack = @stacks.flatten()
    ExceptionsManager.createException error, isFatal, stack, (exception) ->
      message = exception.reason + "\n\n"
      message += Stack.format exception.stack
      console.log message

#
# Error.prototype
#

Error::trace = (title, options = {}) ->
  return unless @failure
  tracer = Error()
  tracer.skip = options.skip
  tracer.filter = options.filter
  @failure.stacks.push [
    title ?= "::  Further up the stack  ::"
    tracer
  ]
  return

Error::throw = ->
  return unless @failure
  @failure.throw()
  return

Error::catch = ->
  return unless @failure
  index = Failure.errorCache.indexOf this
  @failure = null
  return if index < 0
  Failure.errorCache.splice index, 1
  return
