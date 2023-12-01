"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }

var _innerPlugin = require('../../common/innerPlugin');



const builtinTokens = {}

const defaultNetworkFees = {
  default: {
    baseFeeMultiplier: undefined,
    gasLimit: {
      regularTransaction: '7569963',
      tokenTransaction: '7569963',
      minGasLimit: '7569963'
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
    minPriorityFee: undefined
  }
}

 const networkInfo = {
  networkAdapterConfigs: [
    {
      type: 'rpc',
      servers: ['https://api.node.glif.io/']
    }
  ],
  uriNetworks: ['filecoin'],
  ercTokenStandard: 'ERC20',
  chainParams: {
    chainId: 314,
    name: 'Filecoin'
  },
  hdPathCoinType: 461,
  feeUpdateFrequencyMs: 20000,
  supportsEIP1559: true,
  checkUnconfirmedTransactions: false,
  iosAllowedTokens: {},
  alethioCurrencies: null, // object or null
  amberDataBlockchainId: '', // ETH mainnet
  pluginMnemonicKeyName: 'filecoinfevmMnemonic',
  pluginRegularKeyName: 'filecoinfevmKey',
  ethGasStationUrl: null,
  defaultNetworkFees
}; exports.networkInfo = networkInfo

 const currencyInfo = {
  currencyCode: 'FIL',
  displayName: 'Filecoin FEVM',
  pluginId: 'filecoinfevm',
  requiredConfirmations: 900,
  walletType: 'wallet:filecoinfevm',

  // Explorers:
  addressExplorer: 'https://filfox.info/en/address/%s',
  transactionExplorer: 'https://filfox.info/en/message/%s',

  denominations: [
    {
      name: 'FIL',
      multiplier: '1000000000000000000',
      symbol: '⨎'
    },
    {
      name: 'milliFIL',
      multiplier: '1000000000000000',
      symbol: 'm⨎'
    },
    {
      name: 'microFIL',
      multiplier: '1000000000000',
      symbol: 'µ⨎'
    },
    {
      name: 'nanoFIL',
      multiplier: '1000000000',
      symbol: 'n⨎'
    },
    {
      name: 'picoFIL',
      multiplier: '1000000',
      symbol: 'p⨎'
    },
    {
      name: 'femtoFIL',
      multiplier: '1000',
      symbol: 'f⨎'
    },
    {
      name: 'attoFIL',
      multiplier: '1',
      symbol: 'a⨎'
    }
  ],

  // Deprecated:
  defaultSettings: {},
  metaTokens: []
}; exports.currencyInfo = currencyInfo

 const filecoinfevm = _innerPlugin.makeOuterPlugin(
  {
    builtinTokens,
    currencyInfo: exports.currencyInfo,
    networkInfo: exports.networkInfo,

    async getInnerPlugin() {
      return await Promise.resolve().then(() => _interopRequireWildcard(require('../EthereumTools')))
    }
  }
); exports.filecoinfevm = filecoinfevm
