import type { Chain } from '@chain-registry/types'
import { EdgeCurrencyInfo, EdgeTokenMap } from 'edge-core-js/types'

import { makeOuterPlugin } from '../../common/innerPlugin'
import { makeMetaTokens } from '../../common/tokenHelpers'
import type { CosmosTools } from '../CosmosTools'
import type { CosmosNetworkInfo } from '../cosmosTypes'
import data from '../info/chain-json/osmosis.json'

const builtinTokens: EdgeTokenMap = {
  uion: {
    currencyCode: 'ION',
    displayName: 'Ion',
    denominations: [{ name: 'ION', multiplier: '1000000' }],
    networkLocation: {
      contractAddress: 'uion'
    }
  }
}

const networkInfo: CosmosNetworkInfo = {
  bech32AddressPrefix: 'osmo',
  bip39Path: `m/44'/118'/0'/0/0`,
  chainInfo: {
    data: data as Chain,
    name: 'osmosis',
    url: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/osmosis/chain.json'
  },
  nativeDenom: 'uosmo',
  pluginMnemonicKeyName: 'osmosisMnemonic',
  rpcNode: {
    url: 'https://osmosis-rpc.publicnode.com:443',
    headers: {}
  },
  archiveNode: {
    url: 'https://osmosisarchive-rpc.quickapi.com:443',
    headers: {}
  }
}

const currencyInfo: EdgeCurrencyInfo = {
  currencyCode: 'OSMO',
  displayName: 'Osmosis',
  pluginId: 'osmosis',
  walletType: 'wallet:osmosis',

  // Explorers:
  addressExplorer: 'https://www.mintscan.io/osmosis/address/%s',
  transactionExplorer: 'https://www.mintscan.io/osmosis/tx/%s',

  denominations: [
    {
      name: 'OSMO',
      multiplier: '1000000',
      symbol: ''
    }
  ],

  memoOptions: [{ type: 'text', maxLength: 250 }],

  // Deprecated:
  defaultSettings: {},
  memoMaxLength: 250,
  memoType: 'text',
  metaTokens: makeMetaTokens(builtinTokens)
}

export const osmosis = makeOuterPlugin<CosmosNetworkInfo, CosmosTools>({
  currencyInfo,
  networkInfo,
  builtinTokens,

  checkEnvironment() {
    if (global.BigInt == null) {
      throw new Error('Osmosis requires BigInt support')
    }
  },

  async getInnerPlugin() {
    return await import(
      /* webpackChunkName: "osmosis" */
      '../CosmosTools'
    )
  }
})
