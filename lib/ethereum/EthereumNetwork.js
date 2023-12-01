"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } }var _biggystring = require('biggystring');


var _utils = require('../common/utils');
var _ethereumConsts = require('./ethereumConsts');






var _BlockbookAdapter = require('./networkAdapters/BlockbookAdapter');
var _BlockchairAdapter = require('./networkAdapters/BlockchairAdapter');
var _BlockcypherAdapter = require('./networkAdapters/BlockcypherAdapter');
var _EvmScanAdapter = require('./networkAdapters/EvmScanAdapter');
var _RpcAdapter = require('./networkAdapters/RpcAdapter');






const BLOCKHEIGHT_POLL_MILLISECONDS = 20000
const NONCE_POLL_MILLISECONDS = 20000
const BAL_POLL_MILLISECONDS = 20000
const TXS_POLL_MILLISECONDS = 20000

const ADDRESS_QUERY_LOOKBACK_BLOCKS = 4 * 2 // ~ 2 minutes
const ADDRESS_QUERY_LOOKBACK_SEC = 2 * 60 // ~ 2 minutes






































/**
 * Builds the `feeRateUsed` object for an Ethereum transaction.
 * Usually, a valid output will be consumed by the GUI for display purposes.
 * Failure to construct the object will return an empty object.
 *
 * An example of the object returned:
 * ```js
 * getFeeRateUsed(gasPrice: '33000000000', gasUsed: '20000', gasLimit: '21000') => {
 *  gasPrice: '33',
 *  gasUsed: '20000',
 *  gasLimit: '21000'
 * }
 * ```
 *
 * An example usage:
 * ```js
 * const edgeTransaction: EdgeTransaction = {
 * ...
 * feeRateUsed: this.getFeeRateUsed(...),
 * ...
 * }
 * ```
 *
 * @param {string} gasPrice - The gas price of the transaction, in ***wei***.
 * @param {string} gasLimit - The gas limit of the transaction, in units of gas. If the
 *                            limit was not customly set, it will default to 21000.
 * @param {void | string} gasUsed - The amount of gas used in a transaction, in units of gas.
 * @returns {any} A `feeRateUsed` object to be included in an `EdgeTransaction`
 */
 const getFeeRateUsed = (
  gasPrice,
  gasLimit,
  gasUsed
) => {
  let feeRateUsed = {}

  try {
    feeRateUsed = {
      // Convert gasPrice from wei to gwei
      gasPrice: _biggystring.div.call(void 0, 
        gasPrice,
        _ethereumConsts.WEI_MULTIPLIER.toString(),
        _ethereumConsts.WEI_MULTIPLIER.toString().length - 1
      ),
      ...(gasUsed !== undefined ? { gasUsed: gasUsed } : {}),
      gasLimit: gasLimit
    }
  } catch (e) {
    console.log(`Failed to construct feeRateUssed: ${e}`)
  }

  return feeRateUsed
}; exports.getFeeRateUsed = getFeeRateUsed

 class EthereumNetwork {
  
  
  
  

  constructor(ethEngine) {;EthereumNetwork.prototype.__init.call(this);EthereumNetwork.prototype.__init2.call(this);EthereumNetwork.prototype.__init3.call(this);
    this.ethEngine = ethEngine
    this.ethNeeds = {
      blockHeightLastChecked: 0,
      nonceLastChecked: 0,
      tokenBalsLastChecked: 0,
      tokenBalLastChecked: {},
      tokenTxsLastChecked: {}
    }
    this.networkAdapters = this.buildNetworkAdapters(this.ethEngine.networkInfo)
    this.walletId = ethEngine.walletInfo.id
  }

  processAlethioTransaction(
    tokenTransfer,
    currencyCode
  ) {
    let netNativeAmount
    const ourReceiveAddresses = []
    let nativeNetworkFee
    const tokenTx = currencyCode !== this.ethEngine.currencyInfo.currencyCode

    const value = tokenTransfer.attributes.value
    const fee =
      tokenTransfer.attributes.fee != null &&
      tokenTransfer.attributes.fee !== ''
        ? tokenTransfer.attributes.fee
        : '0'
    const fromAddress = tokenTransfer.relationships.from.data.id
    const toAddress = tokenTransfer.relationships.to.data.id

    if (currencyCode === this.ethEngine.currencyInfo.currencyCode) {
      nativeNetworkFee = fee
    } else {
      nativeNetworkFee = '0'
    }

    const isSpend =
      fromAddress.toLowerCase() ===
      this.ethEngine.walletLocalData.publicKey.toLowerCase()

    if (isSpend) {
      if (fromAddress.toLowerCase() === toAddress.toLowerCase()) {
        // Spend to self. netNativeAmount is just the fee
        netNativeAmount = _biggystring.mul.call(void 0, nativeNetworkFee, '-1')
      } else {
        // spend to someone else
        netNativeAmount = _biggystring.sub.call(void 0, '0', value)

        // For spends, include the network fee in the transaction amount if not a token tx
        if (!tokenTx) {
          netNativeAmount = _biggystring.sub.call(void 0, netNativeAmount, nativeNetworkFee)
        }
      }
    } else if (
      toAddress.toLowerCase() ===
      this.ethEngine.walletLocalData.publicKey.toLowerCase()
    ) {
      // Receive transaction
      netNativeAmount = value
      ourReceiveAddresses.push(
        this.ethEngine.walletLocalData.publicKey.toLowerCase()
      )
    } else {
      return null
    }

    const otherParams = {
      from: [fromAddress],
      to: [toAddress],
      gas: '0',
      gasPrice: '0',
      gasUsed: '0',
      isFromMakeSpend: false
    }

    let blockHeight = tokenTransfer.attributes.globalRank[0]
    if (blockHeight < 0) blockHeight = 0

    let parentNetworkFee
    let networkFee = '0'
    if (tokenTx && isSpend) {
      parentNetworkFee = nativeNetworkFee
    } else {
      networkFee = nativeNetworkFee
    }

    const edgeTransaction = {
      blockHeight,
      currencyCode,
      date: tokenTransfer.attributes.blockCreationTime,
      isSend: netNativeAmount.startsWith('-'),
      memos: [],
      nativeAmount: netNativeAmount,
      networkFee,
      otherParams,
      ourReceiveAddresses,
      parentNetworkFee,
      signedTx: '',
      txid: tokenTransfer.relationships.transaction.data.id,
      walletId: this.walletId
    }

    return edgeTransaction
  }

  async broadcastTx(
    edgeTransaction
  ) {
    const promises = this.qualifyNetworkAdapters('broadcast').map(
      async adapter => await adapter.broadcast(edgeTransaction)
    )

    const broadcastResults = await _utils.promiseAny.call(void 0, promises)
    this.ethEngine.log(
      `${this.ethEngine.currencyInfo.currencyCode} broadcastTx ${broadcastResults.server} won`
    )
    return broadcastResults
  }

  __init() {this.multicastRpc = async (method, params) => {
    const funcs = this.qualifyNetworkAdapters('multicastRpc').map(
      adapter => async () => {
        return await adapter.multicastRpc(method, params)
      }
    )

    const out = await _utils.asyncWaterfall.call(void 0, funcs)
    return out
  }}

  __init2() {this.getBaseFeePerGas = async () => {
    const promises = this.qualifyNetworkAdapters('getBaseFeePerGas').map(
      adapter => async () => await adapter.getBaseFeePerGas()
    )
    return await _utils.asyncWaterfall.call(void 0, promises)
  }}

  async check(
    method,
    ...args
  ) {
    return await _utils.asyncWaterfall.call(void 0, 
      this.qualifyNetworkAdapters(method).map(
        adapter => async () => await adapter[method](...args)
      )
    ).catch(e => {
      return {}
    })
  }

  /*
   * @returns The currencyCode of the token or undefined if
   * the token is not enabled for this user.
   */
  getTokenCurrencyCode(txnContractAddress) {
    const address = this.ethEngine.walletLocalData.publicKey
    if (txnContractAddress.toLowerCase() === address.toLowerCase()) {
      return this.ethEngine.currencyInfo.currencyCode
    } else {
      for (const tk of this.ethEngine.enabledTokens) {
        const tokenInfo = this.ethEngine.getTokenInfo(tk)
        if (tokenInfo != null) {
          const tokenContractAddress = tokenInfo.contractAddress
          if (
            txnContractAddress != null &&
            typeof tokenContractAddress === 'string' &&
            tokenContractAddress.toLowerCase() ===
              txnContractAddress.toLowerCase()
          ) {
            return tk
          }
        }
      }
    }
  }

  async checkAndUpdate(
    lastChecked,
    pollMillisec,
    preUpdateBlockHeight,
    checkFunc
  ) {
    const now = Date.now()
    if (now - lastChecked > pollMillisec) {
      try {
        const ethUpdate = await checkFunc()
        this.processEthereumNetworkUpdate(now, ethUpdate, preUpdateBlockHeight)
      } catch (e) {
        this.ethEngine.error('checkAndUpdate ', e)
      }
    }
  }

  getQueryHeightWithLookback(queryHeight) {
    if (queryHeight > ADDRESS_QUERY_LOOKBACK_BLOCKS) {
      // Only query for transactions as far back as ADDRESS_QUERY_LOOKBACK_BLOCKS from the last time we queried transactions
      return queryHeight - ADDRESS_QUERY_LOOKBACK_BLOCKS
    } else {
      return 0
    }
  }

  getQueryDateWithLookback(date) {
    if (date > ADDRESS_QUERY_LOOKBACK_SEC) {
      // Only query for transactions as far back as ADDRESS_QUERY_LOOKBACK_SEC from the last time we queried transactions
      return date - ADDRESS_QUERY_LOOKBACK_SEC
    } else {
      return 0
    }
  }

  async needsLoop() {
    while (this.ethEngine.engineOn) {
      const preUpdateBlockHeight = this.ethEngine.walletLocalData.blockHeight
      await this.checkAndUpdate(
        this.ethNeeds.blockHeightLastChecked,
        BLOCKHEIGHT_POLL_MILLISECONDS,
        preUpdateBlockHeight,
        async () => await this.check('fetchBlockheight')
      )

      await this.checkAndUpdate(
        this.ethNeeds.nonceLastChecked,
        NONCE_POLL_MILLISECONDS,
        preUpdateBlockHeight,
        async () => await this.check('fetchNonce')
      )

      const { currencyCode } = this.ethEngine.currencyInfo
      const currencyCodes = this.ethEngine.enabledTokens

      if (!currencyCodes.includes(currencyCode)) {
        currencyCodes.push(currencyCode)
      }

      // The engine supports token balances batch queries if an adaptor provides
      // the functionality.
      const isFetchTokenBalancesSupported =
        this.networkAdapters.find(
          adapter => adapter.fetchTokenBalances != null
        ) != null

      // If this engine supports the batch token balance query, no need to check
      // each currencyCode individually.
      if (isFetchTokenBalancesSupported) {
        await this.checkAndUpdate(
          this.ethNeeds.tokenBalsLastChecked,
          BAL_POLL_MILLISECONDS,
          preUpdateBlockHeight,
          async () => await this.check('fetchTokenBalances')
        )
      }

      for (const tk of currencyCodes) {
        // Only check each code individually if this engine does not support
        // batch token balance queries.
        if (!isFetchTokenBalancesSupported) {
          await this.checkAndUpdate(
            _nullishCoalesce(this.ethNeeds.tokenBalLastChecked[tk], () => ( 0)),
            BAL_POLL_MILLISECONDS,
            preUpdateBlockHeight,
            async () => await this.check('fetchTokenBalance', tk)
          )
        }

        await this.checkAndUpdate(
          _nullishCoalesce(this.ethNeeds.tokenTxsLastChecked[tk], () => ( 0)),
          TXS_POLL_MILLISECONDS,
          preUpdateBlockHeight,
          async () =>
            await this.check('fetchTxs', {
              startBlock: this.getQueryHeightWithLookback(
                this.ethEngine.walletLocalData.lastTransactionQueryHeight[tk]
              ),
              startDate: this.getQueryDateWithLookback(
                this.ethEngine.walletLocalData.lastTransactionDate[tk]
              ),
              currencyCode: tk
            })
        )
      }

      await _utils.snooze.call(void 0, 1000)
    }
  }

  __init3() {this.processEthereumNetworkUpdate = (
    now,
    ethereumNetworkUpdate,
    preUpdateBlockHeight
  ) => {
    if (ethereumNetworkUpdate == null) return
    if (ethereumNetworkUpdate.blockHeight != null) {
      this.ethEngine.log(
        `${
          this.ethEngine.currencyInfo.currencyCode
        } processEthereumNetworkUpdate blockHeight ${
          _nullishCoalesce(ethereumNetworkUpdate.server, () => ( 'no server'))
        } won`
      )
      const blockHeight = ethereumNetworkUpdate.blockHeight
      this.ethEngine.log(`Got block height ${blockHeight}`)
      if (
        typeof blockHeight === 'number' &&
        this.ethEngine.walletLocalData.blockHeight !== blockHeight
      ) {
        this.ethNeeds.blockHeightLastChecked = now
        this.ethEngine.checkDroppedTransactionsThrottled()
        this.ethEngine.walletLocalData.blockHeight = blockHeight // Convert to decimal
        this.ethEngine.walletLocalDataDirty = true
        this.ethEngine.currencyEngineCallbacks.onBlockHeightChanged(
          this.ethEngine.walletLocalData.blockHeight
        )
      }
    }

    if (ethereumNetworkUpdate.newNonce != null) {
      this.ethEngine.log(
        `${
          this.ethEngine.currencyInfo.currencyCode
        } processEthereumNetworkUpdate nonce ${
          _nullishCoalesce(ethereumNetworkUpdate.server, () => ( 'no server'))
        } won`
      )
      this.ethNeeds.nonceLastChecked = now
      this.ethEngine.otherData.nextNonce = ethereumNetworkUpdate.newNonce
      this.ethEngine.walletLocalDataDirty = true
    }

    if (ethereumNetworkUpdate.tokenBal != null) {
      const tokenBal = ethereumNetworkUpdate.tokenBal
      this.ethEngine.log(
        `${
          this.ethEngine.currencyInfo.currencyCode
        } processEthereumNetworkUpdate tokenBal ${
          _nullishCoalesce(ethereumNetworkUpdate.server, () => ( 'no server'))
        } won`
      )
      for (const tk of Object.keys(tokenBal)) {
        this.ethNeeds.tokenBalLastChecked[tk] = now
        this.ethEngine.updateBalance(tk, tokenBal[tk])
      }
      this.ethNeeds.tokenBalsLastChecked = now
    }

    if (ethereumNetworkUpdate.tokenTxs != null) {
      const tokenTxs = ethereumNetworkUpdate.tokenTxs
      this.ethEngine.log(
        `${
          this.ethEngine.currencyInfo.currencyCode
        } processEthereumNetworkUpdate tokenTxs ${
          _nullishCoalesce(ethereumNetworkUpdate.server, () => ( 'no server'))
        } won`
      )
      for (const tk of Object.keys(tokenTxs)) {
        this.ethNeeds.tokenTxsLastChecked[tk] = now
        this.ethEngine.tokenCheckTransactionsStatus[tk] = 1
        const tuple = tokenTxs[tk]
        for (const tx of tuple.edgeTransactions) {
          this.ethEngine.addTransaction(tk, tx)
        }
        this.ethEngine.walletLocalData.lastTransactionQueryHeight[tk] =
          preUpdateBlockHeight
        this.ethEngine.walletLocalData.lastTransactionDate[tk] = now
      }
      this.ethEngine.updateOnAddressesChecked()
    }

    if (this.ethEngine.transactionsChangedArray.length > 0) {
      this.ethEngine.currencyEngineCallbacks.onTransactionsChanged(
        this.ethEngine.transactionsChangedArray
      )
      this.ethEngine.transactionsChangedArray = []
    }
  }}

  buildNetworkAdapters(settings) {
    const { networkAdapterConfigs } = settings
    const networkAdapters = networkAdapterConfigs.map(
      config => makeNetworkAdapter(config, this.ethEngine)
    )

    // We'll fake transaction querying if we don't have a txs querying adapter
    if (networkAdapters.find(adapter => adapter.fetchTxs == null) == null) {
      const adapter = new (0, _EvmScanAdapter.EvmScanAdapter)(this.ethEngine, {
        type: 'evmscan',
        servers: []
      })
      networkAdapters.push({
        fetchTxs: adapter.fetchTxs,
        fetchBlockheight: null,
        broadcast: null,
        getBaseFeePerGas: null,
        multicastRpc: null,
        fetchNonce: null,
        fetchTokenBalance: null,
        fetchTokenBalances: null
      })
    }

    return networkAdapters
  }

  /**
   * Returns only the network adapters that contain the requested method.
   */
  qualifyNetworkAdapters(
    ...methods
  ) {
    return this.networkAdapters.filter((adapter


) => methods.every(method => adapter[method] != null))
  }
} exports.EthereumNetwork = EthereumNetwork;

const makeNetworkAdapter = (
  config,
  ethEngine
) => {
  switch (config.type) {
    case 'blockbook':
      return new (0, _BlockbookAdapter.BlockbookAdapter)(ethEngine, config)
    case 'blockchair':
      return new (0, _BlockchairAdapter.BlockchairAdapter)(ethEngine, config)
    case 'blockcypher':
      return new (0, _BlockcypherAdapter.BlockcypherAdapter)(ethEngine, config)
    case 'evmscan':
      return new (0, _EvmScanAdapter.EvmScanAdapter)(ethEngine, config)
    case 'rpc':
      return new (0, _RpcAdapter.RpcAdapter)(ethEngine, config)
  }
}
