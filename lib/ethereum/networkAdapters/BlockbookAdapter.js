"use strict";Object.defineProperty(exports, "__esModule", {value: true});







var _ethereumTypes = require('../ethereumTypes');
var _types3 = require('./types');






 class BlockbookAdapter
  extends _types3.NetworkAdapterBase

{constructor(...args) { super(...args); BlockbookAdapter.prototype.__init.call(this);BlockbookAdapter.prototype.__init2.call(this);BlockbookAdapter.prototype.__init3.call(this);BlockbookAdapter.prototype.__init4.call(this);BlockbookAdapter.prototype.__init5.call(this);BlockbookAdapter.prototype.__init6.call(this);BlockbookAdapter.prototype.__init7.call(this);BlockbookAdapter.prototype.__init8.call(this); }
  __init() {this.getBaseFeePerGas = null}
  __init2() {this.multicastRpc = null}
  __init3() {this.fetchTokenBalances = null}
  __init4() {this.fetchTxs = null}

  __init5() {this.fetchBlockheight = async () => {
    try {
      const { result: jsonObj, server } = await this.serialServers(
        async server => {
          const result = await this.fetchGetBlockbook(server, '/api/v2')
          return { server, result }
        }
      )

      const blockHeight = _ethereumTypes.asBlockbookBlockHeight.call(void 0, jsonObj).blockbook.bestHeight
      return { blockHeight, server }
    } catch (e) {
      this.ethEngine.log('checkBlockHeightBlockbook blockHeight ', e)
      throw new Error(`checkBlockHeightBlockbook returned invalid JSON`)
    }
  }}

  __init6() {this.broadcast = async (
    edgeTransaction
  ) => {
    return await this.parallelServers(async baseUrl => {
      const jsonObj = await this.fetchGetBlockbook(
        baseUrl,
        `/api/v2/sendtx/${edgeTransaction.signedTx}`
      )

      return {
        result: this.broadcastResponseHandler(
          jsonObj,
          baseUrl,
          edgeTransaction
        ),
        server: 'blockbook'
      }
    })
  }}

  __init7() {this.fetchNonce = async () => {
    return await this.checkAddressBlockbook()
  }}

  __init8() {this.fetchTokenBalance = async () => {
    return await this.checkAddressBlockbook()
  }}

  async checkAddressBlockbook() {
    const address = this.ethEngine.walletLocalData.publicKey.toLowerCase()
    const out = {
      newNonce: '0',
      tokenBal: {},
      server: ''
    }
    const query = '/api/v2/address/' + address + `?&details=tokenBalances`

    const { result: jsonObj, server } = await this.serialServers(
      async server => {
        const result = await this.fetchGetBlockbook(server, query)
        return { server, result }
      }
    )

    let addressInfo
    try {
      addressInfo = _ethereumTypes.asBlockbookAddress.call(void 0, jsonObj)
    } catch (e) {
      this.ethEngine.error(
        `checkTxsBlockbook ${server} error BlockbookAddress ${JSON.stringify(
          jsonObj
        )}`
      )
      throw new Error(
        `checkTxsBlockbook ${server} returned invalid JSON for BlockbookAddress`
      )
    }
    const { nonce, tokens, balance } = addressInfo
    out.newNonce = nonce
    if (out.tokenBal != null)
      out.tokenBal[this.ethEngine.currencyInfo.currencyCode] = balance
    out.server = server

    // Token balances
    for (const token of tokens) {
      try {
        const { symbol, balance } = _ethereumTypes.asBlockbookTokenBalance.call(void 0, token)
        // @ts-expect-error
        out.tokenBal[symbol] = balance
      } catch (e) {
        this.ethEngine.error(
          `checkTxsBlockbook ${server} BlockbookTokenBalance ${JSON.stringify(
            token
          )}`
        )
        throw new Error(
          `checkTxsBlockbook ${server} returned invalid JSON for BlockbookTokenBalance`
        )
      }
    }
    return out
  }

  // TODO: Clean return type
   async fetchGetBlockbook(server, param) {
    const url = server + param
    const resultRaw = !server.includes('trezor')
      ? await this.ethEngine.fetchCors(url)
      : await this.ethEngine.fetchCors(url, {
          headers: { 'User-Agent': 'http.agent' }
        })
    return await resultRaw.json()
  }
} exports.BlockbookAdapter = BlockbookAdapter;
