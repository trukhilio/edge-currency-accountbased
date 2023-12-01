"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } }var _biggystring = require('biggystring');
var _cleaners = require('cleaners');







var _network = require('../../common/network');
var _utils = require('../../common/utils');





var _ethereumConsts = require('../ethereumConsts');
var _ethereumSchema = require('../ethereumSchema');









var _ethereumTypes = require('../ethereumTypes');

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
 const printFees = (log, fees) => {
  const keys = Object.keys(fees)
  for (const key of keys) {
    // @ts-expect-error
    const value = fees[key]
    if (typeof value === 'string')
      log(`  ${key}: ${_biggystring.div.call(void 0, value, '1000000000', 18)} gwei`)
  }
}; exports.printFees = printFees









 const FeeProviders = (
  fetch,
  currencyInfo,
  initOptions,
  log,
  networkInfo
) => {
  const providerFns = [
    exports.fetchFeesFromEvmScan,
    exports.fetchFeesFromEvmGasStation,
    exports.fetchFeesFromRpc
  ]

  return {
    infoFeeProvider: async () =>
      await exports.fetchFeesFromInfoServer.call(void 0, fetch, currencyInfo),
    externalFeeProviders: providerFns.map(
      provider => async () =>
        await provider(fetch, currencyInfo, initOptions, log, networkInfo)
    )
  }
}; exports.FeeProviders = FeeProviders

 const fetchFeesFromRpc = async (
  fetch,
  currencyInfo,
  initOptions,
  log,
  networkInfo
) => {
  const { networkAdapterConfigs, supportsEIP1559 = false } = networkInfo
  if (supportsEIP1559) return

  const rpcConfig = networkAdapterConfigs.find(config => config.type === 'rpc')
  if (rpcConfig == null) return
  const rpcServers = rpcConfig.servers

  const server = _utils.pickRandom.call(void 0, rpcServers, 1)[0]

  const opts = {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    method: 'POST',
    body: JSON.stringify({
      method: 'eth_gasPrice',
      params: [],
      id: 1,
      jsonrpc: '2.0'
    })
  }

  const fetchResponse = await fetch(server, opts)
  if (!fetchResponse.ok) {
    const text = await fetchResponse.text()
    throw new Error(`fetchFeesFromRpc fetch error: ${text}`)
  }

  const json = await fetchResponse.json()
  const rpcGasResponse = _cleaners.asMaybe.call(void 0, (0, _ethereumTypes.asRpcResultString))(json)

  if (rpcGasResponse == null) {
    throw new Error(`fetchFeesFromRpc ${server} returned invalid json: ${json}`)
  }

  const { result } = rpcGasResponse
  const gasPrice = _utils.hexToDecimal.call(void 0, result)

  const out = {
    lowFee: _biggystring.mul.call(void 0, gasPrice, '1'),
    standardFeeLow: _biggystring.mul.call(void 0, gasPrice, '1.06'),
    standardFeeHigh: _biggystring.mul.call(void 0, gasPrice, '1.12'),
    highFee: _biggystring.mul.call(void 0, gasPrice, '1.25')
  }
  log(`fetchFeesFromRpc: ${currencyInfo.currencyCode}`)
  exports.printFees.call(void 0, log, out)
  return out
}; exports.fetchFeesFromRpc = fetchFeesFromRpc

