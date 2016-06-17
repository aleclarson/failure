
require "isReactNative"
require "isNodeJS"

NamedFunction = require "NamedFunction"
isConstructor = require "isConstructor"
Accumulator = require "accumulator"
isObject = require "isObject"
setType = require "setType"

Stack = require "./Stack"

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

Failure.useGlobalHandler = ->

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

  return if not @isFatal
  return if Failure.fatality

  Failure.fatality = this
  console.error @error.stack

  if isReactNative

    if global.nativeLoggingHook
      message = "\nJS Error: " + @error.message + "\n" + @stacks.flatten()
      global.nativeLoggingHook message
      return

    EM = require "ExceptionsManager"
    EM.reportException @error, @isFatal, @stacks.flatten()
    return

  return if not isNodeJS

  try
    throw @error if not global.log
    log.moat 1
    log.red "Error: "
    log.white @error.message
    log.moat 1
    log.gray.dim @stacks.format()
    log.moat 1

    if global.repl
      repl.loopMode = "default"
      values = @values.flatten()
      values.error = @error
      repl.sync values

  catch e
    console.log ""
    console.log e.stack
    console.log ""

  process.exit()

if isReactNative
  Failure::print = ->
    isFatal = @isFatal
    stack = @stacks.flatten()
    EM = require "ExceptionsManager"
    EM.createException @error, isFatal, stack, (exception) ->
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
