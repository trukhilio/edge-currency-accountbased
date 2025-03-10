import * as hedera from '@hashgraph/sdk'
import { div } from 'biggystring'
import { entropyToMnemonic, validateMnemonic } from 'bip39'
import {
  EdgeCurrencyInfo,
  EdgeCurrencyTools,
  EdgeEncodeUri,
  EdgeFetchFunction,
  EdgeIo,
  EdgeLog,
  EdgeMetaToken,
  EdgeParsedUri,
  EdgeTokenMap,
  EdgeWalletInfo
} from 'edge-core-js/types'

import { PluginEnvironment } from '../common/innerPlugin'
import { encodeUriCommon, parseUriCommon } from '../common/uriHelpers'
import { getFetchCors, getLegacyDenomination } from '../common/utils'
import {
  asGetActivationCost,
  asHederaPrivateKeys,
  asSafeHederaWalletInfo,
  HederaNetworkInfo
} from './hederaTypes'
import { createChecksum, validAddress } from './hederaUtils'

// if users want to import their mnemonic phrase in e.g. MyHbarWallet.com
// they can just leave the passphrase field blank
const mnemonicPassphrase = ''
const Ed25519PrivateKeyPrefix = '302e020100300506032b657004220420'

export class HederaTools implements EdgeCurrencyTools {
  builtinTokens: EdgeTokenMap
  currencyInfo: EdgeCurrencyInfo
  fetchCors: EdgeFetchFunction
  io: EdgeIo
  log: EdgeLog
  networkInfo: HederaNetworkInfo

  constructor(env: PluginEnvironment<HederaNetworkInfo>) {
    const { builtinTokens, currencyInfo, io, log, networkInfo } = env
    this.builtinTokens = builtinTokens
    this.currencyInfo = currencyInfo
    this.fetchCors = getFetchCors(io)
    this.io = io
    this.log = log
    this.networkInfo = networkInfo
  }

  async getDisplayPrivateKey(
    privateWalletInfo: EdgeWalletInfo
  ): Promise<string> {
    const { pluginId } = this.currencyInfo
    const keys = asHederaPrivateKeys(pluginId)(privateWalletInfo.keys)
    return keys.mnemonic ?? keys.privateKey
  }

  async getDisplayPublicKey(publicWalletInfo: EdgeWalletInfo): Promise<string> {
    const { keys } = asSafeHederaWalletInfo(publicWalletInfo)
    return keys.publicKey
  }

  async createPrivateKey(walletType: string): Promise<Object> {
    if (walletType !== this.currencyInfo.walletType) {
      throw new Error('InvalidWalletType')
    }

    const entropy = this.io.random(32)
    // @ts-expect-error
    const mnemonic = entropyToMnemonic(entropy)
    return await this.importPrivateKey(mnemonic)
  }

  async importPrivateKey(userInput: string): Promise<Object> {
    const { pluginId } = this.currencyInfo
    try {
      let privateMnemonic
      let privateKey
      if (
        /^(0x)?[0-9a-fA-F]{64}$/.test(
          userInput.replace(Ed25519PrivateKeyPrefix, '')
        )
      ) {
        const privateKeyString = userInput
          .replace(/^0x/, '')
          .replace(Ed25519PrivateKeyPrefix, '')

        privateKey =
          hedera.Ed25519PrivateKey.fromString(privateKeyString).toString()
      } else if (validateMnemonic(userInput)) {
        const mnemonic = hedera.Mnemonic.fromString(userInput)
        const sdkPrivateKey = await mnemonic.toPrivateKey(mnemonicPassphrase)
        privateMnemonic = userInput
        privateKey = sdkPrivateKey.toString()
      } else {
        throw new Error('InvalidPrivateKey')
      }

      return {
        [`${pluginId}Mnemonic`]: privateMnemonic,
        [`${pluginId}Key`]: privateKey
      }
    } catch (e: any) {
      throw new Error('InvalidPrivateKey')
    }
  }

  async derivePublicKey(walletInfo: EdgeWalletInfo): Promise<Object> {
    const { pluginId } = this.currencyInfo
    if (walletInfo.type !== this.currencyInfo.walletType) {
      throw new Error('InvalidWalletType')
    }

    if (
      walletInfo.keys == null ||
      walletInfo.keys?.[`${pluginId}Key`] == null
    ) {
      throw new Error('Invalid private key')
    }

    const privateKey = hedera.Ed25519PrivateKey.fromString(
      walletInfo.keys[`${pluginId}Key`]
    )

    return {
      publicKey: privateKey.publicKey.toString()
    }
  }

  async parseUri(uri: string): Promise<EdgeParsedUri> {
    const { pluginId } = this.currencyInfo
    const {
      edgeParsedUri,
      edgeParsedUri: { publicAddress }
    } = parseUriCommon(
      this.currencyInfo,
      uri,
      { [`${pluginId}`]: true },
      this.currencyInfo.currencyCode
    )

    if (publicAddress != null) {
      const { checksumNetworkID } = this.networkInfo
      const [address, checksum] = publicAddress.split('-')
      if (
        !validAddress(publicAddress) ||
        (checksum != null &&
          checksum !== createChecksum(address, checksumNetworkID))
      )
        throw new Error('InvalidPublicAddressError')
    }

    return edgeParsedUri
  }

  async encodeUri(
    obj: EdgeEncodeUri,
    customTokens: EdgeMetaToken[] = []
  ): Promise<string> {
    const { pluginId } = this.currencyInfo
    const { publicAddress, nativeAmount } = obj
    if (!validAddress(publicAddress)) {
      throw new Error('InvalidPublicAddressError')
    }

    if (nativeAmount == null || typeof nativeAmount !== 'string') {
      // don't encode as a URI, just return the public address
      return publicAddress
    }

    const denom = getLegacyDenomination(
      this.currencyInfo.currencyCode,
      this.currencyInfo,
      customTokens
    )
    if (denom == null) {
      throw new Error('InternalErrorInvalidCurrencyCode')
    }
    const amount = div(nativeAmount, denom.multiplier, 8)

    return encodeUriCommon(obj, pluginId, amount)
  }

  //
  // otherMethods
  //

  async getActivationSupportedCurrencies(): Promise<{
    result: { [code: string]: boolean }
  }> {
    return { result: { ETH: true } }
  }

  async getActivationCost(): Promise<string | number> {
    const creatorApiServer = this.networkInfo.creatorApiServers[0]

    try {
      const response = await this.fetchCors(`${creatorApiServer}/account/cost`)
      return asGetActivationCost(await response.json()).hbar
    } catch (e: any) {
      this.log.warn(
        'getActivationCost error unable to get account activation cost',
        e
      )
      throw new Error('ErrorUnableToGetCost')
    }
  }

  async validateAccount(): Promise<{ result: '' | 'AccountAvailable' }> {
    return { result: 'AccountAvailable' }
  }
}

export async function makeCurrencyTools(
  env: PluginEnvironment<HederaNetworkInfo>
): Promise<HederaTools> {
  return new HederaTools(env)
}

export { makeCurrencyEngine } from './HederaEngine'
