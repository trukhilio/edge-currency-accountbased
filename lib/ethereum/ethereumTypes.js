"use strict";Object.defineProperty(exports, "__esModule", {value: true});













var _cleaners = require('cleaners');


var _types3 = require('../common/types');















 const asEthereumInitOptions = _cleaners.asObject({
  evmScanApiKey: _cleaners.asOptional.call(void 0, _cleaners.asEither.call(void 0, _cleaners.asString, _cleaners.asArray.call(void 0, _cleaners.asString))),
  blockcypherApiKey: _cleaners.asOptional.call(void 0, _cleaners.asString),
  infuraProjectId: _cleaners.asOptional.call(void 0, _cleaners.asString),
  blockchairApiKey: _cleaners.asOptional.call(void 0, _cleaners.asString),
  alethioApiKey: _cleaners.asOptional.call(void 0, _cleaners.asString),
  amberdataApiKey: _cleaners.asOptional.call(void 0, _cleaners.asString),
  gasStationApiKey: _cleaners.asOptional.call(void 0, _cleaners.asString),
  quiknodeApiKey: _cleaners.asOptional.call(void 0, _cleaners.asString),
  alchemyApiKey: _cleaners.asOptional.call(void 0, _cleaners.asString),
  poktPortalApiKey: _cleaners.asOptional.call(void 0, _cleaners.asString)
}); exports.asEthereumInitOptions = asEthereumInitOptions

function isKeyOfEthereumInitOptions(
  key
) {
  return key in exports.asEthereumInitOptions.shape
}

 const asEthereumInitKeys = (raw) => {
  if (typeof raw !== 'string') {
    throw new Error('key must be a string')
  }

  if (isKeyOfEthereumInitOptions(raw)) {
    return raw
  }
  throw new Error(`${raw} not a key of EthereumInitOptions`)
}; exports.asEthereumInitKeys = asEthereumInitKeys































