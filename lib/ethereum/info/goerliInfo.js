"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }

var _innerPlugin = require('../../common/innerPlugin');
var _tokenHelpers = require('../../common/tokenHelpers');


var _ethereumCommonInfo = require('./ethereumCommonInfo');

const builtinTokens = {}

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
      servers: [
        'https://eth-goerli.alchemyapi.io/v2/-{{alchemyApiKey}}',
        'https://goerli.infura.io/v3/{{infuraProjectId}}'
      ]
    },
    {
      type: 'evmscan',
      servers: ['https://api-goerli.etherscan.io']
    }
  ],

  uriNetworks: ['ethereum', 'ether'],
  ercTokenStandard: 'ERC20',
  chainParams: {
    chainId: 5,
    name: 'Goerli'
  },
  supportsEIP1559: true,
  hdPathCoinType: 60,
  checkUnconfirmedTransactions: true,
  iosAllowedTokens: {
    REP: true,
    WINGS: true,
    HUR: true,
    IND: true,
    USDT: true
  },
  alethioCurrencies: {
    // object or null
    native: 'ether',
    token: 'token'
  },
  amberDataBlockchainId: '',
  pluginMnemonicKeyName: 'goerliMnemonic',
  pluginRegularKeyName: 'goerliKey',
  ethGasStationUrl: 'https://www.ethgasstation.info/json/ethgasAPI.json',
  defaultNetworkFees
}

const defaultSettings = {
  customFeeSettings: ['gasLimit', 'gasPrice'],
  otherSettings: { ...networkInfo }
}

 const currencyInfo = {
  canReplaceByFee: true,
  currencyCode: 'GOR',
  displayName: 'Goerli Testnet',
  memoOptions: _ethereumCommonInfo.evmMemoOptions,
  pluginId: 'goerli',
  walletType: 'wallet:goerli',

  // Explorers:
  addressExplorer: 'https://etherscan.io/address/%s',
  transactionExplorer: 'https://etherscan.io/tx/%s',

  denominations: [
    {
      name: 'GOR',
      multiplier: '1000000000000000000',
      symbol: 'G'
    },
    {
      name: 'mGOR',
      multiplier: '1000000000000000',
      symbol: 'mG'
    }
  ],

  // Deprecated:
  defaultSettings,
  memoType: 'hex',
  metaTokens: _tokenHelpers.makeMetaTokens.call(void 0, builtinTokens)
}; exports.currencyInfo = currencyInfo

 const goerli = _innerPlugin.makeOuterPlugin({
  builtinTokens,
  currencyInfo: exports.currencyInfo,
  networkInfo,

  async getInnerPlugin() {
    return await Promise.resolve().then(() => _interopRequireWildcard(require('../EthereumTools')))
  }
}); exports.goerli = goerli
