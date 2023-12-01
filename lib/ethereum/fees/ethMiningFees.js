"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }var _common = require('@ethereumjs/common');
var _tx = require('@ethereumjs/tx');
var _biggystring = require('biggystring');

var _rfc4648 = require('rfc4648');

var _utils = require('../../common/utils');








 const ES_FEE_LOW = 'low'; exports.ES_FEE_LOW = ES_FEE_LOW
 const ES_FEE_STANDARD = 'standard'; exports.ES_FEE_STANDARD = ES_FEE_STANDARD
 const ES_FEE_HIGH = 'high'; exports.ES_FEE_HIGH = ES_FEE_HIGH
 const ES_FEE_CUSTOM = 'custom'; exports.ES_FEE_CUSTOM = ES_FEE_CUSTOM

const WEI_MULTIPLIER = '1000000000'
const TWO_GWEI = '2000000000'

 function calcMiningFees(
  spendInfo,
  networkFees,
  currencyInfo,
  networkInfo
) {
  let useGasLimitDefaults = true
  let customGasLimit, customGasPrice

  const { customNetworkFee } = _nullishCoalesce(spendInfo, () => ( {}))
  if (
    spendInfo.networkFeeOption === exports.ES_FEE_CUSTOM &&
    customNetworkFee != null
  ) {
    const { gasLimit, gasPrice } = customNetworkFee

    if (
      (isNaN(gasLimit) || gasLimit === '') &&
      (isNaN(gasPrice) || gasPrice === '')
    ) {
      const e = new Error(
        `Custom Fee must have at least gasLimit or gasPrice specified`
      )
      e.name = 'ErrorBelowMinimumFee'
      throw e
    }

    if (gasPrice != null && gasPrice !== '') {
      const minGasPrice =
        _nullishCoalesce(_optionalChain([networkFees, 'access', _ => _.default, 'optionalAccess', _2 => _2.gasPrice, 'optionalAccess', _3 => _3.minGasPrice]), () => (
        _optionalChain([networkInfo, 'access', _4 => _4.defaultNetworkFees, 'access', _5 => _5.default, 'access', _6 => _6.gasPrice, 'optionalAccess', _7 => _7.minGasPrice])))
      if (minGasPrice != null) {
        const gasPriceInWei = _biggystring.mul.call(void 0, gasPrice, WEI_MULTIPLIER)
        if (_biggystring.lt.call(void 0, gasPriceInWei, minGasPrice) || /^\s*$/.test(gasPrice)) {
          const e = new Error(
            `Gas price ${gasPriceInWei} wei below minimum ${minGasPrice} wei`
          )
          e.name = 'ErrorBelowMinimumFee'
          throw e
        }
      }

      customGasPrice = _biggystring.mul.call(void 0, gasPrice, WEI_MULTIPLIER)
    }

    if (gasLimit != null && gasLimit !== '') {
      const minGasLimit =
        _nullishCoalesce(_optionalChain([networkFees, 'access', _8 => _8.default, 'optionalAccess', _9 => _9.gasLimit, 'optionalAccess', _10 => _10.minGasLimit]), () => (
        _optionalChain([networkInfo, 'access', _11 => _11.defaultNetworkFees, 'access', _12 => _12.default, 'access', _13 => _13.gasLimit, 'optionalAccess', _14 => _14.minGasLimit])))
      if (
        (minGasLimit != null && _biggystring.lt.call(void 0, gasLimit, minGasLimit)) ||
        /^\s*$/.test(gasLimit)
      ) {
        const e = new Error(
          `Gas limit ${gasLimit} below minimum ${minGasLimit}`
        )
        e.name = 'ErrorBelowMinimumFee'
        throw e
      }
      customGasLimit = gasLimit

      // Set to false since we have a custom gasLimit
      useGasLimitDefaults = false
    }
  }

  if (customGasLimit != null && customGasPrice != null) {
    return {
      gasLimit: customGasLimit,
      gasPrice: customGasPrice,
      useEstimatedGasLimit: false
    }
  }

  let networkFeeForGasPrice = networkFees.default
  let networkFeeForGasLimit = networkFees.default

  if (typeof _optionalChain([spendInfo, 'access', _15 => _15.spendTargets, 'access', _16 => _16[0], 'optionalAccess', _17 => _17.publicAddress]) === 'string') {
    // If we have incomplete fees from custom fees, calculate as normal
    const targetAddress = _utils.normalizeAddress.call(void 0, 
      spendInfo.spendTargets[0].publicAddress
    )
    if (typeof networkFees[targetAddress] !== 'undefined') {
      networkFeeForGasLimit = networkFees[targetAddress]
      useGasLimitDefaults = false
      if (typeof networkFeeForGasLimit.gasPrice !== 'undefined') {
        networkFeeForGasPrice = networkFeeForGasLimit
      }
    }
  }

  let useLimit = 'regularTransaction'
  if (
    spendInfo.currencyCode != null &&
    spendInfo.currencyCode !== currencyInfo.currencyCode
  ) {
    useLimit = 'tokenTransaction'
  }

  let networkFeeOption = 'standard'
  if (
    typeof spendInfo.networkFeeOption === 'string' &&
    spendInfo.networkFeeOption !== exports.ES_FEE_CUSTOM
  ) {
    networkFeeOption = spendInfo.networkFeeOption
  }

  const gasLimit =
    networkFeeForGasLimit.gasLimit != null
      ? networkFeeForGasLimit.gasLimit[useLimit]
      : '21000'
  let gasPrice = ''
  if (spendInfo.spendTargets[0].nativeAmount == null) {
    throw new Error('ErrorInvalidNativeAmount')
  }
  let nativeAmount = spendInfo.spendTargets[0].nativeAmount
  if (useLimit === 'tokenTransaction') {
    // Small hack. Edgetimate the relative value of token to ethereum as 10%
    nativeAmount = _biggystring.div.call(void 0, nativeAmount, '10')
  }
  if (networkFeeForGasPrice.gasPrice == null) {
    throw new Error('ErrorInvalidGasPrice')
  }
  const gasPriceObj = networkFeeForGasPrice.gasPrice
  switch (networkFeeOption) {
    case exports.ES_FEE_LOW:
      gasPrice = gasPriceObj.lowFee
      break
    case exports.ES_FEE_STANDARD: {
      if (
        _biggystring.gte.call(void 0, nativeAmount, networkFeeForGasPrice.gasPrice.standardFeeHighAmount)
      ) {
        gasPrice = gasPriceObj.standardFeeHigh
        break
      }

      if (_biggystring.lte.call(void 0, nativeAmount, gasPriceObj.standardFeeLowAmount)) {
        if (networkFeeForGasPrice.gasPrice == null) {
          throw new Error('ErrorInvalidGasPrice')
        }
        gasPrice = networkFeeForGasPrice.gasPrice.standardFeeLow
        break
      }

      // Scale the fee by the amount the user is sending scaled between standardFeeLowAmount and standardFeeHighAmount
      const lowHighAmountDiff = _biggystring.sub.call(void 0, 
        gasPriceObj.standardFeeHighAmount,
        gasPriceObj.standardFeeLowAmount
      )
      const lowHighFeeDiff = _biggystring.sub.call(void 0, 
        gasPriceObj.standardFeeHigh,
        gasPriceObj.standardFeeLow
      )

      // How much above the lowFeeAmount is the user sending
      const amountDiffFromLow = _biggystring.sub.call(void 0, 
        nativeAmount,
        gasPriceObj.standardFeeLowAmount
      )

      // Add this much to the low fee = (amountDiffFromLow * lowHighFeeDiff) / lowHighAmountDiff)
      const temp1 = _biggystring.mul.call(void 0, amountDiffFromLow, lowHighFeeDiff)
      const addFeeToLow = _biggystring.div.call(void 0, temp1, lowHighAmountDiff)
      gasPrice = _biggystring.add.call(void 0, gasPriceObj.standardFeeLow, addFeeToLow)
      break
    }

    case exports.ES_FEE_HIGH:
      gasPrice = networkFeeForGasPrice.gasPrice.highFee
      break
    default:
      throw new Error(`Invalid networkFeeOption`)
  }
  const out = {
    gasLimit: _nullishCoalesce(customGasLimit, () => ( gasLimit)),
    gasPrice: _nullishCoalesce(customGasPrice, () => ( gasPrice)),
    useEstimatedGasLimit: useGasLimitDefaults
  }
  return out
} exports.calcMiningFees = calcMiningFees;

