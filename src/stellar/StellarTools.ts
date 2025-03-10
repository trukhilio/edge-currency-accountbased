import { add, div } from 'biggystring'
import { mnemonicToSeed, validateMnemonic } from 'bip39'
import * as ed25519 from 'ed25519-hd-key'
import {
  EdgeCurrencyInfo,
  EdgeCurrencyTools,
  EdgeEncodeUri,
  EdgeIo,
  EdgeMetaToken,
  EdgeParsedUri,
  EdgeTokenMap,
  EdgeWalletInfo
} from 'edge-core-js/types'
import stellarApi, { Server as StellarServer } from 'stellar-sdk'
import { serialize } from 'uri-js'
import parse from 'url-parse'

import { PluginEnvironment } from '../common/innerPlugin'
import { parseUriCommon } from '../common/uriHelpers'
import { getLegacyDenomination } from '../common/utils'
import {
  asSafeStellarWalletInfo,
  asStellarPrivateKeys,
  StellarNetworkInfo,
  StellarPrivateKeys
} from './stellarTypes'

const URI_PREFIX = 'web+stellar'

export class StellarTools implements EdgeCurrencyTools {
  builtinTokens: EdgeTokenMap
  currencyInfo: EdgeCurrencyInfo
  io: EdgeIo
  networkInfo: StellarNetworkInfo

  highestTxHeight: number = 0
  stellarApiServers: StellarServer[]

  constructor(env: PluginEnvironment<StellarNetworkInfo>) {
    const { builtinTokens, currencyInfo, io, networkInfo } = env
    this.builtinTokens = builtinTokens
    this.currencyInfo = currencyInfo
    this.io = io
    this.networkInfo = networkInfo

    stellarApi.Network.usePublicNetwork()
    this.stellarApiServers = []
    for (const server of this.networkInfo.stellarServers) {
      const stellarServer = new stellarApi.Server(server)
      stellarServer.serverName = server
      this.stellarApiServers.push(stellarServer)
    }
  }

  async getDisplayPrivateKey(
    privateWalletInfo: EdgeWalletInfo
  ): Promise<string> {
    const keys = asStellarPrivateKeys(privateWalletInfo.keys)
    return keys.stellarKey
  }

  async getDisplayPublicKey(publicWalletInfo: EdgeWalletInfo): Promise<string> {
    const { keys } = asSafeStellarWalletInfo(publicWalletInfo)
    return keys.publicKey
  }

  checkAddress(address: string): boolean {
    // TODO: check address
    try {
      stellarApi.Keypair.fromPublicKey(address)
      return true
    } catch (e: any) {
      return false
    }
  }

  async createPrivateKey(walletType: string): Promise<Object> {
    if (walletType !== this.currencyInfo.walletType) {
      throw new Error('InvalidWalletType')
    }

    const entropy = Array.from(this.io.random(32))
    const keypair = stellarApi.Keypair.fromRawEd25519Seed(entropy)
    return { stellarKey: keypair.secret() }
  }

  async importPrivateKey(userInput: string): Promise<StellarPrivateKeys> {
    let stellarKey
    let stellarMnemonic

    if (validateMnemonic(userInput)) {
      const seed = await mnemonicToSeed(userInput)
      const derivedSeed = ed25519.derivePath(
        "m/44'/148'/0'",
        seed.toString('hex')
      ).key
      const keypair = stellarApi.Keypair.fromRawEd25519Seed(
        Uint8Array.from(derivedSeed) as unknown as number[]
      )

      stellarKey = keypair.secret()
      stellarMnemonic = userInput
    } else {
      userInput.replace(/ /g, '')
      stellarApi.Keypair.fromSecret(userInput)
      if (userInput.length !== 56) throw new Error('Private key wrong length')
      stellarKey = userInput
    }

    return await Promise.resolve({
      stellarKey,
      stellarMnemonic
    })
  }

