"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }

var _innerPlugin = require('../../common/innerPlugin');
var _tokenHelpers = require('../../common/tokenHelpers');


var _ethereumCommonInfo = require('./ethereumCommonInfo');

const builtinTokens = {
  '3355df6d4c9c3035724fd0e3914de96a5a83aaf4': {
    currencyCode: 'USDC',
    displayName: 'USD Coin',
    denominations: [{ name: 'USDC', multiplier: '1000000' }],
    networkLocation: {
      contractAddress: '0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4'
    }
  }
}

// Fees are in Wei
const defaultNetworkFees = {
  default: {
    baseFeeMultiplier: {
      lowFee: '1',
      standardFeeLow: '1.25',
      standardFeeHigh: '1.5',
      highFee: '1.75'
    },
    gasLimit: undefined, // Limits must always be estimated by eth_estimateGas
    gasPrice: {
      lowFee: '1000000001',
      standardFeeLow: '40000000001',
      standardFeeHigh: '300000000001',
      standardFeeLowAmount: '100000000000000000',
      standardFeeHighAmount: '10000000000000000000',
      highFee: '40000000001',
      minGasPrice: '10000000'
    },
    minPriorityFee: '2000000000'
  }
}

const networkInfo = {
  networkAdapterConfigs: [
    {
      type: 'rpc',
      servers: ['https://mainnet.era.zksync.io']
    }
  ],
  uriNetworks: ['zksync'],
  ercTokenStandard: 'ERC20',
  chainParams: {
    chainId: 324,
    name: 'zkSync'
  },
  hdPathCoinType: 60,
  checkUnconfirmedTransactions: false,
  iosAllowedTokens: {},
  alethioCurrencies: null, // object or null
  amberDataBlockchainId: '',
  pluginMnemonicKeyName: 'zksyncMnemonic',
  pluginRegularKeyName: 'zksyncKey',
  ethGasStationUrl: null,
  defaultNetworkFees
}

const defaultSettings = {
  customFeeSettings: ['gasLimit', 'gasPrice'],
  otherSettings: {
    chainParams: networkInfo.chainParams,
    ercTokenStandard: networkInfo.ercTokenStandard
  }
}

 const currencyInfo = {
  canReplaceByFee: true,
  currencyCode: 'ETH',
  displayName: 'zkSync',
  memoOptions: _ethereumCommonInfo.evmMemoOptions,
  pluginId: 'zksync',
  walletType: 'wallet:zksync',

  // Explorers:
  addressExplorer: 'https://explorer.zksync.io/address/%s',
  transactionExplorer: 'https://explorer.zksync.io/tx/%s',

  denominations: [
    {
      name: 'ETH',
      multiplier: '1000000000000000000',
      symbol: 'Ξ'
    }
  ],

  // Deprecated:
  defaultSettings,
  memoType: 'hex',
  metaTokens: _tokenHelpers.makeMetaTokens.call(void 0, builtinTokens)
}; exports.currencyInfo = currencyInfo

 const zksync = _innerPlugin.makeOuterPlugin({
  builtinTokens,
  currencyInfo: exports.currencyInfo,
  networkInfo,

  async getInnerPlugin() {
    return await Promise.resolve().then(() => _interopRequireWildcard(require('../EthereumTools')))
  }
}); exports.zksync = zksync