// This method is deprecated for ETH and other chains that hard forked to EIP 1559
 const fetchFeesFromEvmScan = async (
  fetch,
  currencyInfo,
  initOptions,
  log,
  networkInfo
) => {
  const { networkAdapterConfigs } = networkInfo

  const evmScanConfig = networkAdapterConfigs.find(
    config => config.type === 'evmscan'
  )
  if (evmScanConfig == null) return

  const evmScanApiServers = evmScanConfig.servers
  const scanApiKey = exports.getEvmScanApiKey.call(void 0, initOptions, currencyInfo, log)
  if (evmScanApiServers == null || scanApiKey == null) return

  const apiKey = `&apikey=${
    Array.isArray(scanApiKey) ? _utils.pickRandom.call(void 0, scanApiKey, 1)[0] : _nullishCoalesce(scanApiKey, () => ( ''))
  }`
  const url = `${
    _utils.pickRandom.call(void 0, evmScanApiServers, 1)[0]
  }/api?module=gastracker&action=gasoracle${apiKey}`

  const fetchResponse = await fetch(url)
  if (!fetchResponse.ok)
    throw new Error(`EvmScan fetch error: ${JSON.stringify(fetchResponse)}`)

  const esGasResponse = await fetchResponse.json()
  const isRateLimited = esGasResponse.message.includes('NOTOK')
  const isValid = esGasResponse != null && !isRateLimited

  if (!isValid) {
    throw new Error(
      `fetchFeesFromEvmScan unrecognized response message: ${esGasResponse.message}`
    )
  }

  const { SafeGasPrice, ProposeGasPrice, FastGasPrice } =
    _ethereumTypes.asEvmScanGasResponseResult.call(void 0, esGasResponse.result)
  const newSafeLow = parseInt(SafeGasPrice)
  let newAverage = parseInt(ProposeGasPrice)
  let newFast = parseInt(FastGasPrice)

  // Correct inconsistencies, convert values
  if (newAverage <= newSafeLow) newAverage = newSafeLow + 1
  if (newFast <= newAverage) newFast = newAverage + 1

  const lowFee = `${newSafeLow * _ethereumConsts.WEI_MULTIPLIER}`
  const standardFeeLow = `${((newSafeLow + newAverage) / 2) * _ethereumConsts.WEI_MULTIPLIER}`
  const standardFeeHigh = `${newFast * _ethereumConsts.WEI_MULTIPLIER}`
  const highFee = `${(newFast * _ethereumConsts.WEI_MULTIPLIER) / _ethereumConsts.OPTIMAL_FEE_HIGH_MULTIPLIER}`

  const out = { lowFee, standardFeeLow, standardFeeHigh, highFee }
  log(`fetchFeesFromEvmScan: ${currencyInfo.currencyCode}`)
  exports.printFees.call(void 0, log, out)
  return out
}; exports.fetchFeesFromEvmScan = fetchFeesFromEvmScan

 const fetchFeesFromEvmGasStation = async (
  fetch,
  currencyInfo,
  initOptions,
  log,
  networkInfo
) => {
  const { ethGasStationUrl } = networkInfo
  const gasStationApiKey = exports.getGasStationApiKey.call(void 0, initOptions, currencyInfo, log)
  if (ethGasStationUrl == null || gasStationApiKey == null) return

  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  const apiKeyParams = gasStationApiKey
    ? // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      `?api-key=${gasStationApiKey || ''}`
    : ''
  const result = await fetch(`${ethGasStationUrl}${apiKeyParams}`)
  const jsonObj = await result.json()

  const fees = _ethereumSchema.asEthGasStation.call(void 0, jsonObj)
  // Special case for MATIC fast and fastest being equivalent from gas station
  if (currencyInfo.currencyCode === 'MATIC') {
    // Since the later code assumes EthGasStation's
    // greater-by-a-factor-of-ten gas prices, we need to multiply the GWEI
    // from Polygon Gas Station by 10 so they conform.
    fees.safeLow *= 10
    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    fees.average = ((jsonObj.fast + jsonObj.safeLow) / 2) * 10
    fees.fast = jsonObj.standard * 10
    fees.fastest *= 10
  }

  // Sanity checks
  if (fees.safeLow <= 0 || fees.safeLow > _ethereumConsts.GAS_PRICE_SANITY_CHECK) {
    throw new Error('Invalid safeLow value from Gas Station')
  }
  if (fees.average < 1 || fees.average > _ethereumConsts.GAS_PRICE_SANITY_CHECK) {
    throw new Error('Invalid average value from Gas Station')
  }
  if (fees.fast < 1 || fees.fast > _ethereumConsts.GAS_PRICE_SANITY_CHECK) {
    throw new Error('Invalid fastest value from Gas Station')
  }
  if (fees.fastest < 1 || fees.fastest > _ethereumConsts.GAS_PRICE_SANITY_CHECK) {
    throw new Error('Invalid fastest value from Gas Station')
  }

  // Correct inconsistencies, set gas prices
  if (fees.average <= fees.safeLow) fees.average = fees.safeLow + 1
  if (fees.fast <= fees.average) fees.fast = fees.average + 1
  if (fees.fastest <= fees.fast) fees.fastest = fees.fast + 1

  let lowFee = fees.safeLow
  let standardFeeLow = fees.fast
  let standardFeeHigh = ((fees.fast + fees.fastest) * 0.5 + fees.fastest) * 0.5
  let highFee = standardFeeHigh > fees.fastest ? standardFeeHigh : fees.fastest

  lowFee = Math.round(lowFee) * _ethereumConsts.GAS_STATION_WEI_MULTIPLIER
  standardFeeLow = Math.round(standardFeeLow) * _ethereumConsts.GAS_STATION_WEI_MULTIPLIER
  standardFeeHigh = Math.round(standardFeeHigh) * _ethereumConsts.GAS_STATION_WEI_MULTIPLIER
  highFee = Math.round(highFee) * _ethereumConsts.GAS_STATION_WEI_MULTIPLIER

  const out = {
    lowFee: lowFee.toString(),
    standardFeeLow: standardFeeLow.toString(),
    standardFeeHigh: standardFeeHigh.toString(),
    highFee: highFee.toString()
  }
  log(`fetchFeesFromEvmGasStation: ${currencyInfo.currencyCode}`)
  exports.printFees.call(void 0, log, out)
  return out
}; exports.fetchFeesFromEvmGasStation = fetchFeesFromEvmGasStation

 const fetchFeesFromInfoServer = async (
  fetch,
  { pluginId }
) => {
  const result = await _network.fetchInfo.call(void 0, 
    `v1/networkFees/${pluginId}`,
    undefined,
    undefined,
    fetch
  )
  const json = await result.json()
  return _ethereumTypes.asEthereumFees.call(void 0, json)
}; exports.fetchFeesFromInfoServer = fetchFeesFromInfoServer