/**
 * Other Methods from EthereumTools
 */
 const ethOtherMethodNames = ['resolveEnsName'] ; exports.ethOtherMethodNames = ethOtherMethodNames

 const asEthereumFeesGasLimit = _cleaners.asObject.call(void 0, {
  minGasLimit: _cleaners.asOptional.call(void 0, _cleaners.asString),
  regularTransaction: _cleaners.asString,
  tokenTransaction: _cleaners.asString
}); exports.asEthereumFeesGasLimit = asEthereumFeesGasLimit



 const asEthereumFeesGasPrice = _cleaners.asObject.call(void 0, {
  highFee: _cleaners.asString,
  lowFee: _cleaners.asString,
  minGasPrice: _cleaners.asOptional.call(void 0, _cleaners.asString),

  // Represents the default "Optimized" standard fee option where
  // standardFeeLow is the fee for a transaction with a small
  // quantity and standardFeeHigh is the fee for a large transaction.
  standardFeeLow: _cleaners.asString,
  standardFeeHigh: _cleaners.asString,

  // Defines what is considered a "small" and "large" transaction
  // for the above two fee options.
  standardFeeLowAmount: _cleaners.asString,
  standardFeeHighAmount: _cleaners.asString
}); exports.asEthereumFeesGasPrice = asEthereumFeesGasPrice



 const asEthereumBaseFeeMultiplier = _cleaners.asObject.call(void 0, {
  lowFee: _cleaners.asString,
  standardFeeLow: _cleaners.asString,
  standardFeeHigh: _cleaners.asString,
  highFee: _cleaners.asString
}); exports.asEthereumBaseFeeMultiplier = asEthereumBaseFeeMultiplier







 const asEthereumFee = _cleaners.asObject.call(void 0, {
  baseFeeMultiplier: _cleaners.asOptional.call(void 0, exports.asEthereumBaseFeeMultiplier),
  gasLimit: _cleaners.asOptional.call(void 0, exports.asEthereumFeesGasLimit),
  gasPrice: _cleaners.asOptional.call(void 0, exports.asEthereumFeesGasPrice),
  minPriorityFee: _cleaners.asOptional.call(void 0, _cleaners.asString)
}); exports.asEthereumFee = asEthereumFee



 const asEthereumFees = _cleaners.asObject(exports.asEthereumFee); exports.asEthereumFees = asEthereumFees
















































 const asEvmScancanTokenTransaction = _cleaners.asObject.call(void 0, {
  blockNumber: _cleaners.asString,
  timeStamp: _cleaners.asString,
  hash: _cleaners.asOptional.call(void 0, _cleaners.asString),
  transactionHash: _cleaners.asOptional.call(void 0, _cleaners.asString),
  to: _cleaners.asString,
  from: _cleaners.asString,
  value: _cleaners.asString,
  nonce: _cleaners.asString,
  gasPrice: _cleaners.asString,
  gas: _cleaners.asString,
  gasUsed: _cleaners.asString,
  confirmations: _cleaners.asString,
  contractAddress: _cleaners.asString,
  tokenName: _cleaners.asString,
  tokenSymbol: _cleaners.asString,
  tokenDecimal: _cleaners.asString
}); exports.asEvmScancanTokenTransaction = asEvmScancanTokenTransaction





 const asEvmScanTransaction = _cleaners.asObject.call(void 0, {
  hash: _cleaners.asOptional.call(void 0, _cleaners.asString),
  transactionHash: _cleaners.asOptional.call(void 0, _cleaners.asString),
  blockNumber: _cleaners.asString,
  timeStamp: _cleaners.asString,
  gasPrice: _cleaners.asString,
  gasUsed: _cleaners.asString,
  value: _cleaners.asString,
  nonce: _cleaners.asString,
  from: _cleaners.asString,
  to: _cleaners.asString,
  gas: _cleaners.asString,
  isError: _cleaners.asString,
  confirmations: _cleaners.asOptional.call(void 0, _cleaners.asString)
}); exports.asEvmScanTransaction = asEvmScanTransaction



 const asEvmScanInternalTransaction = _cleaners.asObject.call(void 0, {
  hash: _cleaners.asOptional.call(void 0, _cleaners.asString),
  transactionHash: _cleaners.asOptional.call(void 0, _cleaners.asString),
  blockNumber: _cleaners.asString,
  timeStamp: _cleaners.asString,
  gasUsed: _cleaners.asString,
  value: _cleaners.asString,
  from: _cleaners.asString,
  to: _cleaners.asString,
  gas: _cleaners.asString,
  isError: _cleaners.asString,
  contractAddress: _cleaners.asOptional.call(void 0, _cleaners.asString)
}); exports.asEvmScanInternalTransaction = asEvmScanInternalTransaction





 const asEvmScanGasResponseResult = _cleaners.asObject.call(void 0, {
  LastBlock: _cleaners.asString,
  SafeGasPrice: _cleaners.asString,
  ProposeGasPrice: _cleaners.asString,
  FastGasPrice: _cleaners.asString,

  // Etherscan
  suggestBaseFee: _cleaners.asMaybe.call(void 0, _cleaners.asString),
  gasUsedRatio: _cleaners.asMaybe.call(void 0, _cleaners.asArray.call(void 0, _cleaners.asString))
}); exports.asEvmScanGasResponseResult = asEvmScanGasResponseResult

 const asEvmScanGasResponse = _cleaners.asObject.call(void 0, {
  status: _cleaners.asString,
  message: _cleaners.asString,
  result: _cleaners.asEither.call(void 0, _cleaners.asString, _cleaners.asObject.call(void 0, exports.asEvmScanGasResponseResult))
}); exports.asEvmScanGasResponse = asEvmScanGasResponse





















 const asEthereumTxOtherParams = _cleaners.asObject({
  from: _cleaners.asArray.call(void 0, _cleaners.asString),
  to: _cleaners.asArray.call(void 0, _cleaners.asString),
  gas: _cleaners.asString,
  gasPrice: _cleaners.asString,
  gasUsed: _cleaners.asString,
  tokenRecipientAddress: _cleaners.asOptional.call(void 0, _cleaners.asString),
  nonceUsed: _cleaners.asOptional.call(void 0, _cleaners.asString),
  replacedTxid: _cleaners.asOptional.call(void 0, _cleaners.asString),
  data: _cleaners.asOptional.call(void 0, _cleaners.asEither.call(void 0, _cleaners.asString, _cleaners.asNull)),
  isFromMakeSpend: _cleaners.asOptional.call(void 0, _cleaners.asBoolean, false)
}); exports.asEthereumTxOtherParams = asEthereumTxOtherParams

 const asEthereumWalletOtherData = _cleaners.asObject.call(void 0, {
  nextNonce: _cleaners.asMaybe.call(void 0, _cleaners.asString, '0'),
  unconfirmedNextNonce: _cleaners.asMaybe.call(void 0, _cleaners.asString, '0')
}); exports.asEthereumWalletOtherData = asEthereumWalletOtherData































 const asBlockbookBlockHeight = _cleaners.asObject.call(void 0, {
  blockbook: _cleaners.asObject.call(void 0, {
    bestHeight: _cleaners.asNumber
  })
}); exports.asBlockbookBlockHeight = asBlockbookBlockHeight



 const asBlockbookTokenBalance = _cleaners.asObject.call(void 0, {
  symbol: _cleaners.asString,
  contract: _cleaners.asString,
  balance: _cleaners.asString
}); exports.asBlockbookTokenBalance = asBlockbookTokenBalance



 const asBlockbookAddress = _cleaners.asObject.call(void 0, {
  balance: _cleaners.asString,
  unconfirmedBalance: _cleaners.asString,
  unconfirmedTxs: _cleaners.asNumber,
  nonce: _cleaners.asString,
  tokens: _cleaners.asMaybe.call(void 0, _cleaners.asArray.call(void 0, exports.asBlockbookTokenBalance), () => [])
}); exports.asBlockbookAddress = asBlockbookAddress



 const asBlockChairAddress = _cleaners.asObject.call(void 0, {
  balance: _cleaners.asString,
  token_address: _cleaners.asString,
  token_symbol: _cleaners.asString
}); exports.asBlockChairAddress = asBlockChairAddress



 const asCheckTokenBalBlockchair = _cleaners.asObject.call(void 0, {
  data: _cleaners.asObject.call(void 0, 
    _cleaners.asObject.call(void 0, {
      address: _cleaners.asObject.call(void 0, {
        balance: _cleaners.asString
      }),
      layer_2: _cleaners.asObject.call(void 0, {
        erc_20: _cleaners.asArray.call(void 0, _cleaners.asOptional.call(void 0, _cleaners.asString))
      })
    })
  )
}); exports.asCheckTokenBalBlockchair = asCheckTokenBalBlockchair





 const asCheckBlockHeightBlockchair = _cleaners.asObject.call(void 0, {
  data: _cleaners.asObject.call(void 0, {
    blocks: _cleaners.asNumber
  })
}); exports.asCheckBlockHeightBlockchair = asCheckBlockHeightBlockchair

 const asAmberdataAccountsTx = _cleaners.asObject.call(void 0, {
  hash: _cleaners.asString,
  timestamp: _cleaners.asString,
  blockNumber: _cleaners.asString,
  value: _cleaners.asString,
  fee: _cleaners.asString,
  gasLimit: _cleaners.asString,
  gasPrice: _cleaners.asString,
  gasUsed: _cleaners.asString,
  from: _cleaners.asArray.call(void 0, 
    _cleaners.asObject.call(void 0, {
      address: _cleaners.asString
    })
  ),
  to: _cleaners.asArray.call(void 0, 
    _cleaners.asObject.call(void 0, {
      address: _cleaners.asString
    })
  )
}); exports.asAmberdataAccountsTx = asAmberdataAccountsTx

 const asRpcResultString = _cleaners.asObject.call(void 0, {
  result: _cleaners.asString
}); exports.asRpcResultString = asRpcResultString



 const asGetTransactionReceipt = _cleaners.asObject.call(void 0, {
  l1Fee: _cleaners.asString
}); exports.asGetTransactionReceipt = asGetTransactionReceipt



































 const asEvmWcRpcPayload = _cleaners.asObject.call(void 0, {
  id: _cleaners.asEither.call(void 0, _cleaners.asString, _cleaners.asNumber),
  method: _cleaners.asValue.call(void 0, 
    'personal_sign',
    'eth_sign',
    'eth_signTypedData',
    'eth_signTypedData_v4',
    'eth_sendTransaction',
    'eth_signTransaction',
    'eth_sendRawTransaction'
  ),
  params: _cleaners.asArray.call(void 0, _cleaners.asUnknown)
}); exports.asEvmWcRpcPayload = asEvmWcRpcPayload














 const asEthereumSignMessageParams = _cleaners.asOptional.call(void 0, 
  _cleaners.asObject.call(void 0, {
    typedData: _cleaners.asOptional.call(void 0, _cleaners.asBoolean, false)
  }),
  { typedData: false }
); exports.asEthereumSignMessageParams = asEthereumSignMessageParams

