import { EdgeCurrencyInfo, EdgeTokenMap } from 'edge-core-js/types'

import { makeOuterPlugin } from '../common/innerPlugin'
import { makeMetaTokens } from '../common/tokenHelpers'
import type { SolanaTools } from './SolanaTools'
import type { SolanaNetworkInfo } from './solanaTypes'

const builtinTokens: EdgeTokenMap = {
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: {
    currencyCode: 'USDC',
    displayName: 'USD Coin',
    denominations: [{ name: 'USDC', multiplier: '1000000' }],
    networkLocation: {
      contractAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
    }
  }
}

const networkInfo: SolanaNetworkInfo = {
  rpcNodes: [
    // 'https://solana-api.projectserum.com', // Doesn't have full history
    'https://ssc-dao.genesysgo.net',
    'https://api.mainnet-beta.solana.com'
  ],
  commitment: 'confirmed', // confirmed is faster, finalized is safer. Even faster processed is unsupported for tx querys
  txQueryLimit: 1000, // RPC default is 1000
  derivationPath: "m/44'/501'/0'/0'",
  memoPublicKey: 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
  tokenPublicKey: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  associatedTokenPublicKey: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'
}

export const currencyInfo: EdgeCurrencyInfo = {
  currencyCode: 'SOL',
  displayName: 'Solana',
  pluginId: 'solana',
  walletType: 'wallet:solana',

  // Explorers:
  addressExplorer: 'https://explorer.solana.com/address/%s',
  transactionExplorer: 'https://explorer.solana.com/tx/%s',

  denominations: [
    {
      name: 'SOL',
      multiplier: '1000000000',
      symbol: '◎'
    }
  ],

  // https://spl.solana.com/memo
  memoOptions: [{ type: 'text', memoName: 'memo', maxLength: 32 }],

  // Deprecated:
  defaultSettings: {},
  memoType: 'text',
  metaTokens: makeMetaTokens(builtinTokens)
}

export const solana = makeOuterPlugin<SolanaNetworkInfo, SolanaTools>({
  currencyInfo,
  networkInfo,
  builtinTokens,

  checkEnvironment: () => {
    if (global.BigInt == null) {
      throw new Error('Solana requires bigint support')
    }
  },

  async getInnerPlugin() {
    return await import(
      /* webpackChunkName: "solana" */
      './SolanaTools'
    )
  }
})