  async derivePublicKey(walletInfo: EdgeWalletInfo): Promise<Object> {
    if (walletInfo.type !== this.currencyInfo.walletType) {
      throw new Error('InvalidWalletType')
    }

    const keypair = stellarApi.Keypair.fromSecret(walletInfo.keys.stellarKey)
    return { publicKey: keypair.publicKey() }
  }

  async parseUri(uri: string): Promise<EdgeParsedUri> {
    const networks = {}
    // @ts-expect-error
    networks[URI_PREFIX] = true
    const STELLAR_SEP007_PREFIX = `${URI_PREFIX}:pay`

    if (uri.includes(STELLAR_SEP007_PREFIX)) {
      const parsedUri = parse(uri, {}, true)
      const addr = parsedUri.query.destination
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      if (addr) {
        uri = uri.replace(STELLAR_SEP007_PREFIX, `${URI_PREFIX}:${addr}`)
      }
    }

    const { parsedUri, edgeParsedUri } = parseUriCommon(
      this.currencyInfo,
      uri,
      networks
    )

    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions, @typescript-eslint/prefer-nullish-coalescing
    const valid = this.checkAddress(edgeParsedUri.publicAddress || '')
    if (!valid) {
      throw new Error('InvalidPublicAddressError')
    }

    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (parsedUri.query.msg) {
      edgeParsedUri.metadata = {
        notes: parsedUri.query.msg
      }
    }
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (parsedUri.query.asset_code) {
      if (parsedUri.query.asset_code.toUpperCase() !== 'XLM') {
        throw new Error('ErrorInvalidCurrencyCode')
      }
    }
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (parsedUri.query.memo_type) {
      if (parsedUri.query.memo_type !== 'MEMO_ID') {
        throw new Error('ErrorInvalidMemoType')
      }
    }
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (parsedUri.query.memo) {
      const m = add(parsedUri.query.memo, '0')
      // Check if the memo is an integer
      if (m !== parsedUri.query.memo) {
        throw new Error('ErrorInvalidMemoId')
      }
      edgeParsedUri.uniqueIdentifier = parsedUri.query.memo
    }
    return edgeParsedUri
  }

  async encodeUri(
    obj: EdgeEncodeUri,
    customTokens: EdgeMetaToken[] = []
  ): Promise<string> {
    const valid = this.checkAddress(obj.publicAddress)
    if (!valid) {
      throw new Error('InvalidPublicAddressError')
    }
    let amount
    if (typeof obj.nativeAmount === 'string') {
      const currencyCode: string = 'XLM'
      const nativeAmount: string = obj.nativeAmount
      const denom = getLegacyDenomination(
        currencyCode,
        this.currencyInfo,
        customTokens
      )
      if (denom == null) {
        throw new Error('InternalErrorInvalidCurrencyCode')
      }
      amount = div(nativeAmount, denom.multiplier, 7)
    }
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (!amount && !obj.label && !obj.message) {
      return obj.publicAddress
    } else {
      let queryString: string = `destination=${obj.publicAddress}&`
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      if (amount) {
        queryString += 'amount=' + amount + '&'
      }
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions, @typescript-eslint/prefer-nullish-coalescing
      if (obj.label || obj.message) {
        if (typeof obj.label === 'string') {
          queryString += 'label=' + obj.label + '&'
        }
        if (typeof obj.message === 'string') {
          queryString += 'msg=' + obj.message + '&'
        }
      }
      queryString = queryString.substr(0, queryString.length - 1)

      const serializeObj = {
        scheme: URI_PREFIX,
        path: 'pay',
        query: queryString
      }
      const url = serialize(serializeObj)
      return url
    }
  }
}

export async function makeCurrencyTools(
  env: PluginEnvironment<StellarNetworkInfo>
): Promise<StellarTools> {
  return new StellarTools(env)
}

export { makeCurrencyEngine } from './StellarEngine'