//
// Wallet Info and Keys:
//


 const asSafeEthWalletInfo = _types3.asSafeCommonWalletInfo; exports.asSafeEthWalletInfo = asSafeEthWalletInfo





 const asEthereumPrivateKeys = (
  pluginId
) => {
  // Type hacks:
  






  const _pluginId = pluginId 
  // Derived cleaners from the generic parameter:
  const asFromKeys = _cleaners.asObject.call(void 0, {
    [`${_pluginId}Mnemonic`]: _cleaners.asOptional.call(void 0, _cleaners.asString),
    [`${_pluginId}Key`]: _cleaners.asString
  }) 
  const asFromJackedKeys = _cleaners.asObject.call(void 0, { keys: asFromKeys })

  return _cleaners.asCodec.call(void 0, 
    (value) => {
      // Handle potentially jacked-up keys:
      const fromJacked = _cleaners.asMaybe.call(void 0, asFromJackedKeys)(value)
      if (fromJacked != null) {
        const to = {
          mnemonic: fromJacked.keys[`${_pluginId}Mnemonic`],
          privateKey: fromJacked.keys[`${_pluginId}Key`]
        }
        return to
      }

      // Handle normal keys:
      const from = asFromKeys(value)
      const to = {
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
}; exports.asEthereumPrivateKeys = asEthereumPrivateKeys
