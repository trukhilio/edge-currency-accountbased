"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }

var _innerPlugin = require('../../common/innerPlugin');
var _tokenHelpers = require('../../common/tokenHelpers');


var _ethereumCommonInfo = require('./ethereumCommonInfo');

const builtinTokens = {
  e9e7cea3dedca5984780bafc599bd69add087d56: {
    currencyCode: 'BUSD',
    displayName: 'Binance USD',
    denominations: [{ name: 'BUSD', multiplier: '1000000000000000000' }],
    networkLocation: {
      contractAddress: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56'
    }
  },
  '8ac76a51cc950d9822d68b83fe1ad97b32cd580d': {
    currencyCode: 'USDC',
    displayName: 'USD Coin',
    denominations: [{ name: 'USDC', multiplier: '1000000000000000000' }],
    networkLocation: {
      contractAddress: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d'
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
  }
}

const networkInfo = {
  networkAdapterConfigs: [
    {
      type: 'rpc',
      servers: [
        'https://rpc.ankr.com/bsc',
        'https://bsc-dataseed.binance.org',
        'https://bsc-dataseed1.defibit.io',
        'https://bsc-dataseed1.ninicoin.io'
      ],
      ethBalCheckerContract: '0x2352c63A83f9Fd126af8676146721Fa00924d7e4'
    },
    { type: 'evmscan', servers: ['https://api.bscscan.com'] }
  ],
  uriNetworks: ['smartchain'],
  ercTokenStandard: 'ERC20',
  chainParams: {
    chainId: 56,
    name: 'Binance Smart Chain'
  },
  hdPathCoinType: 60,
  checkUnconfirmedTransactions: false,
  iosAllowedTokens: {},
  alethioCurrencies: null, // object or null
  amberDataBlockchainId: '', // ETH mainnet
  pluginMnemonicKeyName: 'binancesmartchainMnemonic',
  pluginRegularKeyName: 'binancesmartchainKey',
  ethGasStationUrl: null,
  defaultNetworkFees
}

const defaultSettings = {
  customFeeSettings: ['gasLimit', 'gasPrice'],
  otherSettings: { ...networkInfo }
}

 const currencyInfo = {
  canReplaceByFee: true,
  currencyCode: 'BNB',
  displayName: 'BNB Smart Chain',
  memoOptions: _ethereumCommonInfo.evmMemoOptions,
  pluginId: 'binancesmartchain',
  walletType: 'wallet:binancesmartchain',

  // Explorers:
  addressExplorer: 'https://bscscan.com/address/%s',
  transactionExplorer: 'https://bscscan.com/tx/%s',

  denominations: [
    {
      name: 'BNB',
      multiplier: '1000000000000000000',
      symbol: 'BNB'
    }
  ],

  // Deprecated:
  defaultSettings,
  memoType: 'hex',
  metaTokens: _tokenHelpers.makeMetaTokens.call(void 0, builtinTokens)
}; exports.currencyInfo = currencyInfo

 const binancesmartchain = _innerPlugin.makeOuterPlugin


({
  builtinTokens,
  currencyInfo: exports.currencyInfo,
  networkInfo,

  async getInnerPlugin() {
    return await Promise.resolve().then(() => _interopRequireWildcard(require('../EthereumTools')))
  }
}); exports.binancesmartchain = binancesmartchain
