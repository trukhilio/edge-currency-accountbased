"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
var _urlparse = require('url-parse'); var _urlparse2 = _interopRequireDefault(_urlparse);


var _types3 = require('./types');






 class BlockcypherAdapter
  extends _types3.NetworkAdapterBase

{constructor(...args) { super(...args); BlockcypherAdapter.prototype.__init.call(this);BlockcypherAdapter.prototype.__init2.call(this);BlockcypherAdapter.prototype.__init3.call(this);BlockcypherAdapter.prototype.__init4.call(this);BlockcypherAdapter.prototype.__init5.call(this);BlockcypherAdapter.prototype.__init6.call(this);BlockcypherAdapter.prototype.__init7.call(this);BlockcypherAdapter.prototype.__init8.call(this); }
  __init() {this.fetchNonce = null}
  __init2() {this.fetchBlockheight = null}
  __init3() {this.fetchTokenBalance = null}
  __init4() {this.fetchTokenBalances = null}
  __init5() {this.fetchTxs = null}
  __init6() {this.getBaseFeePerGas = null}
  __init7() {this.multicastRpc = null}

  __init8() {this.broadcast = async (
    edgeTransaction
  ) => {
    return await this.parallelServers(async baseUrl => {
      const urlSuffix = `v1/${this.ethEngine.currencyInfo.currencyCode.toLowerCase()}/main/txs/push`
      const hexTx = edgeTransaction.signedTx.replace('0x', '')
      const jsonObj = await this.fetchPostBlockcypher(
        urlSuffix,
        { tx: hexTx },
        baseUrl
      )
      return {
        result: this.broadcastResponseHandler(
          jsonObj,
          baseUrl,
          edgeTransaction
        ),
        server: 'blockcypher'
      }
    })
  }}

  // TODO: Clean return type
   async fetchPostBlockcypher(
    cmd,
    body,
    baseUrl
  ) {
    const { blockcypherApiKey } = this.ethEngine.initOptions
    let apiKey = ''
    if (blockcypherApiKey != null && blockcypherApiKey.length > 5) {
      apiKey = '&token=' + blockcypherApiKey
    }

    const url = `${baseUrl}/${cmd}${apiKey}`
    const response = await this.ethEngine.fetchCors(url, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify(body)
    })
    const parsedUrl = _urlparse2.default.call(void 0, url, {}, true)
    if (!response.ok) {
      this.throwError(response, 'fetchPostBlockcypher', parsedUrl.hostname)
    }
    return await response.json()
  }
} exports.BlockcypherAdapter = BlockcypherAdapter;
