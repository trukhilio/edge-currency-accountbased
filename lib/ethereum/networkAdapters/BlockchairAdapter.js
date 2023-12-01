"use strict";Object.defineProperty(exports, "__esModule", {value: true});var _utils = require('../../common/utils');






var _ethereumTypes = require('../ethereumTypes');
var _types = require('./types');






 class BlockchairAdapter
  extends _types.NetworkAdapterBase

{constructor(...args) { super(...args); BlockchairAdapter.prototype.__init.call(this);BlockchairAdapter.prototype.__init2.call(this);BlockchairAdapter.prototype.__init3.call(this);BlockchairAdapter.prototype.__init4.call(this);BlockchairAdapter.prototype.__init5.call(this);BlockchairAdapter.prototype.__init6.call(this);BlockchairAdapter.prototype.__init7.call(this);BlockchairAdapter.prototype.__init8.call(this); }
  __init() {this.broadcast = null}
  __init2() {this.fetchNonce = null}
  __init3() {this.fetchTokenBalances = null}
  __init4() {this.fetchTxs = null}
  __init5() {this.getBaseFeePerGas = null}
  __init6() {this.multicastRpc = null}

  __init7() {this.fetchBlockheight = async () => {
    try {
      const jsonObj = await this.fetchGetBlockchair(
        `/${this.ethEngine.currencyInfo.pluginId}/stats`,
        false
      )
      const blockHeight = parseInt(
        _ethereumTypes.asCheckBlockHeightBlockchair.call(void 0, jsonObj).data.blocks.toString(),
        10
      )
      return { blockHeight, server: 'blockchair' }
    } catch (e) {
      this.logError(e)
      throw new Error('checkBlockHeightBlockchair returned invalid JSON')
    }
  }}

  __init8() {this.fetchTokenBalance = async (tk) => {
    let cleanedResponseObj
    const address = this.ethEngine.walletLocalData.publicKey
    const path = `/${this.ethEngine.currencyInfo.pluginId}/dashboards/address/${address}?erc_20=true`
    try {
      const jsonObj = await this.fetchGetBlockchair(path, false)
      cleanedResponseObj = _ethereumTypes.asCheckTokenBalBlockchair.call(void 0, jsonObj)
    } catch (e) {
      this.logError('checkTokenBalBlockchair', e)
      throw new Error('checkTokenBalBlockchair response is invalid')
    }
    const response = {
      [this.ethEngine.currencyInfo.currencyCode]:
        cleanedResponseObj.data[address].address.balance
    }
    for (const tokenData of cleanedResponseObj.data[address].layer_2.erc_20) {
      try {
        const cleanTokenData = _ethereumTypes.asBlockChairAddress.call(void 0, tokenData)
        const balance = cleanTokenData.balance
        const tokenAddress = cleanTokenData.token_address
        const tokenSymbol = cleanTokenData.token_symbol
        const tokenInfo = this.ethEngine.getTokenInfo(tokenSymbol)
        if (tokenInfo != null && tokenInfo.contractAddress === tokenAddress) {
          response[tokenSymbol] = balance
        } else {
          // Do nothing, eg: Old DAI token balance is ignored
        }
      } catch (e) {
        this.ethEngine.error(
          `checkTokenBalBlockchair tokenData ${_utils.safeErrorMessage.call(void 0, 
            e
          )}\n${JSON.stringify(tokenData)}`
        )
        throw new Error('checkTokenBalBlockchair tokenData is invalid')
      }
    }
    return { tokenBal: response, server: 'blockchair' }
  }}

  // TODO: Clean return type
   async fetchGetBlockchair(
    path,
    includeKey = false
  ) {
    const { blockchairApiKey } = this.ethEngine.initOptions

    return await this.serialServers(async baseUrl => {
      const keyParam =
        includeKey && blockchairApiKey != null ? `&key=${blockchairApiKey}` : ''
      const url = `${baseUrl}${path}`
      const response = await this.ethEngine.fetchCors(`${url}${keyParam}`)
      if (!response.ok) this.throwError(response, 'fetchGetBlockchair', url)
      return await response.json()
    })
  }
} exports.BlockchairAdapter = BlockchairAdapter;
