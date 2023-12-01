"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } }var _biggystring = require('biggystring');


var _types3 = require('../../common/types');
var _utils = require('../../common/utils');





var _EthereumNetwork = require('../EthereumNetwork');



var _ethereumSchema = require('../ethereumSchema');










var _ethereumTypes = require('../ethereumTypes');
var _feeProviders = require('../fees/feeProviders');
var _types5 = require('./types');











const NUM_TRANSACTIONS_TO_QUERY = 50






 class EvmScanAdapter
  extends _types5.NetworkAdapterBase

{constructor(...args) { super(...args); EvmScanAdapter.prototype.__init.call(this);EvmScanAdapter.prototype.__init2.call(this);EvmScanAdapter.prototype.__init3.call(this);EvmScanAdapter.prototype.__init4.call(this);EvmScanAdapter.prototype.__init5.call(this);EvmScanAdapter.prototype.__init6.call(this);EvmScanAdapter.prototype.__init7.call(this);EvmScanAdapter.prototype.__init8.call(this); }
  __init() {this.getBaseFeePerGas = null}
  __init2() {this.multicastRpc = null}
  __init3() {this.fetchTokenBalances = null}

  __init4() {this.fetchBlockheight = async () => {
    const { result: jsonObj, server } = await this.serialServers(
      async server => {
        if (!server.includes('etherscan') && !server.includes('blockscout')) {
          throw new Error(`Unsupported command eth_blockNumber in ${server}`)
        }
        let blockNumberUrlSyntax = `?module=proxy&action=eth_blockNumber`
        // special case for blockscout
        if (server.includes('blockscout')) {
          blockNumberUrlSyntax = `?module=block&action=eth_block_number`
        }

        const result = await this.fetchGetEtherscan(
          server,
          blockNumberUrlSyntax
        )
        if (typeof result.result !== 'string') {
          const msg = `Invalid return value eth_blockNumber in ${server}`
          this.ethEngine.error(msg)
          throw new Error(msg)
        }
        return { server, result }
      }
    )

    const clean = _ethereumSchema.asEtherscanGetBlockHeight.call(void 0, jsonObj)
    return { blockHeight: clean.result, server }
  }}

  __init5() {this.broadcast = async (
    edgeTransaction
  ) => {
    return await this.parallelServers(async baseUrl => {
      // RSK also uses the "eth_sendRaw" syntax
      const urlSuffix = `?module=proxy&action=eth_sendRawTransaction&hex=${edgeTransaction.signedTx}`
      const jsonObj = await this.fetchGetEtherscan(baseUrl, urlSuffix)
      return {
        result: this.broadcastResponseHandler(
          jsonObj,
          baseUrl,
          edgeTransaction
        ),
        server: 'etherscan'
      }
    })
  }}

  __init6() {this.fetchNonce = async () => {
    const address = this.ethEngine.walletLocalData.publicKey

    const url = `?module=proxy&action=eth_getTransactionCount&address=${address}&tag=latest`
    const { result: jsonObj, server } = await this.serialServers(
      async server => {
        // if falsy URL then error thrown
        if (!server.includes('etherscan') && !server.includes('blockscout')) {
          throw new Error(
            `Unsupported command eth_getTransactionCount in ${server}`
          )
        }
        const result = await this.fetchGetEtherscan(server, url)
        if (typeof result.result !== 'string') {
          const msg = `Invalid return value eth_getTransactionCount in ${server}`
          this.ethEngine.error(msg)
          throw new Error(msg)
        }
        return { server, result }
      }
    )

    const clean = _ethereumSchema.asEtherscanGetAccountNonce.call(void 0, jsonObj)
    return { newNonce: clean.result, server }
  }}

  __init7() {this.fetchTokenBalance = async (tk) => {
    const address = this.ethEngine.walletLocalData.publicKey
    let response
    let jsonObj
    let server
    let cleanedResponseObj
    try {
      if (tk === this.ethEngine.currencyInfo.currencyCode) {
        const url = `?module=account&action=balance&address=${address}&tag=latest`
        response = await this.serialServers(async server => {
          const result = await this.fetchGetEtherscan(server, url)
          if (typeof result.result !== 'string' || result.result === '') {
            const msg = `Invalid return value eth_getBalance in ${server}`
            this.ethEngine.error(msg)
            throw new Error(msg)
          }
          _types3.asIntegerString.call(void 0, result.result)
          return { server, result }
        })

        jsonObj = response.result
        server = response.server
      } else {
        const tokenInfo = this.ethEngine.getTokenInfo(tk)
        if (
          tokenInfo != null &&
          typeof tokenInfo.contractAddress === 'string'
        ) {
          const contractAddress = tokenInfo.contractAddress

          const url = `?module=account&action=tokenbalance&contractaddress=${contractAddress}&address=${address}&tag=latest`
          const response = await this.serialServers(async server => {
            const result = await this.fetchGetEtherscan(server, url)
            if (typeof result.result !== 'string' || result.result === '') {
              const msg = `Invalid return value getTokenBalance in ${server}`
              this.ethEngine.error(msg)
              throw new Error(msg)
            }
            return { server, result }
          })

          jsonObj = response.result
          server = response.server
        }
      }
      cleanedResponseObj = _ethereumTypes.asRpcResultString.call(void 0, jsonObj)
    } catch (e) {
      this.ethEngine.error(
        `checkTokenBalEthscan token ${tk} response ${String(_nullishCoalesce(response, () => ( '')))} `,
        e
      )
      throw new Error(
        `checkTokenBalEthscan invalid ${tk} response ${JSON.stringify(jsonObj)}`
      )
    }
    if (/^\d+$/.test(cleanedResponseObj.result)) {
      const balance = cleanedResponseObj.result
      return { tokenBal: { [tk]: balance }, server }
    } else {
      throw new Error(`checkTokenBalEthscan returned invalid JSON for ${tk}`)
    }
  }}

  __init8() {this.fetchTxs = async (params) => {
    const { startBlock, currencyCode } = params
    let server
    let allTransactions

    if (currencyCode === this.ethEngine.currencyInfo.currencyCode) {
      const txsRegularResp = await this.getAllTxsEthscan(
        startBlock,
        currencyCode,
        _ethereumTypes.asEvmScanTransaction,
        { searchRegularTxs: true }
      )
      const txsInternalResp = await this.getAllTxsEthscan(
        startBlock,
        currencyCode,
        _ethereumTypes.asEvmScanInternalTransaction,
        { searchRegularTxs: false }
      )
      server = _nullishCoalesce(_nullishCoalesce(txsRegularResp.server, () => ( txsInternalResp.server)), () => ( ''))
      allTransactions = [
        ...txsRegularResp.allTransactions,
        ...txsInternalResp.allTransactions
      ]
    } else {
      const tokenInfo = this.ethEngine.getTokenInfo(currencyCode)
      if (tokenInfo != null && typeof tokenInfo.contractAddress === 'string') {
        const contractAddress = tokenInfo.contractAddress
        const resp = await this.getAllTxsEthscan(
          startBlock,
          currencyCode,
          _ethereumTypes.asEvmScancanTokenTransaction,
          { contractAddress }
        )
        server = _nullishCoalesce(resp.server, () => ( ''))
        allTransactions = resp.allTransactions
      } else {
        return {}
      }
    }

    const edgeTransactionsBlockHeightTuple = {
      blockHeight: startBlock,
      edgeTransactions: allTransactions
    }
    return {
      tokenTxs: { [currencyCode]: edgeTransactionsBlockHeightTuple },
      server
    }
  }}

  // TODO: Clean return type
   async fetchGetEtherscan(server, cmd) {
    const scanApiKey = _feeProviders.getEvmScanApiKey.call(void 0, 
      this.ethEngine.initOptions,
      this.ethEngine.currencyInfo,
      this.ethEngine.log
    )

    // Quick hack to signal to use slower fetchCors over fetch from EdgeIo
    const useFetchCors = server.indexOf('cors-http') === 0
    if (useFetchCors) server = server.replace(/^cors-http/, 'http')

    const apiKey = Array.isArray(scanApiKey)
      ? _utils.pickRandom.call(void 0, scanApiKey, 1)[0]
      : _nullishCoalesce(scanApiKey, () => ( ''))
    const apiKeyParam = apiKey !== '' ? `&apikey=${apiKey}` : ''

    const url = `${server}/api${cmd}`

    const response = await this.ethEngine.fetchCors(`${url}${apiKeyParam}`)
    if (!response.ok) this.throwError(response, 'fetchGetEtherscan', url)
    return await response.json()
  }

   async getAllTxsEthscan(
    startBlock,
    currencyCode,
    cleanerFunc,
    options
  ) {
    const address = this.ethEngine.walletLocalData.publicKey
    let page = 1

    const allTransactions = []
    let server
    const contractAddress = options.contractAddress
    const searchRegularTxs = options.searchRegularTxs
    while (true) {
      const offset = NUM_TRANSACTIONS_TO_QUERY

      let startUrl
      if (currencyCode === this.ethEngine.currencyInfo.currencyCode) {
        startUrl = `?action=${
          // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
          searchRegularTxs ? 'txlist' : 'txlistinternal'
        }&module=account`
      } else {
        startUrl = `?action=tokentx&contractaddress=${contractAddress}&module=account`
      }

      const url = `${startUrl}&address=${address}&startblock=${startBlock}&endblock=999999999&sort=asc&page=${page}&offset=${offset}`

      const response =
        this.config.servers.length === 0
          ? // HACK: If a currency doesn't have an etherscan API compatible
            // server we need to return an empty array
            { result: { result: [] }, server: undefined }
          : await this.serialServers(async server => {
              const result = await this.fetchGetEtherscan(server, url)
              if (
                typeof result.result !== 'object' ||
                typeof result.result.length !== 'number'
              ) {
                const msg = `Invalid return value getTransactions in ${server}`
                if (result.result !== 'Max rate limit reached')
                  this.ethEngine.error(msg)
                throw new Error(msg)
              }
              return { server, result }
            })

      server = response.server
      const transactions = response.result.result
      for (let i = 0; i < transactions.length; i++) {
        try {
          const cleanedTx = cleanerFunc(transactions[i])
          const tx = await this.processEvmScanTransaction(
            cleanedTx,
            currencyCode
          )
          allTransactions.push(tx)
        } catch (e) {
          this.ethEngine.error(
            `getAllTxsEthscan ${cleanerFunc.name}\n${_utils.safeErrorMessage.call(void 0, 
              e
            )}\n${JSON.stringify(transactions[i])}`
          )
          throw new Error(`getAllTxsEthscan ${cleanerFunc.name} is invalid`)
        }
      }
      if (transactions.length === 0) {
        break
      }
      page++
    }

    return { allTransactions, server }
  }

   async processEvmScanTransaction(
    tx,
    currencyCode
  ) {
    const ourReceiveAddresses = []

    const txid = _nullishCoalesce(tx.hash, () => ( tx.transactionHash))
    if (txid == null) {
      throw new Error('Invalid transaction result format')
    }

    const isSpend =
      tx.from.toLowerCase() ===
      this.ethEngine.walletLocalData.publicKey.toLowerCase()
    const tokenTx = currencyCode !== this.ethEngine.currencyInfo.currencyCode

    const gasPrice = 'gasPrice' in tx ? tx.gasPrice : undefined
    const nativeNetworkFee =
      gasPrice != null ? _biggystring.mul.call(void 0, gasPrice, tx.gasUsed) : '0'

    let l1RollupFee = '0'
    if (isSpend && this.ethEngine.networkInfo.l1RollupParams != null) {
      const response = await this.ethEngine.ethNetwork.multicastRpc(
        'eth_getTransactionReceipt',
        [txid]
      )
      const json = _ethereumTypes.asGetTransactionReceipt.call(void 0, response.result.result)
      l1RollupFee = _biggystring.add.call(void 0, l1RollupFee, _utils.decimalToHex.call(void 0, json.l1Fee))
    }

    let nativeAmount
    let networkFee
    let parentNetworkFee

    if (isSpend) {
      if (tokenTx) {
        nativeAmount = _biggystring.sub.call(void 0, '0', tx.value)
        networkFee = '0'
        parentNetworkFee = _biggystring.add.call(void 0, nativeNetworkFee, l1RollupFee)
      } else {
        // Spend to self. netNativeAmount is just the fee
        if (tx.from.toLowerCase() === tx.to.toLowerCase()) {
          nativeAmount = _biggystring.sub.call(void 0, _biggystring.sub.call(void 0, '0', nativeNetworkFee), l1RollupFee)
          networkFee = _biggystring.add.call(void 0, nativeNetworkFee, l1RollupFee)
        } else {
          nativeAmount = _biggystring.sub.call(void 0, 
            _biggystring.sub.call(void 0, _biggystring.sub.call(void 0, '0', tx.value), nativeNetworkFee),
            l1RollupFee
          )
          networkFee = _biggystring.add.call(void 0, nativeNetworkFee, l1RollupFee)
        }
      }
    } else {
      // Receive
      if (tokenTx) {
        nativeAmount = tx.value
        networkFee = '0'
      } else {
        nativeAmount = tx.value
        networkFee = '0'
      }
      ourReceiveAddresses.push(this.ethEngine.walletLocalData.publicKey)
    }

    const otherParams = {
      from: [tx.from],
      to: [tx.to],
      gas: tx.gas,
      gasPrice: _nullishCoalesce(gasPrice, () => ( '')),
      gasUsed: tx.gasUsed,
      isFromMakeSpend: false
    }

    let blockHeight = parseInt(tx.blockNumber)
    if (blockHeight < 0) blockHeight = 0

    const edgeTransaction = {
      blockHeight,
      currencyCode,
      date: parseInt(tx.timeStamp),
      feeRateUsed:
        gasPrice != null
          ? _EthereumNetwork.getFeeRateUsed.call(void 0, gasPrice, tx.gas, tx.gasUsed)
          : undefined,
      isSend: nativeAmount.startsWith('-'),
      memos: [],
      nativeAmount,
      networkFee,
      otherParams,
      ourReceiveAddresses,
      parentNetworkFee,
      signedTx: '',
      txid,
      walletId: this.ethEngine.walletId
    }

    return edgeTransaction
    // or should be this.addTransaction(currencyCode, edgeTransaction)?
  }
} exports.EvmScanAdapter = EvmScanAdapter;
