import { EdgeCurrencyInfo, EdgeTokenMap } from 'edge-core-js/types'

import { makeOuterPlugin } from '../../common/innerPlugin'
import { makeMetaTokens } from '../../common/tokenHelpers'
import type { EthereumTools } from '../EthereumTools'
import type { EthereumFees, EthereumNetworkInfo } from '../ethereumTypes'
import { evmMemoOptions } from './ethereumCommonInfo'

const builtinTokens: EdgeTokenMap = {
  '07865c6e87b9f70255377e024ace6630c1eaa37f': {
    currencyCode: 'USDC',
    displayName: 'USD Coin',
    denominations: [{ name: 'USDC', multiplier: '1000000' }],
    networkLocation: {
      contractAddress: '0x07865c6E87B9F70255377e024ace6630C1Eaa37F'
    }
  },
  '6ad196dbcd43996f17638b924d2fdedff6fdd677': {
    currencyCode: 'USDT',
    displayName: 'Tether USD',
    denominations: [{ name: 'USDT', multiplier: '1000000' }],

    networkLocation: {
      contractAddress: '0x6AD196dBcd43996F17638B924d2fdEDFF6Fdd677'
    }
  },
  c04b0d3107736c32e19f1c62b2af67be61d63a05: {
    currencyCode: 'WBTC',
    displayName: 'Wrapped Bitcoin',
    denominations: [{ name: 'WBTC', multiplier: '100000000' }],
    networkLocation: {
      contractAddress: '0xC04B0d3107736C32e19F1c62b2aF67BE61d63a05'
    }
  }
}

const defaultNetworkFees: EthereumFees = {
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

const networkInfo: EthereumNetworkInfo = {
  networkAdapterConfigs: [
    {
      type: 'rpc',
      servers: [
        'https://eth-goerli.gateway.pokt.network/v1/lb/{{poktPortalApiKey}}',
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

const defaultSettings: any = {
  customFeeSettings: ['gasLimit', 'gasPrice'],
  otherSettings: { ...networkInfo }
}

const currencyInfo: EdgeCurrencyInfo = {
  canReplaceByFee: true,
  currencyCode: 'GOR',
  displayName: 'Goerli Testnet',
  memoOptions: evmMemoOptions,
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
  metaTokens: makeMetaTokens(builtinTokens)
}

export const goerli = makeOuterPlugin<EthereumNetworkInfo, EthereumTools>({
  builtinTokens,
  currencyInfo,
  networkInfo,

  async getInnerPlugin() {
    return await import('../EthereumTools')
  }
})
