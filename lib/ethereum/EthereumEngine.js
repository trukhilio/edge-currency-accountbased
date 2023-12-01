"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; } function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }var _common = require('@ethereumjs/common');
var _tx = require('@ethereumjs/tx');
var _biggystring = require('biggystring');
var _cleaners = require('cleaners');














var _types = require('edge-core-js/types');
// eslint-disable-next-line camelcase
var _ethsigutil = require('eth-sig-util');
var _ethereumjsabi = require('ethereumjs-abi'); var _ethereumjsabi2 = _interopRequireDefault(_ethereumjsabi);
var _ethereumjsutil = require('ethereumjs-util'); var _ethereumjsutil2 = _interopRequireDefault(_ethereumjsutil);
var _ethereumjswallet = require('ethereumjs-wallet'); var _ethereumjswallet2 = _interopRequireDefault(_ethereumjswallet);

var _CurrencyEngine = require('../common/CurrencyEngine');

var _upgradeMemos = require('../common/upgradeMemos');














var _utils = require('../common/utils');




var _ethereumConsts = require('./ethereumConsts');
var _EthereumNetwork = require('./EthereumNetwork');
var _ethereumSchema = require('./ethereumSchema');






























var _ethereumTypes = require('./ethereumTypes');




var _ethMiningFees = require('./fees/ethMiningFees');