// Backwards compatibility with deprecated etherscan api keys
 const getEvmScanApiKey = (
  initOptions,
  info,
  log
) => {
  const {
    evmScanApiKey,
    etherscanApiKey,
    ftmscanApiKey,
    bscscanApiKey,
    polygonscanApiKey
  } = initOptions
  if (evmScanApiKey != null) return evmScanApiKey
  const { currencyCode } = info
  if (currencyCode === 'ETH' && etherscanApiKey != null) {
    log.warn(
      "INIT OPTION 'etherscanApiKey' IS DEPRECATED. USE 'evmScanApiKey' INSTEAD"
    )
    return etherscanApiKey
  }
  if (currencyCode === 'FTM' && ftmscanApiKey != null) {
    log.warn(
      "INIT OPTION 'ftmscanApiKey' IS DEPRECATED. USE 'evmScanApiKey' INSTEAD"
    )
    return ftmscanApiKey
  }
  if (currencyCode === 'BNB' && bscscanApiKey != null) {
    log.warn(
      "INIT OPTION 'bscscanApiKey' IS DEPRECATED. USE 'evmScanApiKey' INSTEAD"
    )
    return bscscanApiKey
  }
  if (currencyCode === 'MATIC' && polygonscanApiKey != null) {
    log.warn(
      "INIT OPTION 'polygonscanApiKey' IS DEPRECATED. USE 'evmScanApiKey' INSTEAD"
    )
    return polygonscanApiKey
  }
}; exports.getEvmScanApiKey = getEvmScanApiKey

// Backwards compatibility with deprecated ethgasstation api keys
 const getGasStationApiKey = (
  initOptions,
  info,
  log
) => {
  const { gasStationApiKey, ethGasStationApiKey } = initOptions
  if (gasStationApiKey != null) return gasStationApiKey
  const { currencyCode } = info
  if (currencyCode === 'ETH' && ethGasStationApiKey != null) {
    log.warn(
      "INIT OPTION 'ethGasStationApiKey' IS DEPRECATED. USE 'gasStationApiKey' INSTEAD"
    )
    return ethGasStationApiKey
  }
}; exports.getGasStationApiKey = getGasStationApiKey
