"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }

var _innerPlugin = require('../../common/innerPlugin');
var _tokenHelpers = require('../../common/tokenHelpers');


var _ethereumCommonInfo = require('./ethereumCommonInfo');

const builtinTokens = {
  a1077a294dde1b09bb078844df40758a5d0f9a27: {
    currencyCode: 'WPLS',
    displayName: 'Wrapped Pulse',
    denominations: [{ name: 'WPLS', multiplier: '1000000000000000000' }],
    networkLocation: {
      contractAddress: '0xA1077a294dDE1B09bB078844df40758a5D0f9a27'
    }
  }
}

const defaultNetworkFees = {
  default: {
    baseFeeMultiplier: {
      lowFee: '1',
      standardFeeLow: '1.25',
      standardFeeHigh: '1.5',
      highFee: '1.75'
    },
    gasLimit: {
      regularTransaction: '21000',
      tokenTransaction: '300000',
      minGasLimit: '21000'
    },
    gasPrice: {
      lowFee: '1000000001',
      standardFeeLow: '40000000001',
      standardFeeHigh: '300000000001',
      standardFeeLowAmount: '100000000000000000',
      standardFeeHighAmount: '10000000000000000000',
      highFee: '40000000001',
      minGasPrice: '1000000000'
    },
    minPriorityFee: '2000000000'
  }
}

const networkInfo = {
  networkAdapterConfigs: [
    {
      type: 'rpc',
      servers: ['https://rpc.pulsechain.com/']
    },
    {
      type: 'evmscan',
      servers: ['cors-https://scan.pulsechain.com']
    }
  ],
  uriNetworks: ['pulsechain'],
  ercTokenStandard: 'ERC20',
  chainParams: {
    chainId: 369,
    name: 'PulseChain'
  },
  supportsEIP1559: true,
  hdPathCoinType: 60,
  checkUnconfirmedTransactions: false,
  iosAllowedTokens: {},
  alethioCurrencies: null, // object or null
  amberDataBlockchainId: '',
  pluginMnemonicKeyName: 'pulsechainMnemonic',
  pluginRegularKeyName: 'pulsechainKey',
  ethGasStationUrl: null,
  defaultNetworkFees
}

const defaultSettings = {
  customFeeSettings: ['gasLimit', 'gasPrice'],
  otherSettings: { ...networkInfo }
}

 const currencyInfo = {
  canReplaceByFee: true,
  currencyCode: 'PLS',
  displayName: 'PulseChain',
  memoOptions: _ethereumCommonInfo.evmMemoOptions,
  pluginId: 'pulsechain',
  walletType: 'wallet:pulsechain',

  // Explorers:
  addressExplorer: 'https://beacon.pulsechain.com/address/%s',
  transactionExplorer: 'https://beacon.pulsechain.com/tx/%s',

  denominations: [
    {
      name: 'PLS',
      multiplier: '1000000000000000000',
      symbol: 'PLS'
    },
    {
      name: 'mPLS',
      multiplier: '1000000000000000',
      symbol: 'mPLS'
    }
  ],

  // Deprecated:
  defaultSettings,
  memoType: 'hex',
  metaTokens: _tokenHelpers.makeMetaTokens.call(void 0, builtinTokens)
}; exports.currencyInfo = currencyInfo

 const pulsechain = _innerPlugin.makeOuterPlugin({
  builtinTokens,
  currencyInfo: exports.currencyInfo,
  networkInfo,

  async getInnerPlugin() {
    return await Promise.resolve().then(() => _interopRequireWildcard(require('../EthereumTools')))
  }
}); exports.pulsechain = pulsechain