var _feeProviders = require('./fees/feeProviders');

 class EthereumEngine extends _CurrencyEngine.CurrencyEngine


 {
  
  
  
  
  
  
  
  
  
  
  
  
  constructor(
    env,
    tools,
    walletInfo,
    initOptions,
    opts,
    currencyInfo
  ) {
    super(env, tools, walletInfo, opts);EthereumEngine.prototype.__init.call(this);
    this.initOptions = initOptions
    this.networkInfo = env.networkInfo
    this.ethNetwork = new (0, _EthereumNetwork.EthereumNetwork)(this)
    this.lastEstimatedGasLimit = {
      publicAddress: '',
      contractAddress: '',
      gasLimit: ''
    }
    if (this.networkInfo.l1RollupParams != null) {
      this.l1RollupParams = this.networkInfo.l1RollupParams
    }
    this.networkFees = this.networkInfo.defaultNetworkFees
    this.fetchCors = _utils.getFetchCors.call(void 0, env.io)

    // Update network fees from other providers
    const { infoFeeProvider, externalFeeProviders } = _feeProviders.FeeProviders.call(void 0, 
      this.fetchCors,
      this.currencyInfo,
      this.initOptions,
      this.log,
      this.networkInfo
    )
    this.infoFeeProvider = infoFeeProvider
    this.externalFeeProviders = [
      ...externalFeeProviders,
      this.updateNetworkFeesFromBaseFeePerGas
    ]

    this.utils = {
      signMessage: (message, privateKeys) => {
        if (!_utils.isHex.call(void 0, message)) throw new Error('ErrorInvalidMessage')
        const privKey = Buffer.from(privateKeys.privateKey, 'hex')
        const messageBuffer = _utils.hexToBuf.call(void 0, message)
        const messageHash = _ethereumjsutil2.default.hashPersonalMessage(messageBuffer)
        const { v, r, s } = _ethereumjsutil2.default.ecsign(messageHash, privKey)

        return _ethereumjsutil2.default.toRpcSig(v, r, s)
      },

      signTypedData: (
        typedData,
        privateKeys
      ) => {
        // Adapted from https://github.com/ethereum/EIPs/blob/master/assets/eip-712/Example.js
        const clean = _ethereumSchema.asEIP712TypedData.call(void 0, typedData)

        const privKey = Buffer.from(privateKeys.privateKey, 'hex')
        const { types } = clean

        // Recursively finds all the dependencies of a type
        // @ts-expect-error
        // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
        function dependencies(primaryType, found = []) {
          // @ts-expect-error
          if (found.includes(primaryType)) {
            return found
          }
          if (types[primaryType] === undefined) {
            return found
          }
          // @ts-expect-error
          found.push(primaryType)
          for (const field of types[primaryType]) {
            for (const dep of dependencies(field.type, found)) {
              if (!found.includes(dep)) {
                found.push(dep)
              }
            }
          }
          return found
        }

        // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
        function encodeType(primaryType) {
          // Get dependencies primary first, then alphabetical
          let deps = dependencies(primaryType)
          deps = deps.filter(t => t !== primaryType)
          // @ts-expect-error
          // eslint-disable-next-line @typescript-eslint/require-array-sort-compare
          deps = [primaryType].concat(deps.sort())

          // Format as a string with fields
          let result = ''
          for (const type of deps) {
            result += `${type}(${types[type]
              .map(({ name, type }) => `${type} ${name}`)
              .join(',')})`
          }
          return result
        }

        // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
        function typeHash(primaryType) {
          return _ethereumjsutil2.default.keccak256(encodeType(primaryType))
        }

        // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
        function encodeData(primaryType, data) {
          const encTypes = []
          const encValues = []

          // Add typehash
          encTypes.push('bytes32')
          encValues.push(typeHash(primaryType))

          // Add field contents
          for (const field of types[primaryType]) {
            let value = data[field.name]
            if (field.type === 'string' || field.type === 'bytes') {
              encTypes.push('bytes32')
              value = _ethereumjsutil2.default.keccak256(value)
              encValues.push(value)
            } else if (types[field.type] !== undefined) {
              encTypes.push('bytes32')
              value = _ethereumjsutil2.default.keccak256(encodeData(field.type, value))
              encValues.push(value)
            } else if (field.type.lastIndexOf(']') === field.type.length - 1) {
              throw new Error('Arrays currently unimplemented in encodeData')
            } else {
              encTypes.push(field.type)
              encValues.push(value)
            }
          }

          return _ethereumjsabi2.default.rawEncode(encTypes, encValues)
        }

        // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
        function structHash(primaryType, data) {
          return _ethereumjsutil2.default.keccak256(encodeData(primaryType, data))
        }

        // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
        function signHash() {
          return _ethereumjsutil2.default.keccak256(
            Buffer.concat([
              Buffer.from('1901', 'hex'),
              structHash('EIP712Domain', clean.domain),
              structHash(clean.primaryType, clean.message)
            ])
          )
        }

        const sig = _ethereumjsutil2.default.ecsign(signHash(), privKey)
        const { v, r, s } = sig

        return _ethereumjsutil2.default.bufferToHex(
          Buffer.concat([
            _ethereumjsutil2.default.setLengthLeft(r, 32),
            _ethereumjsutil2.default.setLengthLeft(s, 32),
            _ethereumjsutil2.default.toBuffer(v)
          ])
        )
      },

      txRpcParamsToSpendInfo: (params) => {
        const spendTarget = { otherParams: params }
        if (params.to != null) {
          spendTarget.publicAddress = params.to
        }
        if (params.value != null) {
          spendTarget.nativeAmount = _utils.hexToDecimal.call(void 0, params.value)
        } else {
          spendTarget.nativeAmount = '0'
        }

        let networkFeeOption
        let gasLimit
        let gasPrice
        if (params.gas != null) {
          gasLimit = _utils.hexToDecimal.call(void 0, params.gas)
          networkFeeOption = 'custom'
        }
        if (params.gasPrice != null) {
          gasPrice = _biggystring.div.call(void 0, 
            _utils.hexToDecimal.call(void 0, params.gasPrice),
            _ethereumConsts.WEI_MULTIPLIER.toString(),
            18
          )
          networkFeeOption = 'custom'
        }

        const spendInfo = {
          currencyCode: this.currencyInfo.currencyCode,
          spendTargets: [spendTarget],
          memos: [
            {
              type: 'hex',
              value: _utils.removeHexPrefix.call(void 0, params.data),
              hidden: true,
              memoName: 'data'
            }
          ],
          networkFeeOption,
          customNetworkFee: {
            gasLimit,
            gasPrice
          },
          otherParams: params
        }

        return spendInfo
      }
    }

    this.otherMethods = {
      parseWalletConnectV2Payload: async (payload) => {
        try {
          let nativeAmount = '0'
          let networkFee = '0'

          switch (payload.method) {
            case 'eth_sendTransaction':
            case 'eth_signTransaction': {
              const txParam = _cleaners.asObject.call(void 0, {
                from: _cleaners.asString,
                to: _cleaners.asOptional.call(void 0, _cleaners.asString),
                data: _cleaners.asString,
                gas: _cleaners.asOptional.call(void 0, _cleaners.asString),
                gasPrice: _cleaners.asOptional.call(void 0, _cleaners.asString),
                value: _cleaners.asOptional.call(void 0, _cleaners.asString)
              })(payload.params[0])

              const { gas, gasPrice, value } = txParam

              // Finish calculating the network fee using the gas limit
              const deriveNetworkFee = (gasLimit) => {
                if (gas == null) {
                  txParam.gas = _utils.decimalToHex.call(void 0, gasLimit)
                } else {
                  gasLimit = _utils.hexToDecimal.call(void 0, gas)
                }

                let gasPriceNetworkFee =
                  _nullishCoalesce(_optionalChain([this, 'access', _2 => _2.networkFees, 'access', _3 => _3.default, 'access', _4 => _4.gasPrice, 'optionalAccess', _5 => _5.standardFeeHigh]), () => ( '0'))
                if (gasPrice == null) {
                  txParam.gasPrice = _utils.decimalToHex.call(void 0, gasPriceNetworkFee)
                } else {
                  gasPriceNetworkFee = _utils.hexToDecimal.call(void 0, gasPrice)
                }

                networkFee = _biggystring.mul.call(void 0, gasLimit, gasPriceNetworkFee)
              }

              if (value != null) {
                nativeAmount = _utils.hexToDecimal.call(void 0, value)
              }

              // Get the gasLimit from currency info or from RPC node:
              if (_optionalChain([this, 'access', _6 => _6.networkFees, 'access', _7 => _7.default, 'access', _8 => _8.gasLimit, 'optionalAccess', _9 => _9.tokenTransaction]) == null) {
                this.ethNetwork
                  .multicastRpc('eth_estimateGas', [txParam])
                  .then((estimateGasResult) => {
                    const gasLimit = _biggystring.add.call(void 0, 
                      parseInt(estimateGasResult.result.result, 16).toString(),
                      '0'
                    )
                    deriveNetworkFee(gasLimit)
                  })
                  .catch((error) => {
                    this.warn(
                      `Wallet connect call_request failed to get gas limit`,
                      error
                    )
                  })
              } else {
                deriveNetworkFee(
                  _optionalChain([this, 'access', _10 => _10.networkFees, 'access', _11 => _11.default, 'access', _12 => _12.gasLimit, 'optionalAccess', _13 => _13.tokenTransaction])
                )
              }
              break
            }
          }

          return {
            nativeAmount,
            networkFee
          }
        } catch (e) {
          this.warn(`Wallet connect call_request `, e)
          throw e
        }
      },
      txRpcParamsToSpendInfo: async (
        params
      ) => {
        return this.utils.txRpcParamsToSpendInfo(params)
      }
    }
  }

  /**
   * Returns the gasLimit from eth_estimateGas RPC call.
   */
  async estimateGasLimit(context




) {
    const { contractAddress, estimateGasParams, miningFees, publicAddress } =
      context
    const hasUserMemo = estimateGasParams[0].data != null

    // If destination address is the same from the previous
    // estimate call, use the previously calculated gasLimit.
    if (
      this.lastEstimatedGasLimit.gasLimit !== '' &&
      this.lastEstimatedGasLimit.publicAddress === publicAddress &&
      this.lastEstimatedGasLimit.contractAddress === contractAddress
    ) {
      return this.lastEstimatedGasLimit.gasLimit
    }

    let gasLimitReturn = miningFees.gasLimit
    try {
      // Determine if recipient is a normal or contract address
      const getCodeResult = await this.ethNetwork.multicastRpc('eth_getCode', [
        estimateGasParams[0].to,
        'latest'
      ])
      // result === '0x' means we are sending to a plain address (no contract)
      const sendingToContract = getCodeResult.result.result !== '0x'

      const tryEstimatingGasLimit = async (
        attempt = 0
      ) => {
        const defaultGasLimit =
          this.networkInfo.defaultNetworkFees.default.gasLimit
        try {
          if (defaultGasLimit != null && !sendingToContract && !hasUserMemo) {
            // Easy case of sending plain mainnet token with no memo/data
            gasLimitReturn = defaultGasLimit.regularTransaction
          } else {
            const estimateGasResult = await this.ethNetwork.multicastRpc(
              'eth_estimateGas',
              [estimateGasParams]
            )
            gasLimitReturn = _biggystring.add.call(void 0, 
              parseInt(estimateGasResult.result.result, 16).toString(),
              '0'
            )
            if (sendingToContract) {
              // Overestimate (double) gas limit to reduce chance of failure when sending
              // to a contract. This includes sending any ERC20 token, sending ETH
              // to a contract, sending tokens to a contract, or any contract
              // execution (ie approvals, unstaking, etc)
              gasLimitReturn = _biggystring.mul.call(void 0, gasLimitReturn, '2')
            }
          }
          // Save locally to compare for future estimate calls
          this.lastEstimatedGasLimit = {
            publicAddress,
            contractAddress,
            gasLimit: gasLimitReturn
          }
        } catch (e) {
          // If no defaults, then we must estimate by RPC, so try again
          if (defaultGasLimit == null) {
            if (attempt > 5)
              throw new Error(
                'Unable to estimate gas limit after 5 tries. Please try again later'
              )
            return await tryEstimatingGasLimit(attempt + 1)
          }

          // If makeSpend received an explicit memo/data field from caller,
          // assume this is a smart contract call that needs accurate gasLimit
          // estimation and fail if we weren't able to get estimates from an
          // RPC node.
          if (hasUserMemo) {
            throw new Error(
              'Unable to estimate gas limit. Please try again later'
            )
          }
          // If we know the address is a contract but estimateGas fails use the default token gas limit
          if (defaultGasLimit.tokenTransaction != null)
            gasLimitReturn = defaultGasLimit.tokenTransaction
        }
      }

      await tryEstimatingGasLimit()

      // Sanity check calculated value
      if (
        _biggystring.lt.call(void 0, 
          gasLimitReturn,
          _nullishCoalesce(_optionalChain([this, 'access', _14 => _14.networkFees, 'access', _15 => _15.default, 'access', _16 => _16.gasLimit, 'optionalAccess', _17 => _17.minGasLimit]), () => ( '21000'))
        )
      ) {
        // Revert gasLimit back to the value from calcMiningFee
        gasLimitReturn = miningFees.gasLimit
        this.lastEstimatedGasLimit.gasLimit = ''
        throw new Error('Calculated gasLimit less than minimum')
      }
    } catch (e) {
      this.error(`makeSpend Error determining gas limit `, e)
    }

    return gasLimitReturn
  }

  setOtherData(raw) {
    this.otherData = _ethereumTypes.asEthereumWalletOtherData.call(void 0, raw)
  }

  /**
   *  Fetch network fees from various providers in order of priority, stopping
   *  and writing upon successful result.
   */
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  async updateNetworkFees() {
    for (const externalFeeProvider of this.externalFeeProviders) {
      try {
        const ethereumFee = await externalFeeProvider()
        if (ethereumFee == null) continue

        const ethereumFeeInts = {}
        Object.keys(ethereumFee).forEach(key => {
          const k = key 
          ethereumFeeInts[k] = _utils.biggyRoundToNearestInt.call(void 0, ethereumFee[k])
        })
        if (this.networkFees.default.gasPrice != null) {
          this.networkFees.default.gasPrice = {
            ...this.networkFees.default.gasPrice,
            ...ethereumFeeInts
          }
        }
        break
      } catch (e) {
        this.error(
          `Error fetching fees from ${
            externalFeeProvider.name
          }. ${JSON.stringify(e)}`
        )
      }
    }
  }

  async updateL1RollupParams() {
    if (this.l1RollupParams == null) return

    // L1GasPrice
    try {
      const params = {
        to: this.l1RollupParams.oracleContractAddress,
        data: this.l1RollupParams.gasPricel1BaseFeeMethod
      }
      const response = await this.ethNetwork.multicastRpc('eth_call', [
        params,
        'latests'
      ])
      const result = _ethereumTypes.asRpcResultString.call(void 0, response.result)

      this.l1RollupParams = {
        ...this.l1RollupParams,
        gasPriceL1Wei: _biggystring.ceil.call(void 0, 
          _biggystring.mul.call(void 0, 
            _utils.hexToDecimal.call(void 0, result.result),
            this.l1RollupParams.maxGasPriceL1Multiplier
          ),
          0
        )
      }
    } catch (e) {
      this.log.warn('Failed to update l1GasPrice', e)
    }

    // Dynamic overhead (scalar)
    try {
      const params = {
        to: this.l1RollupParams.oracleContractAddress,
        data: this.l1RollupParams.dynamicOverheadMethod
      }
      const response = await this.ethNetwork.multicastRpc('eth_call', [
        params,
        'latests'
      ])

      const result = _ethereumTypes.asRpcResultString.call(void 0, response.result)
      this.l1RollupParams = {
        ...this.l1RollupParams,
        dynamicOverhead: _utils.hexToDecimal.call(void 0, result.result)
      }
    } catch (e) {
      this.log.warn('Failed to update dynamicOverhead', e)
    }
  }

  /*
  This algorithm calculates fee amounts using the base multiplier from the
  info server.

  Formula:
    fee = baseMultiplier * baseFee + minPriorityFee

  Where:
    minPriorityFee = <minimum priority fee from info server>
    baseFee = <latest block's base fee>
    baseMultiplier = <multiplier from info server for low, standard, high, etc>

  Reference analysis for choosing 2 gwei minimum priority fee:
    https://hackmd.io/@q8X_WM2nTfu6nuvAzqXiTQ/1559-wallets#:~:text=2%20gwei%20is%20probably%20a%20very%20good%20default
  */
  __init() {this.updateNetworkFeesFromBaseFeePerGas = async (

) => {
    // Get base fees from 'rpcServers' and convert to our network fees format.
    // * Supported for post EIP-1559 chains only
    const { supportsEIP1559 = false } = this.networkInfo
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (!supportsEIP1559) return

    const baseFeePerGas = await this.ethNetwork.getBaseFeePerGas()
    if (baseFeePerGas == null) return
    const baseFeePerGasDecimal = _utils.hexToDecimal.call(void 0, baseFeePerGas)

    const networkFees = this.networkFees

    // Make sure there is a default network fee entry and gasPrice entry
    if (networkFees.default == null || networkFees.default.gasPrice == null) {
      return
    }

    const defaultNetworkFee =
      this.networkInfo.defaultNetworkFees.default

    // The minimum priority fee for slow transactions
    const minPriorityFee =
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions, @typescript-eslint/prefer-nullish-coalescing
      networkFees.default.minPriorityFee || defaultNetworkFee.minPriorityFee
    // This is how much we will multiply the base fee by
    const baseMultiplier =
      _nullishCoalesce(networkFees.default.baseFeeMultiplier, () => (
      defaultNetworkFee.baseFeeMultiplier))

    // Make sure the properties exist
    if (minPriorityFee == null || baseMultiplier == null) return

    const out = {
      lowFee: '',
      standardFeeLow: '',
      standardFeeHigh: '',
      highFee: ''
    }

    for (const feeType of Object.keys(baseMultiplier)) {
      // @ts-expect-error
      const baseFee = _biggystring.mul.call(void 0, baseMultiplier[feeType], baseFeePerGasDecimal)
      const totalFee = _biggystring.add.call(void 0, baseFee, minPriorityFee)
      // @ts-expect-error
      out[feeType] = _biggystring.div.call(void 0, totalFee, '1')
    }

    this.log(
      `updateNetworkFeesFromBaseFeePerGas ${this.currencyInfo.currencyCode}`
    )
    _feeProviders.printFees.call(void 0, this.log, out)
    return out
  }}

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  async clearBlockchainCache() {
    await super.clearBlockchainCache()
    this.otherData.nextNonce = '0'
    this.otherData.unconfirmedNextNonce = '0'
  }

  // ****************************************************************************
  // Public methods
  // ****************************************************************************

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  async startEngine() {
    this.engineOn = true
    const feeUpdateFrequencyMs =
      _nullishCoalesce(this.networkInfo.feeUpdateFrequencyMs, () => ( _ethereumConsts.NETWORK_FEES_POLL_MILLISECONDS))
    // Fetch the static fees from the info server only once to avoid overwriting live values.
    this.infoFeeProvider()
      .then(info => {
        this.log.warn(`infoFeeProvider:`, JSON.stringify(info, null, 2))

        this.networkFees = _utils.mergeDeeply.call(void 0, this.networkFees, info)
      })
      .catch(() => this.warn('Error fetching fees from Info Server'))
      .finally(
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        async () =>
          await this.addToLoop('updateNetworkFees', feeUpdateFrequencyMs)
      )
    this.addToLoop('updateL1RollupParams', _ethereumConsts.ROLLUP_FEE_PARAMS).catch(() => {})
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.ethNetwork.needsLoop()
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    super.startEngine()
  }

  async resyncBlockchain() {
    await this.killEngine()
    await this.clearBlockchainCache()
    await this.startEngine()
  }

  async getFreshAddress() {
    const { publicKey } = this.walletLocalData
    const publicAddress = /[A-F]/.test(publicKey)
      ? publicKey
      : _ethereumjsutil2.default.toChecksumAddress(publicKey.replace('0x', ''))

    return {
      publicAddress
    }
  }

  async getMaxSpendable(spendInfo) {
    spendInfo = _upgradeMemos.upgradeMemos.call(void 0, spendInfo, this.currencyInfo)
    const { edgeSpendInfo, currencyCode } = this.makeSpendCheck(spendInfo)

    const balance = this.getBalance({
      currencyCode: spendInfo.currencyCode
    })

    const spendTarget = spendInfo.spendTargets[0]
    const publicAddress = spendTarget.publicAddress
    if (publicAddress == null) {
      throw new Error('makeSpend Missing publicAddress')
    }
    const { contractAddress, data, value } = this.getTxParameterInformation(
      edgeSpendInfo,
      currencyCode,
      this.currencyInfo
    )

    if (spendInfo.currencyCode === this.currencyInfo.currencyCode) {
      // For mainnet currency, the fee can scale with the amount sent so we should find the
      // appropriate amount by recursively calling calcMiningFee. This is adapted from the
      // same function in edge-core-js.

      const getMax = async (min, max) => {
        const diff = _biggystring.sub.call(void 0, max, min)
        if (_biggystring.lte.call(void 0, diff, '1')) {
          return min
        }
        const mid = _biggystring.add.call(void 0, min, _biggystring.div.call(void 0, diff, '2'))

        // Try the average:
        spendInfo.spendTargets[0].nativeAmount = mid
        const miningFees = _ethMiningFees.calcMiningFees.call(void 0, 
          spendInfo,
          this.networkFees,
          this.currencyInfo,
          this.networkInfo
        )
        if (miningFees.useEstimatedGasLimit) {
          miningFees.gasLimit = await this.estimateGasLimit({
            contractAddress,
            estimateGasParams: [
              {
                to: _nullishCoalesce(contractAddress, () => ( publicAddress)),
                from: this.walletLocalData.publicKey,
                gas: '0xffffff',
                value,
                data
              },
              'latest'
            ],
            miningFees,
            publicAddress
          })
        }
        const fee = _biggystring.mul.call(void 0, miningFees.gasPrice, miningFees.gasLimit)
        let l1Fee = '0'

        if (this.l1RollupParams != null) {
          const txData = {
            nonce: this.otherData.unconfirmedNextNonce,
            gasPriceL1Wei: this.l1RollupParams.gasPriceL1Wei,
            gasLimit: miningFees.gasLimit,
            to: publicAddress,
            value: _utils.decimalToHex.call(void 0, mid),
            chainParams: this.networkInfo.chainParams,
            dynamicOverhead: this.l1RollupParams.dynamicOverhead,
            fixedOverhead: this.l1RollupParams.fixedOverhead
          }
          l1Fee = _ethMiningFees.calcL1RollupFees.call(void 0, txData)
        }
        const totalAmount = _biggystring.add.call(void 0, _biggystring.add.call(void 0, mid, fee), l1Fee)
        if (_biggystring.gt.call(void 0, totalAmount, balance)) {
          return await getMax(min, mid)
        } else {
          return await getMax(mid, max)
        }
      }

      return await getMax('0', _biggystring.add.call(void 0, balance, '1'))
    } else {
      spendInfo.spendTargets[0].nativeAmount = balance
      await this.makeSpend(spendInfo)
      return this.getBalance({
        currencyCode: spendInfo.currencyCode
      })
    }
  }

  getTxParameterInformation(
    edgeSpendInfo,
    currencyCode,
    currencyInfo
  ) {
    const { memos = [] } = edgeSpendInfo
    const { spendTargets } = edgeSpendInfo
    const spendTarget = spendTargets[0]
    const { publicAddress, nativeAmount } = spendTarget

    // Get data:
    let data = _optionalChain([memos, 'access', _18 => _18[0], 'optionalAccess', _19 => _19.type]) === 'hex' ? memos[0].value : undefined
    if (data != null && !data.startsWith('0x')) {
      data = `0x${data}`
    }

    // Get contractAddress and/or value:
    let value
    if (currencyCode === currencyInfo.currencyCode) {
      value = nativeAmount == null ? undefined : _utils.decimalToHex.call(void 0, nativeAmount)
      return {
        data,
        value
      }
    } else {
      let contractAddress
      if (data != null) {
        contractAddress = publicAddress
      } else {
        const tokenInfo = this.getTokenInfo(currencyCode)
        if (
          tokenInfo == null ||
          typeof tokenInfo.contractAddress !== 'string'
        ) {
          throw new Error(
            'Error: Token not supported or invalid contract address'
          )
        }

        contractAddress = tokenInfo.contractAddress

        // Derive the data from a ERC-20 token transfer smart-contract call:
        const dataArray = _ethereumjsabi2.default.simpleEncode(
          'transfer(address,uint256):(uint256)',
          publicAddress,
          _utils.decimalToHex.call(void 0, _nullishCoalesce(nativeAmount, () => ( '0')))
        )
        value = '0x0'
        data = '0x' + Buffer.from(dataArray).toString('hex')
      }
      return {
        contractAddress,
        data,
        value
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  async makeSpend(edgeSpendInfoIn) {
    edgeSpendInfoIn = _upgradeMemos.upgradeMemos.call(void 0, edgeSpendInfoIn, this.currencyInfo)
    const { edgeSpendInfo, currencyCode, skipChecks } =
      this.makeSpendCheck(edgeSpendInfoIn)
    const { memos = [] } = edgeSpendInfo

    const { pendingTxs = [] } = edgeSpendInfo

    // Ethereum can only have one output
    if (edgeSpendInfo.spendTargets.length !== 1) {
      throw new Error('Error: only one output allowed')
    }

    const spendTarget = edgeSpendInfo.spendTargets[0]
    const { publicAddress } = spendTarget
    let { nativeAmount } = spendTarget

    if (publicAddress == null)
      throw new Error('makeSpend Missing publicAddress')
    if (nativeAmount == null) throw new (0, _types.NoAmountSpecifiedError)()
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (!_ethereumjsutil2.default.isValidAddress(publicAddress)) {
      throw new TypeError(`Invalid ${this.currencyInfo.pluginId} address`)
    }

    let otherParams

    const miningFees = _ethMiningFees.calcMiningFees.call(void 0, 
      edgeSpendInfo,
      this.networkFees,
      this.currencyInfo,
      this.networkInfo
    )

    //
    // Nonce:
    //

    let nonceUsed

    // Determine the nonce to use from the number of pending transactions
    if (pendingTxs.length > 0) {
      // @ts-expect-error
      const otherData = this.walletLocalData.otherData
      const baseNonce =
        this.walletLocalData.numUnconfirmedSpendTxs > 0
          ? otherData.unconfirmedNextNonce
          : otherData.nextNonce
      nonceUsed = _biggystring.add.call(void 0, baseNonce, pendingTxs.length.toString())
    }

    const { contractAddress, data, value } = this.getTxParameterInformation(
      edgeSpendInfo,
      currencyCode,
      this.currencyInfo
    )

    // Set otherParams
    if (contractAddress == null) {
      otherParams = {
        from: [this.walletLocalData.publicKey],
        to: [publicAddress],
        gas: miningFees.gasLimit,
        gasPrice: miningFees.gasPrice,
        gasUsed: '0',
        nonceUsed,
        data,
        isFromMakeSpend: true
      }
    } else {
      otherParams = {
        from: [this.walletLocalData.publicKey],
        to: [contractAddress],
        gas: miningFees.gasLimit,
        gasPrice: miningFees.gasPrice,
        gasUsed: '0',
        tokenRecipientAddress: publicAddress,
        nonceUsed,
        data,
        isFromMakeSpend: true
      }
    }

    if (miningFees.useEstimatedGasLimit) {
      otherParams.gas = await this.estimateGasLimit({
        contractAddress,
        estimateGasParams: [
          {
            to: _nullishCoalesce(contractAddress, () => ( publicAddress)),
            from: this.walletLocalData.publicKey,
            gas: '0xffffff',
            value,
            data
          },
          'latest'
        ],
        miningFees,
        publicAddress
      })
    }

    const nativeBalance =
      _nullishCoalesce(this.walletLocalData.totalBalances[this.currencyInfo.currencyCode], () => ( '0'))

    let nativeNetworkFee = _biggystring.mul.call(void 0, miningFees.gasPrice, otherParams.gas)
    let totalTxAmount = '0'
    let parentNetworkFee = null
    let l1Fee = '0'

    if (this.l1RollupParams != null) {
      const txData = {
        nonce: otherParams.nonceUsed,
        gasPriceL1Wei: this.l1RollupParams.gasPriceL1Wei,
        gasLimit: otherParams.gas,
        to: otherParams.to[0],
        value: value,
        data: otherParams.data,
        chainParams: this.networkInfo.chainParams,
        dynamicOverhead: this.l1RollupParams.dynamicOverhead,
        fixedOverhead: this.l1RollupParams.fixedOverhead
      }
      l1Fee = _ethMiningFees.calcL1RollupFees.call(void 0, txData)
    }

    //
    // Balance checks:
    //

    if (currencyCode === this.currencyInfo.currencyCode) {
      nativeNetworkFee = _biggystring.add.call(void 0, nativeNetworkFee, l1Fee)
      totalTxAmount = _biggystring.add.call(void 0, nativeNetworkFee, nativeAmount)
      if (!skipChecks && _biggystring.gt.call(void 0, totalTxAmount, nativeBalance)) {
        throw new (0, _types.InsufficientFundsError)()
      }
      nativeAmount = _biggystring.mul.call(void 0, totalTxAmount, '-1')
    } else {
      parentNetworkFee = _biggystring.add.call(void 0, nativeNetworkFee, l1Fee)
      // Check if there's enough parent currency to pay the transaction fee, and if not return the parent currency code and amount
      if (!skipChecks && _biggystring.gt.call(void 0, nativeNetworkFee, nativeBalance)) {
        throw new (0, _types.InsufficientFundsError)({
          currencyCode: this.currencyInfo.currencyCode,
          networkFee: nativeNetworkFee
        })
      }
      const balanceToken =
        _nullishCoalesce(this.walletLocalData.totalBalances[currencyCode], () => ( '0'))
      if (!skipChecks && _biggystring.gt.call(void 0, nativeAmount, balanceToken)) {
        throw new (0, _types.InsufficientFundsError)()
      }
      nativeNetworkFee = '0' // Do not show a fee for token transactions.
      nativeAmount = _biggystring.mul.call(void 0, nativeAmount, '-1')
    }

    //
    // Create the unsigned EdgeTransaction
    //

    const edgeTransaction = {
      blockHeight: 0, // blockHeight
      currencyCode, // currencyCode
      date: 0, // date
      feeRateUsed: _EthereumNetwork.getFeeRateUsed.call(void 0, miningFees.gasPrice, otherParams.gas),
      isSend: nativeAmount.startsWith('-'),
      memos,
      nativeAmount, // nativeAmount
      networkFee: nativeNetworkFee, // networkFee
      otherParams, // otherParams
      ourReceiveAddresses: [], // ourReceiveAddresses
      signedTx: '', // signedTx
      txid: '', // txid
      walletId: this.walletId
    }

    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (parentNetworkFee) {
      edgeTransaction.parentNetworkFee = parentNetworkFee
    }

    return edgeTransaction
  }

  async signMessage(
    message,
    privateKeys,
    opts
  ) {
    const ethereumPrivateKeys = _ethereumTypes.asEthereumPrivateKeys.call(void 0, 
      this.currencyInfo.pluginId
    )(privateKeys)
    const otherParams = _ethereumTypes.asEthereumSignMessageParams.call(void 0, opts.otherParams)

    if (otherParams.typedData) {
      const typedData = JSON.parse(message)
      try {
        return this.utils.signTypedData(typedData, ethereumPrivateKeys)
      } catch (_) {
        // It's possible that the dApp makes the wrong call.
        // Try to sign using the latest signTypedData_v4 method.
        return _ethsigutil.signTypedData_v4.call(void 0, 
          Buffer.from(ethereumPrivateKeys.privateKey, 'hex'),
          {
            data: typedData
          }
        )
      }
    }

    return this.utils.signMessage(message, ethereumPrivateKeys)
  }

  async signTx(
    edgeTransaction,
    privateKeys
  ) {
    const ethereumPrivateKeys = _ethereumTypes.asEthereumPrivateKeys.call(void 0, 
      this.currencyInfo.pluginId
    )(privateKeys)
    const otherParams = _utils.getOtherParams.call(void 0, edgeTransaction)

    // Do signing
    const gasLimitHex = _utils.toHex.call(void 0, otherParams.gas)
    const gasPriceHex = _utils.toHex.call(void 0, otherParams.gasPrice)
    let txValue

    if (edgeTransaction.currencyCode === this.currencyInfo.currencyCode) {
      // Remove the networkFee from the nativeAmount
      const nativeAmount = _biggystring.add.call(void 0, 
        edgeTransaction.nativeAmount,
        edgeTransaction.networkFee
      )
      txValue = _biggystring.mul.call(void 0, '-1', nativeAmount, 16)
    } else {
      txValue = _biggystring.mul.call(void 0, '-1', edgeTransaction.nativeAmount, 16)
    }

    // If the nativeAmount for the transaction is negative, this means the
    // transaction being signed is a "receive transaction", and not a spend,
    // and we should not include an amount in the transaction's value field.
    if (_biggystring.lt.call(void 0, txValue, '0')) {
      txValue = '0x00'
    }

    // Nonce:

    let nonce = otherParams.nonceUsed
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (!nonce) {
      // Use an unconfirmed nonce if
      // 1. We have unconfirmed spending txs in the transaction list
      // 2. It is greater than the confirmed nonce
      // 3. Is no more than 5 higher than confirmed nonce
      // Otherwise, use the next nonce
      if (
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        this.walletLocalData.numUnconfirmedSpendTxs &&
        _biggystring.gt.call(void 0, this.otherData.unconfirmedNextNonce, this.otherData.nextNonce)
      ) {
        const diff = _biggystring.sub.call(void 0, 
          this.otherData.unconfirmedNextNonce,
          this.otherData.nextNonce
        )
        if (_biggystring.lte.call(void 0, diff, '5')) {
          nonce = this.otherData.unconfirmedNextNonce
          this.walletLocalDataDirty = true
        } else {
          const e = new Error('Excessive pending spend transactions')
          e.name = 'ErrorExcessivePendingSpends'
          throw e
        }
      } else {
        nonce = this.otherData.nextNonce
      }
    }
    // Convert nonce to hex for tsParams
    const nonceHex = _utils.toHex.call(void 0, nonce)

    // Data:

    let data
    if (otherParams.data != null) {
      data = otherParams.data
      if (edgeTransaction.currencyCode !== this.currencyInfo.currencyCode) {
        // Smart contract calls only allow for tx value if it's the parent currency
        txValue = '0x00'
      }
    } else if (
      edgeTransaction.currencyCode === this.currencyInfo.currencyCode
    ) {
      data = ''
    } else {
      const dataArray = _ethereumjsabi2.default.simpleEncode(
        'transfer(address,uint256):(uint256)',
        otherParams.tokenRecipientAddress,
        txValue
      )
      data = '0x' + Buffer.from(dataArray).toString('hex')
      txValue = '0x00'
    }

    // Select the chain
    const { chainParams } = this.networkInfo
    const common = _common.Common.custom(chainParams)

    // Translate legacy transaction types to EIP-1559 transaction type
    const txType = this.networkInfo.supportsEIP1559 === true ? 2 : 0
    // Translate legacy transaction types gas params to to EIP-1559 params
    const gasFeeParams = await _ethMiningFees.getFeeParamsByTransactionType.call(void 0, 
      txType,
      gasPriceHex,
      this.ethNetwork.getBaseFeePerGas
    )

    // Transaction Parameters
    const txParams = {
      nonce: nonceHex,
      ...gasFeeParams,
      gasLimit: gasLimitHex,
      to: otherParams.to[0],
      value: txValue,
      data,
      type: txType
    }

    const privKey = Buffer.from(ethereumPrivateKeys.privateKey, 'hex')

    // Log the private key address
    const wallet = _ethereumjswallet2.default.fromPrivateKey(privKey)
    this.warn(`signTx getAddressString ${wallet.getAddressString()}`)

    // Create and sign transaction
    const unsignedTx = _tx.TransactionFactory.fromTxData(txParams, { common })
    const signedTx = unsignedTx.sign(privKey)

    edgeTransaction.signedTx = _utils.uint8ArrayToHex.call(void 0, signedTx.serialize())
    edgeTransaction.txid = _utils.uint8ArrayToHex.call(void 0, signedTx.hash())
    edgeTransaction.date = Date.now() / 1000
    if (edgeTransaction.otherParams != null) {
      edgeTransaction.otherParams.nonceUsed = nonce
    }
    this.warn(`signTx\n${_utils.cleanTxLogs.call(void 0, edgeTransaction)}`)
    return edgeTransaction
  }

  async broadcastTx(
    edgeTransaction
  ) {
    await this.ethNetwork.broadcastTx(edgeTransaction)

    // Success
    this.warn(`SUCCESS broadcastTx\n${_utils.cleanTxLogs.call(void 0, edgeTransaction)}`)

    return edgeTransaction
  }

  async accelerate(
    edgeTransaction
  ) {
    const { currencyCode } = edgeTransaction

    const txOtherParams = _cleaners.asMaybe.call(void 0, (0, _ethereumTypes.asEthereumTxOtherParams))(
      edgeTransaction.otherParams
    )

    let replacedTxid = edgeTransaction.txid
    let replacedTxIndex = await this.findTransaction(
      currencyCode,
      _utils.normalizeAddress.call(void 0, replacedTxid)
    )
    if (replacedTxIndex === -1) {
      if (
        _optionalChain([txOtherParams, 'optionalAccess', _20 => _20.replacedTxid]) != null &&
        txOtherParams.replacedTxid !== ''
      ) {
        // If the tx parameter is not found, then perhaps it is a
        // replacement transaction itself
        replacedTxid = txOtherParams.replacedTxid
        replacedTxIndex = await this.findTransaction(
          currencyCode,
          _utils.normalizeAddress.call(void 0, replacedTxid)
        )
      }

      if (replacedTxIndex === -1) {
        // Cannot allow an unsaved (unobserved) transaction to be replaced
        return null
      }
    }
    const replacedTx =
      this.transactionList[currencyCode][replacedTxIndex]

    const replacedTxOtherParams = _cleaners.asMaybe.call(void 0, (0, _ethereumTypes.asEthereumTxOtherParams))(
      replacedTx.otherParams
    )

    // Transaction checks:
    // The transaction must be found and not confirmed or dropped.
    if (replacedTx == null || replacedTx.blockHeight !== 0) {
      return null
    }
    // Other params checks:
    if (
      replacedTxOtherParams == null ||
      // The transaction must have a known nonce used.
      replacedTxOtherParams.nonceUsed == null ||
      // We can only accelerate transaction created locally from makeSpend
      // due to the ambiguity of whether or not the transaction all the
      // necessary to sign the transaction and broadcast it.
      !replacedTxOtherParams.isFromMakeSpend
    ) {
      return null
    }
    // Must have a spend target
    const spendTarget = (_nullishCoalesce(replacedTx.spendTargets, () => ( [])))[0]
    if (spendTarget == null) return null

    // Accelerate transaction by doubling the gas price:
    const gasPrice = _biggystring.mul.call(void 0, replacedTxOtherParams.gasPrice, '2')
    const gasLimit = replacedTxOtherParams.gas
    const newOtherParams = {
      ...replacedTxOtherParams,
      gas: gasLimit,
      gasPrice,
      replacedTxid
    }

    let { nativeAmount } = spendTarget
    let nativeNetworkFee = _biggystring.mul.call(void 0, gasPrice, gasLimit)
    let totalTxAmount = '0'
    let parentNetworkFee

    //
    // Balance checks:
    //

    const parentNativeBalance =
      _nullishCoalesce(this.walletLocalData.totalBalances[this.currencyInfo.currencyCode], () => ( '0'))

    if (currencyCode === this.currencyInfo.currencyCode) {
      totalTxAmount = _biggystring.add.call(void 0, nativeNetworkFee, nativeAmount)
      if (_biggystring.gt.call(void 0, totalTxAmount, parentNativeBalance)) {
        throw new (0, _types.InsufficientFundsError)()
      }
      nativeAmount = _biggystring.mul.call(void 0, totalTxAmount, '-1')
    } else {
      parentNetworkFee = nativeNetworkFee
      // Check if there's enough parent currency to pay the transaction fee, and if not return the parent currency code and amount
      if (_biggystring.gt.call(void 0, nativeNetworkFee, parentNativeBalance)) {
        throw new (0, _types.InsufficientFundsError)({
          currencyCode: this.currencyInfo.currencyCode,
          networkFee: nativeNetworkFee
        })
      }
      const balanceToken =
        _nullishCoalesce(this.walletLocalData.totalBalances[currencyCode], () => ( '0'))
      if (_biggystring.gt.call(void 0, nativeAmount, balanceToken)) {
        throw new (0, _types.InsufficientFundsError)()
      }
      nativeNetworkFee = '0' // Do not show a fee for token transactions.
      nativeAmount = _biggystring.mul.call(void 0, nativeAmount, '-1')
    }

    // Return a EdgeTransaction object with the updates
    return {
      ...edgeTransaction,
      txid: '',
      feeRateUsed: _EthereumNetwork.getFeeRateUsed.call(void 0, gasPrice, gasLimit),
      nativeAmount,
      networkFee: nativeNetworkFee,
      otherParams: newOtherParams,
      parentNetworkFee
    }
  }

  // Overload saveTx to mutate replaced transactions by RBF
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  async saveTx(edgeTransaction) {
    const txOtherParams = _cleaners.asMaybe.call(void 0, (0, _ethereumTypes.asEthereumTxOtherParams))(
      edgeTransaction.otherParams
    )

    // We must check if this transaction replaces another transaction
    if (_optionalChain([txOtherParams, 'optionalAccess', _21 => _21.replacedTxid]) != null) {
      const { currencyCode } = edgeTransaction
      const txid = _utils.normalizeAddress.call(void 0, txOtherParams.replacedTxid)
      const index = this.findTransaction(currencyCode, txid)

      if (index !== -1) {
        const replacedEdgeTransaction =
          this.transactionList[currencyCode][index]

        // Use the RBF metadata because metadata for replaced transaction is not
        // present in edge-currency-accountbased state
        const metadata = edgeTransaction.metadata

        // Update the transaction's blockHeight to -1 (drops the transaction)
        const updatedEdgeTransaction = {
          ...replacedEdgeTransaction,
          metadata,
          blockHeight: -1
        }

        this.addTransaction(currencyCode, updatedEdgeTransaction)
      }
    }

    // Update the unconfirmed nonce if the transaction being saved is not confirmed
    if (edgeTransaction.blockHeight === 0) {
      const nonceUsed =
        _optionalChain([edgeTransaction, 'access', _22 => _22.otherParams, 'optionalAccess', _23 => _23.nonceUsed])
      if (nonceUsed != null) {
        this.otherData.unconfirmedNextNonce = _biggystring.add.call(void 0, nonceUsed, '1')
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    super.saveTx(edgeTransaction)
  }
} exports.EthereumEngine = EthereumEngine;

 async function makeCurrencyEngine(
  env,
  tools,
  walletInfo,
  opts
) {
  const { currencyInfo, initOptions } = env

  const safeWalletInfo = _ethereumTypes.asSafeEthWalletInfo.call(void 0, walletInfo)
  const engine = new EthereumEngine(
    env,
    tools,
    safeWalletInfo,
    _ethereumTypes.asEthereumInitOptions.call(void 0, initOptions),
    opts,
    currencyInfo
  )

  // Do any async initialization necessary for the engine
  await engine.loadEngine()

  return engine
} exports.makeCurrencyEngine = makeCurrencyEngine;