const MAX_SIGNATURE_COST = '1040' // (32 + 32 + 1) * 16 max cost for adding r, s, v signatures to raw transaction

// This is a naive (optimistic??) implementation but is good enough as an
// estimate since it isn't possible to calculate this exactly without having
// signatures yet.
 const calcL1RollupFees = (params) => {
  const {
    chainParams,
    data,
    dynamicOverhead,
    fixedOverhead,
    gasPriceL1Wei,
    gasLimit,
    nonce,
    to,
    value = '0x0'
  } = params

  const common = _common.Common.custom(chainParams)
  const tx = _tx.TransactionFactory.fromTxData(
    {
      nonce: nonce != null ? _utils.decimalToHex.call(void 0, nonce) : undefined,
      gasPrice: _utils.decimalToHex.call(void 0, gasPriceL1Wei),
      gasLimit: _utils.decimalToHex.call(void 0, gasLimit),
      to,
      value,
      data: data === null ? undefined : data
    },
    { common }
  )

  const txRaw = tx.raw()
  const byteGroups = flatMap(txRaw)
  const unsignedRawTxData = byteGroups
    .map(bytes => {
      if (bytes == null) return ''
      return _rfc4648.base16.stringify(bytes).toLowerCase()
    })
    .join()
  const unsignedRawTxBytesArray = unsignedRawTxData.match(/(.{1,2})/g)
  if (unsignedRawTxBytesArray == null) {
    throw new Error('Invalid rawTx string')
  }

  let rawTxCost = 0
  for (let i = 0; i < unsignedRawTxBytesArray.length; i++) {
    if (unsignedRawTxBytesArray[i] === '00') {
      rawTxCost += 4 // cost for zero byte
    } else {
      rawTxCost += 16 // cost for non-zero byte
    }
  }

  const gasUsed = _biggystring.add.call(void 0, 
    _biggystring.add.call(void 0, rawTxCost.toString(), fixedOverhead),
    MAX_SIGNATURE_COST
  )

  const scalar = _biggystring.div.call(void 0, dynamicOverhead, '1000000', 18)

  const total = _biggystring.ceil.call(void 0, _biggystring.mul.call(void 0, _biggystring.mul.call(void 0, gasPriceL1Wei, gasUsed), scalar), 0)

  return total
}; exports.calcL1RollupFees = calcL1RollupFees



