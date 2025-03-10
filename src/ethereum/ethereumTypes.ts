import {
  asArray,
  asBoolean,
  asCodec,
  asEither,
  asMaybe,
  asNull,
  asNumber,
  asObject,
  asOptional,
  asString,
  asUnknown,
  asValue,
  Cleaner
} from 'cleaners'
import { EdgeSpendInfo } from 'edge-core-js/types'

import { asSafeCommonWalletInfo, WalletConnectPayload } from '../common/types'
import { NetworkAdapterConfig } from './networkAdapters/types'

export interface EthereumInitOptions {
  blockcypherApiKey?: string
  evmScanApiKey?: string | string[]
  infuraProjectId?: string
  blockchairApiKey?: string
  alethioApiKey?: string
  amberdataApiKey?: string
  gasStationApiKey?: string
  quiknodeApiKey?: string
  alchemyApiKey?: string
  poktPortalApiKey?: string
}

export const asEthereumInitOptions = asObject<EthereumInitOptions>({
  evmScanApiKey: asOptional(asEither(asString, asArray(asString))),
  blockcypherApiKey: asOptional(asString),
  infuraProjectId: asOptional(asString),
  blockchairApiKey: asOptional(asString),
  alethioApiKey: asOptional(asString),
  amberdataApiKey: asOptional(asString),
  gasStationApiKey: asOptional(asString),
  quiknodeApiKey: asOptional(asString),
  alchemyApiKey: asOptional(asString),
  poktPortalApiKey: asOptional(asString)
})

function isKeyOfEthereumInitOptions(
  key: string
): key is keyof EthereumInitOptions {
  return key in asEthereumInitOptions.shape
}

export const asEthereumInitKeys = (raw: any): keyof EthereumInitOptions => {
  if (typeof raw !== 'string') {
    throw new Error('key must be a string')
  }

  if (isKeyOfEthereumInitOptions(raw)) {
    return raw
  }
  throw new Error(`${raw} not a key of EthereumInitOptions`)
}

export interface ChainParams {
  chainId: number
  name: string
}

export interface EthereumNetworkInfo {
  networkAdapterConfigs: NetworkAdapterConfig[]
  feeUpdateFrequencyMs?: number
  alethioCurrencies: {
    native: string
    token: string
  } | null
  amberDataBlockchainId: string
  chainParams: ChainParams
  supportsEIP1559?: boolean
  l1RollupParams?: L1RollupParams
  checkUnconfirmedTransactions: boolean
  // eslint-disable-next-line no-use-before-define
  defaultNetworkFees: EthereumFees
  ercTokenStandard: string
  ethGasStationUrl: string | null
  hdPathCoinType: number
  iosAllowedTokens: {
    [currencyCode: string]: true
  }
  pluginMnemonicKeyName: string
  pluginRegularKeyName: string
  uriNetworks: string[]
}

/**
 * Other Methods from EthereumTools
 */
export const ethOtherMethodNames = ['resolveEnsName'] as const

export const asEthereumFeesGasLimit = asObject({
  minGasLimit: asOptional(asString),
  regularTransaction: asString,
  tokenTransaction: asString
})

export type EthereumFeesGasLimit = ReturnType<typeof asEthereumFeesGasLimit>

export const asEthereumFeesGasPrice = asObject({
  highFee: asString,
  lowFee: asString,
  minGasPrice: asOptional(asString),

  // Represents the default "Optimized" standard fee option where
  // standardFeeLow is the fee for a transaction with a small
  // quantity and standardFeeHigh is the fee for a large transaction.
  standardFeeLow: asString,
  standardFeeHigh: asString,

  // Defines what is considered a "small" and "large" transaction
  // for the above two fee options.
  standardFeeLowAmount: asString,
  standardFeeHighAmount: asString
})

export type EthereumFeesGasPrice = ReturnType<typeof asEthereumFeesGasPrice>

export const asEthereumBaseFeeMultiplier = asObject({
  lowFee: asString,
  standardFeeLow: asString,
  standardFeeHigh: asString,
  highFee: asString
})

export type EthereumBaseMultiplier = ReturnType<
  typeof asEthereumBaseFeeMultiplier
>

export type KeysOfEthereumBaseMultiplier = keyof EthereumBaseMultiplier

export const asEthereumFee = asObject({
  baseFeeMultiplier: asOptional(asEthereumBaseFeeMultiplier),
  gasLimit: asOptional(asEthereumFeesGasLimit),
  gasPrice: asOptional(asEthereumFeesGasPrice),
  minPriorityFee: asOptional(asString)
})

export type EthereumFee = ReturnType<typeof asEthereumFee>

export const asEthereumFees = asObject<EthereumFee>(asEthereumFee)

export type EthereumFees = ReturnType<typeof asEthereumFees>

export type EthereumEstimateGasParams = [
  {
    to: string
    from: string
    gas: string
    value: string | undefined
    data: string | undefined
  },
  string
]

export interface EthereumMiningFees {
  gasPrice: string
  gasLimit: string
  useEstimatedGasLimit: boolean
}

