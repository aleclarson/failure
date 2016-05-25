
require "isNodeJS"
require "isReactNative"

NamedFunction = require "NamedFunction"
isConstructor = require "isConstructor"
Accumulator = require "accumulator"
isObject = require "isObject"
setType = require "setType"

Stack = require "./Stack"

if isReactNative
  ExceptionsManager = require "ExceptionsManager"
  (require "ErrorUtils").setGlobalHandler (error, isFatal) ->
    failure = error.failure or Failure error
    failure.isFatal = no if not isFatal
    failure.throw()

else if isNodeJS
  process.on "uncaughtException", (error) ->
    failure = error.failure or Failure error
    failure.throw()

module.exports =
Failure = NamedFunction "Failure", (error, values) ->

  self =
    isFatal: yes
    error: error
    stacks: Stack [ error ]
    values: Accumulator()

  setType self, Failure

  self.track values

  return self

#
# Static data setup
#

Failure.fatality = null

Failure.errorCache = []

Failure.trackFailure = (error, values) ->

  failure = error.failure
  if isConstructor failure, Failure
    failure.track values

  else
    error.failure = Failure error, values
    Failure.errorCache.push error

  return

Failure.throwFailure = (error, values) ->
  Failure.trackFailure error, values
  throw error

#
# Failure.prototype
#

Failure::track = (values) ->

  return if not isObject values

  if values.isFatal?
    @isFatal = values.isFatal is yes
    delete values.isFatal

  if values.stack?
    @stacks.push values.stack
    delete values.stack

  @values.push values

Failure::throw = ->
  if @isFatal and not Failure.fatality
    Failure.fatality = this
    if isReactNative
      if global.nativeLoggingHook
        global.nativeLoggingHook "\nJS Error: " + @error.message + "\n" + @stacks.flatten()
      else ExceptionsManager.reportException @error, @isFatal, @stacks.flatten()
    else if isNodeJS
      try
        throw @error if not global.log
        log.moat 1
        log.red "Error: "
        log.white @error.message
        log.moat 1
        log.gray.dim @stacks.format()
        log.moat 1
        return if not global.repl
        repl.loopMode = "default"
        values = @values.flatten()
        values.error = @error
        repl.sync values
      catch e
        console.log ""
        console.log e.stack
        console.log ""
      process.exit()
    else console.warn @error.message
  return

if isReactNative
  Failure::print = ->
    isFatal = @isFatal
    stack = @stacks.flatten()
    ExceptionsManager.createException @error, isFatal, stack, (exception) ->
      message = exception.reason + "\n\n"
      message += Stack.format exception.stack
      console.log message

#
# Error.prototype
#

Error::trace = (title, options = {}) ->
  return if not @failure
  tracer = Error()
  tracer.skip = options.skip
  tracer.filter = options.filter
  @failure.stacks.push [
    title ?= "::  Further up the stack  ::"
    tracer
  ]
  return

Error::throw = ->
  return if not @failure
  @failure.throw()
  return

Error::catch = ->
  return if not @failure
  index = Failure.errorCache.indexOf this
  return if index < 0
  @failure = null
  Failure.errorCache.splice index, 1
  return