function flatMap(items, destinationItems = []) {
  items.forEach(item => {
    if (item == null) return
    if (Array.isArray(item)) {
      return flatMap(item, destinationItems)
    }
    destinationItems.push(item)
  })
  return destinationItems
}








/**
 * Returns gas parameters needed to build a transaction based on the transaction
 * type (legacy or EIP-1559 transaction).
 *
 * @param transactionType The EIP-2718 8-bit uint transaction type
 * @param gasPrice The gas price hex string value
 * @param fetchBaseFeePerGas An async function which retrieves the
 * current network base fee
 * @returns An object containing the gas parameters for the transaction
 */
 async function getFeeParamsByTransactionType(
  transactionType,
  gasPrice,
  fetchBaseFeePerGas
) {
  if (transactionType < 2) {
    return { gasPrice }
  } else {
    const baseFeePerGas = await fetchBaseFeePerGas()
    if (baseFeePerGas == null) {
      throw new Error(
        'Missing baseFeePerGas from network block query. ' +
          'RPC node does not supporting EIP1559 block format.'
      )
    }
    const maxFeePerGasUnPegged = _biggystring.sub.call(void 0, gasPrice, baseFeePerGas, 16)

    // In case the calculated gasPrice creates a maxPriorityFeePerGas (tip)
    // less than 2 GWEI, use at least 2 gwei
    const maxPriorityFeePerGas = _biggystring.max.call(void 0, maxFeePerGasUnPegged, TWO_GWEI, 16)
    return {
      maxPriorityFeePerGas,
      maxFeePerGas: gasPrice
    }
  }
} exports.getFeeParamsByTransactionType = getFeeParamsByTransactionType;