export interface L1RollupParams {
  gasPriceL1Wei: string
  gasPricel1BaseFeeMethod: string
  maxGasPriceL1Multiplier: string
  fixedOverhead: string
  dynamicOverhead: string
  oracleContractAddress: string
  dynamicOverheadMethod: string
}

export interface CalcL1RollupFeeParams {
  nonce?: string
  gasLimit: string
  to: string
  value?: string
  data?: string | null | undefined
  chainParams: ChainParams
  dynamicOverhead: string
  fixedOverhead: string
  gasPriceL1Wei: string
}

export interface LastEstimatedGasLimit {
  publicAddress: string
  contractAddress: string | undefined
  gasLimit: string
}

export const asEvmScancanTokenTransaction = asObject({
  blockNumber: asString,
  timeStamp: asString,
  hash: asOptional(asString),
  transactionHash: asOptional(asString),
  to: asString,
  from: asString,
  value: asString,
  nonce: asString,
  gasPrice: asString,
  gas: asString,
  gasUsed: asString,
  confirmations: asString,
  contractAddress: asString,
  tokenName: asString,
  tokenSymbol: asString,
  tokenDecimal: asString
})

export type EvmScanTokenTransaction = ReturnType<
  typeof asEvmScancanTokenTransaction
>

export const asEvmScanTransaction = asObject({
  hash: asOptional(asString),
  transactionHash: asOptional(asString),
  blockNumber: asString,
  timeStamp: asString,
  gasPrice: asString,
  gasUsed: asString,
  value: asString,
  nonce: asString,
  from: asString,
  to: asString,
  gas: asString,
  isError: asString,
  confirmations: asOptional(asString)
})

export type EvmScanTransaction = ReturnType<typeof asEvmScanTransaction>

export const asEvmScanInternalTransaction = asObject({
  hash: asOptional(asString),
  transactionHash: asOptional(asString),
  blockNumber: asString,
  timeStamp: asString,
  gasUsed: asString,
  value: asString,
  from: asString,
  to: asString,
  gas: asString,
  isError: asString,
  contractAddress: asOptional(asString)
})

export type EvmScanInternalTransaction = ReturnType<
  typeof asEvmScanInternalTransaction
>

export const asEvmScanGasResponseResult = asObject({
  LastBlock: asString,
  SafeGasPrice: asString,
  ProposeGasPrice: asString,
  FastGasPrice: asString,

  // Etherscan
  suggestBaseFee: asMaybe(asString),
  gasUsedRatio: asMaybe(asArray(asString))
})

export const asEvmScanGasResponse = asObject({
  status: asString,
  message: asString,
  result: asEither(asString, asObject(asEvmScanGasResponseResult))
})

export type EvmScanGasResponse = ReturnType<typeof asEvmScanGasResponse>

export interface EthereumTxParameterInformation {
  contractAddress?: string
  data?: string
  value?: string
}

export interface EthereumTxOtherParams {
  from: string[]
  to: string[]
  gas: string
  gasPrice: string
  gasUsed: string
  tokenRecipientAddress?: string
  nonceUsed?: string
  replacedTxid?: string
  data?: string | null
  isFromMakeSpend: boolean
}
export const asEthereumTxOtherParams = asObject<EthereumTxOtherParams>({
  from: asArray(asString),
  to: asArray(asString),
  gas: asString,
  gasPrice: asString,
  gasUsed: asString,
  tokenRecipientAddress: asOptional(asString),
  nonceUsed: asOptional(asString),
  replacedTxid: asOptional(asString),
  data: asOptional(asEither(asString, asNull)),
  isFromMakeSpend: asOptional(asBoolean, false)
})

export const asEthereumWalletOtherData = asObject({
  nextNonce: asMaybe(asString, '0'),
  unconfirmedNextNonce: asMaybe(asString, '0')
})

export type EthereumWalletOtherData = ReturnType<
  typeof asEthereumWalletOtherData
>

export interface AlethioTokenTransferAttributes {
  blockCreationTime: number
  symbol: string
  fee: string | undefined
  value: string
  globalRank: number[]
}

export interface AlethioTransactionDataObj {
  data: { id: string }
  links: { related: string }
}

export interface AlethioTransactionRelationships {
  from: AlethioTransactionDataObj
  to: AlethioTransactionDataObj
  transaction: AlethioTransactionDataObj
  token: AlethioTransactionDataObj
}

export interface AlethioTokenTransfer {
  type: string
  attributes: AlethioTokenTransferAttributes
  relationships: AlethioTransactionRelationships
}

export const asBlockbookBlockHeight = asObject({
  blockbook: asObject({
    bestHeight: asNumber
  })
})

export type BlockbookBlockHeight = ReturnType<typeof asBlockbookBlockHeight>

export const asBlockbookTokenBalance = asObject({
  symbol: asString,
  contract: asString,
  balance: asString
})

export type BlockbookTokenBalance = ReturnType<typeof asBlockbookTokenBalance>

