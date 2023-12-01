"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } }








var _utils = require('../../common/utils');














































 class NetworkAdapterBase {
  
  

  constructor(engine, config) {
    this.ethEngine = engine
    this.config = config
  }

   broadcastResponseHandler(
    res,
    server,
    tx
  ) {
    if (typeof res.error !== 'undefined') {
      this.ethEngine.error(
        `FAILURE ${server}\n${JSON.stringify(res.error)}\n${_utils.cleanTxLogs.call(void 0, tx)}`
      )
      throw res.error
    } else if (typeof res.result === 'string') {
      // Success!!
      this.ethEngine.warn(`SUCCESS ${server}\n${_utils.cleanTxLogs.call(void 0, tx)}`)
      // @ts-expect-error
      return res
    } else {
      this.ethEngine.error(
        `FAILURE ${server}\nInvalid return value ${JSON.stringify(
          res
        )}\n${_utils.cleanTxLogs.call(void 0, tx)}`
      )
      throw new Error('Invalid return value on transaction send')
    }
  }

   logError(funcName, e) {
    _utils.safeErrorMessage.call(void 0, e).includes('rateLimited')
      ? this.ethEngine.log(funcName, e)
      : this.ethEngine.error(funcName, e)
  }

   async serialServers(
    fn
  ) {
    const funcs = (_nullishCoalesce(this.config.servers, () => ( []))).map(
      server => async () => await fn(server)
    )
    return await _utils.asyncWaterfall.call(void 0, _utils.shuffleArray.call(void 0, funcs))
  }

   async parallelServers(
    fn
  ) {
    const promises = (_nullishCoalesce(this.config.servers, () => ( []))).map(
      async server => await fn(server)
    )
    return await _utils.promiseAny.call(void 0, promises)
  }

  // TODO: Convert to error types
   throwError(
    res,
    funcName,
    url
  ) {
    switch (res.status) {
      case 402: // blockchair
      case 429: // amberdata
      case 432: // blockchair
        throw new Error('rateLimited')
      default:
        throw new Error(
          `${funcName} The server returned error code ${res.status} for ${url}`
        )
    }
  }
} exports.NetworkAdapterBase = NetworkAdapterBase;
