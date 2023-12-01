"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }

var _innerPlugin = require('../../common/innerPlugin');
var _tokenHelpers = require('../../common/tokenHelpers');


var _ethereumCommonInfo = require('./ethereumCommonInfo');

const builtinTokens = {
  '2c78f1b70ccf63cdee49f9233e9faa99d43aa07e': {
    currencyCode: 'DAI',
    displayName: 'Dai Stablecoin',
    denominations: [{ name: 'DAI', multiplier: '1000000000000000000' }],
    networkLocation: {
      contractAddress: '0x2c78f1b70ccf63cdee49f9233e9faa99d43aa07e'
    }
  }
}

const defaultNetworkFees = {
  default: {
    baseFeeMultiplier: undefined,
    gasLimit: {
      regularTransaction: '21000',
      tokenTransaction: '200000',
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
    minPriorityFee: undefined
  },
  '1983987abc9837fbabc0982347ad828': {
    baseFeeMultiplier: undefined,
    // @ts-expect-error
    gasLimit: {
      regularTransaction: '21002',
      tokenTransaction: '37124'
    },
    // @ts-expect-error
    gasPrice: {
      lowFee: '1000000002',
      standardFeeLow: '40000000002',
      standardFeeHigh: '300000000002',
      standardFeeLowAmount: '200000000000000000',
      standardFeeHighAmount: '20000000000000000000',
      highFee: '40000000002'
    },
    minPriorityFee: undefined
  },
  '2983987abc9837fbabc0982347ad828': {
    baseFeeMultiplier: undefined,
    // @ts-expect-error
    gasLimit: {
      regularTransaction: '21002',
      tokenTransaction: '37124'
    },
    gasPrice: undefined,
    minPriorityFee: undefined
  }
}

const networkInfo = {
  networkAdapterConfigs: [
    {
      type: 'rpc',
      servers: ['https://www.ethercluster.com/etc']
    },
    {
      type: 'evmscan',
      servers: [] // ['https://blockscout.com/etc/mainnet'],
    },
    {
      type: 'blockbook',
      servers: ['https://etcbook.guarda.co', 'https://etc1.trezor.io']
    }
  ],
  uriNetworks: ['ethereumclassic', 'etherclass'],
  ercTokenStandard: 'ERC20',
  chainParams: {
    chainId: 61,
    name: 'Ethereum Classic'
  },
  hdPathCoinType: 61,
  checkUnconfirmedTransactions: false,
  iosAllowedTokens: {},
  alethioCurrencies: null, // object or null
  amberDataBlockchainId: '', // ETH mainnet
  pluginMnemonicKeyName: 'ethereumclassicMnemonic',
  pluginRegularKeyName: 'ethereumclassicKey',
  ethGasStationUrl: null,
  defaultNetworkFees
}

const defaultSettings = {
  customFeeSettings: ['gasLimit', 'gasPrice'],
  otherSettings: { ...networkInfo }
}

 const currencyInfo = {
  canReplaceByFee: true,
  currencyCode: 'ETC',
  displayName: 'Ethereum Classic',
  memoOptions: _ethereumCommonInfo.evmMemoOptions,
  pluginId: 'ethereumclassic',
  walletType: 'wallet:ethereumclassic',

  // Explorers:
  addressExplorer: 'https://blockscout.com/etc/mainnet/address/%s',
  transactionExplorer: 'https://blockscout.com/etc/mainnet/tx/%s',

  denominations: [
    {
      name: 'ETC',
      multiplier: '1000000000000000000',
      symbol: 'Ξ'
    },
    {
      name: 'mETC',
      multiplier: '1000000000000000',
      symbol: 'mΞ'
    }
  ],

  // Deprecated:
  defaultSettings,
  memoType: 'hex',
  metaTokens: _tokenHelpers.makeMetaTokens.call(void 0, builtinTokens)
}; exports.currencyInfo = currencyInfo

 const ethereumclassic = _innerPlugin.makeOuterPlugin


({
  builtinTokens,
  currencyInfo: exports.currencyInfo,
  networkInfo,

  async getInnerPlugin() {
    return await Promise.resolve().then(() => _interopRequireWildcard(require('../EthereumTools')))
  }
}); exports.ethereumclassic = ethereumclassic