export const asBlockbookAddress = asObject({
  balance: asString,
  unconfirmedBalance: asString,
  unconfirmedTxs: asNumber,
  nonce: asString,
  tokens: asMaybe(asArray(asBlockbookTokenBalance), () => [])
})

export type BlockbookAddress = ReturnType<typeof asBlockbookAddress>

export const asBlockChairAddress = asObject({
  balance: asString,
  token_address: asString,
  token_symbol: asString
})

export type BlockChairAddress = ReturnType<typeof asBlockChairAddress>

export const asCheckTokenBalBlockchair = asObject({
  data: asObject(
    asObject({
      address: asObject({
        balance: asString
      }),
      layer_2: asObject({
        erc_20: asArray(asOptional(asString))
      })
    })
  )
})

export type CheckTokenBalBlockchair = ReturnType<
  typeof asCheckTokenBalBlockchair
>

export const asCheckBlockHeightBlockchair = asObject({
  data: asObject({
    blocks: asNumber
  })
})

export const asAmberdataAccountsTx = asObject({
  hash: asString,
  timestamp: asString,
  blockNumber: asString,
  value: asString,
  fee: asString,
  gasLimit: asString,
  gasPrice: asString,
  gasUsed: asString,
  from: asArray(
    asObject({
      address: asString
    })
  ),
  to: asArray(
    asObject({
      address: asString
    })
  )
})

export const asRpcResultString = asObject({
  result: asString
})

export type RpcResultString = ReturnType<typeof asRpcResultString>

export const asGetTransactionReceipt = asObject({
  l1Fee: asString
})

export interface TxRpcParams {
  from?: string
  to: string
  data: string
  gas: string
  gasPrice: string
  value?: string
  nonce?: string
}

interface EIP712TypeData {
  name: string
  type: string
}

export interface EIP712TypedDataParam {
  types: {
    EIP712Domain: [EIP712TypeData]
    [type: string]: [EIP712TypeData]
  }
  primaryType: string
  domain: Object
  message: Object
}

export interface EthereumUtils {
  signMessage: (message: string, privateKeys: EthereumPrivateKeys) => string
  signTypedData: (
    typedData: EIP712TypedDataParam,
    privateKeys: EthereumPrivateKeys
  ) => string
  txRpcParamsToSpendInfo: (params: TxRpcParams) => EdgeSpendInfo
}

export const asEvmWcRpcPayload = asObject({
  id: asEither(asString, asNumber),
  method: asValue(
    'personal_sign',
    'eth_sign',
    'eth_signTypedData',
    'eth_signTypedData_v4',
    'eth_sendTransaction',
    'eth_signTransaction',
    'eth_sendRawTransaction'
  ),
  params: asArray(asUnknown)
})

export type EvmWcRpcPayload = ReturnType<typeof asEvmWcRpcPayload>

//
// Other Params and Other Methods:
//

export interface EthereumOtherMethods {
  parseWalletConnectV2Payload: (
    payload: EvmWcRpcPayload
  ) => Promise<WalletConnectPayload>
  txRpcParamsToSpendInfo: (params: TxRpcParams) => Promise<EdgeSpendInfo>
}

export const asEthereumSignMessageParams = asOptional(
  asObject({
    typedData: asOptional(asBoolean, false)
  }),
  { typedData: false }
)

//
// Wallet Info and Keys:
//

export type SafeEthWalletInfo = ReturnType<typeof asSafeEthWalletInfo>
export const asSafeEthWalletInfo = asSafeCommonWalletInfo

export interface EthereumPrivateKeys {
  mnemonic?: string
  privateKey: string
}
export const asEthereumPrivateKeys = (
  pluginId: string
): Cleaner<EthereumPrivateKeys> => {
  // Type hacks:
  type PluginId = 'x'
  type FromKeys = {
    [key in `${PluginId}Key`]: string
  } &
    {
      [key in `${PluginId}Mnemonic`]?: string
    }
  const _pluginId = pluginId as PluginId
  // Derived cleaners from the generic parameter:
  const asFromKeys: Cleaner<FromKeys> = asObject({
    [`${_pluginId}Mnemonic`]: asOptional(asString),
    [`${_pluginId}Key`]: asString
  }) as Cleaner<any>
  const asFromJackedKeys = asObject({ keys: asFromKeys })

  return asCodec(
    (value: unknown) => {
      // Handle potentially jacked-up keys:
      const fromJacked = asMaybe(asFromJackedKeys)(value)
      if (fromJacked != null) {
        const to: EthereumPrivateKeys = {
          mnemonic: fromJacked.keys[`${_pluginId}Mnemonic`],
          privateKey: fromJacked.keys[`${_pluginId}Key`]
        }
        return to
      }

      // Handle normal keys:
      const from = asFromKeys(value)
      const to: EthereumPrivateKeys = {
        mnemonic: from[`${_pluginId}Mnemonic`],
        privateKey: from[`${_pluginId}Key`]
      }
      return to
    },
    ethPrivateKey => {
      return {
        [`${_pluginId}Mnemonic`]: ethPrivateKey.mnemonic,
        [`${_pluginId}Key`]: ethPrivateKey.privateKey
      }
    }
  )
}
