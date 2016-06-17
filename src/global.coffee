
Failure = require "./Failure"

Object.defineProperties GLOBAL or global,

  Failure:
    configurable: no
    value: Failure

  fatality:
    configurable: no
    get: -> Failure.fatality

  errorCache:
    configurable: no
    get: -> Failure.errorCache
