"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; } function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } }var _biggystring = require('biggystring');

var _ethers = require('ethers');
var _urlparse = require('url-parse'); var _urlparse2 = _interopRequireDefault(_urlparse);

var _tokenHelpers = require('../../common/tokenHelpers');





var _utils = require('../../common/utils');
var _ETH_BAL_CHECKER_ABIjson = require('../abi/ETH_BAL_CHECKER_ABI.json'); var _ETH_BAL_CHECKER_ABIjson2 = _interopRequireDefault(_ETH_BAL_CHECKER_ABIjson);


var _ethereumSchema = require('../ethereumSchema');




var _ethereumTypes = require('../ethereumTypes');
var _types3 = require('./types');







 class RpcAdapter
  extends _types3.NetworkAdapterBase

{
  constructor(ethEngine, config) {
    super(ethEngine, config);RpcAdapter.prototype.__init.call(this);RpcAdapter.prototype.__init2.call(this);RpcAdapter.prototype.__init3.call(this);RpcAdapter.prototype.__init4.call(this);RpcAdapter.prototype.__init5.call(this);RpcAdapter.prototype.__init6.call(this);RpcAdapter.prototype.__init7.call(this);RpcAdapter.prototype.__init8.call(this);

    // Add API keys to servers
    this.config.servers = this.config.servers
      .map((server) => {
        try {
          return this.addRpcApiKey(server)
        } catch (error) {}
        return undefined
      })
      .filter((server) => server != null)
  }

  __init() {this.fetchBlockheight = async () => {
    const {
      chainParams: { chainId }
    } = this.ethEngine.networkInfo

    const { result: jsonObj, server } = await this.serialServers(
      async baseUrl => {
        const result = await this.fetchPostRPC(
          'eth_blockNumber',
          [],
          chainId,
          baseUrl
        )
        // Check if successful http response was actually an error
        if (result.error != null) {
          this.ethEngine.error(
            `Successful eth_blockNumber response object from ${baseUrl} included an error ${JSON.stringify(
              result.error
            )}`
          )
          throw new Error(
            'Successful eth_blockNumber response object included an error'
          )
        }
        return { server: _urlparse2.default.call(void 0, baseUrl).hostname, result }
      }
    )

    const clean = _ethereumSchema.asEtherscanGetBlockHeight.call(void 0, jsonObj)
    return { blockHeight: clean.result, server }
  }}

  __init2() {this.broadcast = async (
    edgeTransaction
  ) => {
    const {
      chainParams: { chainId }
    } = this.ethEngine.networkInfo

    return await this.parallelServers(async baseUrl => {
      const method = 'eth_sendRawTransaction'
      const params = [edgeTransaction.signedTx]

      const jsonObj = await this.fetchPostRPC(method, params, chainId, baseUrl)

      const parsedUrl = _urlparse2.default.call(void 0, baseUrl, {}, true)
      return {
        result: this.broadcastResponseHandler(
          jsonObj,
          parsedUrl.toString(),
          edgeTransaction
        ),
        server: parsedUrl.hostname
      }
    })
  }}

  __init3() {this.getBaseFeePerGas = async () => {
    const {
      chainParams: { chainId }
    } = this.ethEngine.networkInfo

    return await this.serialServers(
      async baseUrl =>
        await this.fetchPostRPC(
          'eth_getBlockByNumber',
          ['latest', false],
          chainId,
          baseUrl
        ).then(response => {
          if (response.error != null) {
            const errorMessage = `multicast get_baseFeePerGas error response from ${baseUrl}: ${JSON.stringify(
              response.error
            )}`
            this.ethEngine.warn(errorMessage)
            throw new Error(errorMessage)
          }

          const baseFeePerGas = response.result.baseFeePerGas
          return baseFeePerGas
        })
    )
  }}

  __init4() {this.multicastRpc = async (
    method,
    params
  ) => {
    const {
      chainParams: { chainId }
    } = this.ethEngine.networkInfo

    return await this.serialServers(async baseUrl => {
      const result = await this.fetchPostRPC(method, params, chainId, baseUrl)
      // Check if successful http response was actually an error
      if (result.error != null) {
        this.ethEngine.error(
          `Successful ${method} response object from ${baseUrl} included an error ${JSON.stringify(
            result.error
          )}`
        )
        throw new Error(
          `Successful ${method} response object included an error`
        )
      }
      return { server: _urlparse2.default.call(void 0, baseUrl).hostname, result }
    })
  }}

  __init5() {this.fetchNonce = async () => {
    const {
      chainParams: { chainId }
    } = this.ethEngine.networkInfo

    const address = this.ethEngine.walletLocalData.publicKey

    const { result, server } = await this.serialServers(async baseUrl => {
      const result = await this.fetchPostRPC(
        'eth_getTransactionCount',
        [address, 'latest'],
        chainId,
        baseUrl
      )
      // Check if successful http response was actually an error
      if (result.error != null) {
        this.ethEngine.error(
          `Successful eth_getTransactionCount_RPC response object from ${baseUrl} included an error ${JSON.stringify(
            result.error
          )}`
        )
        throw new Error(
          'Successful eth_getTransactionCount_RPC response object included an error'
        )
      }
      return { server: _urlparse2.default.call(void 0, baseUrl).hostname, result }
    })

    const cleanRes = _ethereumTypes.asRpcResultString.call(void 0, result)
    if (/0[xX][0-9a-fA-F]+/.test(cleanRes.result)) {
      const newNonce = _biggystring.add.call(void 0, '0', cleanRes.result)
      return { newNonce, server }
    } else {
      throw new Error('checkNonceRpc returned invalid JSON')
    }
  }}

  __init6() {this.fetchTokenBalance = async (tk) => {
    const {
      chainParams: { chainId }
    } = this.ethEngine.networkInfo

    let cleanedResponseObj
    let response
    let jsonObj
    let server
    const address = this.ethEngine.walletLocalData.publicKey
    try {
      if (tk === this.ethEngine.currencyInfo.currencyCode) {
        response = await this.serialServers(async baseUrl => {
          const result = await this.fetchPostRPC(
            'eth_getBalance',
            [address, 'latest'],
            chainId,
            baseUrl
          )
          // Check if successful http response was actually an error
          if (result.error != null) {
            this.ethEngine.error(
              `Successful eth_getBalance response object from ${baseUrl} included an error ${JSON.stringify(
                result.error
              )}`
            )
            throw new Error(
              'Successful eth_getBalance response object included an error'
            )
          }
          // Convert hex
          if (!_utils.isHex.call(void 0, result.result)) {
            throw new Error(
              `eth_getBalance not hex for ${_urlparse2.default.call(void 0, baseUrl).hostname}`
            )
          }
          // Convert to decimal
          result.result = _utils.hexToDecimal.call(void 0, result.result)
          return { server: _urlparse2.default.call(void 0, baseUrl).hostname, result }
        })

        jsonObj = response.result
        server = response.server
      } else {
        const tokenInfo = this.ethEngine.getTokenInfo(tk)
        if (
          tokenInfo != null &&
          typeof tokenInfo.contractAddress === 'string'
        ) {
          const params = {
            data: `0x70a08231${_utils.padHex.call(void 0, _utils.removeHexPrefix.call(void 0, address), 32)}`,
            to: tokenInfo.contractAddress
          }

          const response = await this.ethEngine.ethNetwork.multicastRpc(
            'eth_call',
            [params]
          )
          const result = response.result.result

          if (!result.startsWith('0x')) {
            throw new Error('Invalid return value. Result not hex')
          }
          response.result.result = _utils.hexToDecimal.call(void 0, result)

          jsonObj = response.result
          server = response.server
        }
      }
      cleanedResponseObj = _ethereumTypes.asRpcResultString.call(void 0, jsonObj)
    } catch (e) {
      this.ethEngine.error(
        `checkTokenBalRpc token ${tk} response ${String(_nullishCoalesce(response, () => ( '')))} `,
        e
      )
      throw new Error(
        `checkTokenBalRpc invalid ${tk} response ${JSON.stringify(jsonObj)}`
      )
    }

    return {
      tokenBal: { [tk]: cleanedResponseObj.result },
      server
    }
  }}

  /**
   * Check the eth-balance-checker contract for balances
   */
  // fetchTokenBalances is defined on this adaptor only if ethBalCheckerContract is defined
  __init7() {this.fetchTokenBalances =
    this.config.ethBalCheckerContract == null
      ? null
      : async () => {
          const { allTokensMap, networkInfo, walletLocalData, currencyInfo } =
            this.ethEngine
          const { chainParams } = networkInfo

          const tokenBal = {}
          const ethBalCheckerContract = this.config.ethBalCheckerContract
          if (ethBalCheckerContract == null) return tokenBal

          // Address for querying ETH balance on ETH network, MATIC on MATIC, etc.
          const mainnetAssetAddr = '0x0000000000000000000000000000000000000000'
          const balanceQueryAddrs = [mainnetAssetAddr]
          for (const rawToken of Object.values(this.ethEngine.allTokensMap)) {
            const token = _tokenHelpers.asMaybeContractLocation.call(void 0, rawToken.networkLocation)
            if (token != null) balanceQueryAddrs.unshift(token.contractAddress)
          }

          const balances = await this.serialServers(async baseUrl => {
            const ethProvider = new _ethers.ethers.providers.JsonRpcProvider(
              baseUrl,
              chainParams.chainId
            )

            const contract = new _ethers.ethers.Contract(
              ethBalCheckerContract,
              _ETH_BAL_CHECKER_ABIjson2.default,
              ethProvider
            )

            const contractCallRes = await contract.balances(
              [walletLocalData.publicKey],
              balanceQueryAddrs
            )
            if (contractCallRes.length !== balanceQueryAddrs.length) {
              throw new Error('checkEthBalChecker balances length mismatch')
            }
            return contractCallRes
          }).catch((e) => {
            throw new Error(
              `All rpc servers failed eth balance checks: ${String(e)}`
            )
          })

          // Parse data from smart contract call
          for (let i = 0; i < balances.length; i++) {
            const tokenAddr = balanceQueryAddrs[i].toLowerCase()
            const balanceBn = balances[i]

            let balanceCurrencyCode
            if (tokenAddr === mainnetAssetAddr) {
              const { currencyCode } = currencyInfo
              balanceCurrencyCode = currencyCode
            } else {
              const token = allTokensMap[tokenAddr.replace('0x', '')]
              if (token == null) {
                this.logError(
                  'checkEthBalChecker',
                  new Error(
                    `checkEthBalChecker missing builtinToken: ${tokenAddr}`
                  )
                )
                continue
              }
              const { currencyCode } = token
              balanceCurrencyCode = currencyCode
            }

            tokenBal[balanceCurrencyCode] =
              _ethers.ethers.BigNumber.from(balanceBn).toString()
          }

          return { tokenBal, server: 'ethBalChecker' }
        }}

  __init8() {this.fetchTxs = async (params) => {
    throw new Error('not implemented')
  }}

   addRpcApiKey(url) {
    const regex = /{{(.*?)}}/g
    const match = regex.exec(url)
    if (match != null) {
      const key = match[1]
      const cleanKey = _ethereumTypes.asEthereumInitKeys.call(void 0, key)
      const apiKey = this.ethEngine.initOptions[cleanKey]
      if (typeof apiKey === 'string') {
        url = url.replace(match[0], apiKey)
      } else if (apiKey == null) {
        throw new Error(
          `Missing ${cleanKey} in 'initOptions' for ${this.ethEngine.currencyInfo.pluginId}`
        )
      } else {
        throw new Error('Incorrect apikey type for RPC')
      }
    }
    return url
  }

  // TODO: Clean return type
   async fetchPostRPC(
    method,
    params,
    networkId,
    url
  ) {
    const body = {
      id: networkId,
      jsonrpc: '2.0',
      method,
      params
    }

    url = this.addRpcApiKey(url)

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
      this.throwError(response, 'fetchPostRPC', parsedUrl.hostname)
    }
    return await response.json()
  }
} exports.RpcAdapter = RpcAdapter;
