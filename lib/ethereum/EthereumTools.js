"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; } function _createNamedExportFrom(obj, localName, importedName) { Object.defineProperty(exports, localName, {enumerable: true, configurable: true, get: () => obj[importedName]}); } function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }var _biggystring = require('biggystring');
var _bip39 = require('bip39');
var _buffer = require('buffer');











var _ethereumjsutil = require('ethereumjs-util'); var _ethereumjsutil2 = _interopRequireDefault(_ethereumjsutil);
var _hdkey = require('ethereumjs-wallet/hdkey'); var _hdkey2 = _interopRequireDefault(_hdkey);
var _ethers = require('ethers');


var _tokenHelpers = require('../common/tokenHelpers');
var _uriHelpers = require('../common/uriHelpers');




var _utils = require('../common/utils');
var _ethereumInfos = require('./ethereumInfos');





var _ethereumTypes = require('./ethereumTypes');

 class EthereumTools  {
  
  
  
  
  

  constructor(env) {
    const { builtinTokens, currencyInfo, io, networkInfo, initOptions } = env
    this.builtinTokens = builtinTokens
    this.currencyInfo = currencyInfo
    this.io = io
    this.networkInfo = networkInfo
    this.initOptions = initOptions
  }

  async getDisplayPrivateKey(
    privateWalletInfo
  ) {
    const { pluginId } = this.currencyInfo
    const keys = _ethereumTypes.asEthereumPrivateKeys.call(void 0, pluginId)(privateWalletInfo.keys)
    return keys.privateKey
  }

  async getDisplayPublicKey(publicWalletInfo) {
    const { keys } = _ethereumTypes.asSafeEthWalletInfo.call(void 0, publicWalletInfo)
    return keys.publicKey
  }

  async importPrivateKey(userInput) {
    const { pluginId } = this.currencyInfo
    const { pluginMnemonicKeyName, pluginRegularKeyName } = this.networkInfo
    if (/^(0x)?[0-9a-fA-F]{64}$/.test(userInput)) {
      // It looks like a private key, so validate the hex:
      const keyBuffer = _buffer.Buffer.from(userInput.replace(/^0x/, ''), 'hex')
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      if (!_ethereumjsutil2.default.isValidPrivate(keyBuffer)) {
        throw new Error('Invalid private key')
      }
      const hexKey = keyBuffer.toString('hex')

      // Validate the address derivation:
      const keys = {
        [pluginRegularKeyName]: hexKey
      }
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.derivePublicKey({
        type: `wallet:${pluginId}`,
        id: 'fake',
        keys
      })
      return keys
    } else {
      // it looks like a mnemonic, so validate that way:
      if (!_bip39.validateMnemonic.call(void 0, userInput)) {
        // "input" instead of "mnemonic" in case private key
        // was just the wrong length
        throw new Error('Invalid input')
      }
      const hexKey = await this._mnemonicToHex(userInput)
      return {
        [pluginMnemonicKeyName]: userInput,
        [pluginRegularKeyName]: hexKey
      }
    }
  }

  async createPrivateKey(walletType) {
    const { pluginMnemonicKeyName, pluginRegularKeyName } = this.networkInfo
    const type = walletType.replace('wallet:', '')

    if (type !== this.currencyInfo.pluginId) {
      throw new Error('InvalidWalletType')
    }

    const entropy = _buffer.Buffer.from(this.io.random(32))
    const mnemonicKey = _bip39.entropyToMnemonic.call(void 0, entropy)

    const hexKey = await this._mnemonicToHex(mnemonicKey) // will not have 0x in it
    return {
      [pluginMnemonicKeyName]: mnemonicKey,
      [pluginRegularKeyName]: hexKey
    }
  }

  async derivePublicKey(walletInfo) {
    const { pluginId } = this.currencyInfo
    const { hdPathCoinType, pluginMnemonicKeyName, pluginRegularKeyName } =
      this.networkInfo
    if (walletInfo.type !== `wallet:${pluginId}`) {
      throw new Error('Invalid wallet type')
    }
    let address
    if (walletInfo.keys[pluginMnemonicKeyName] != null) {
      // If we have a mnemonic, use that:
      const seedBuffer = _bip39.mnemonicToSeedSync.call(void 0, 
        walletInfo.keys[pluginMnemonicKeyName]
      )
      const hdwallet = _hdkey2.default.fromMasterSeed(seedBuffer)
      const walletHdpath = `m/44'/${hdPathCoinType}'/0'/0`
      const walletPathDerivation = hdwallet.derivePath(`${walletHdpath}/0`)
      const wallet = walletPathDerivation.getWallet()
      const publicKey = wallet.getPublicKey()
      const addressHex = _ethereumjsutil2.default.pubToAddress(publicKey).toString('hex')
      address = _ethereumjsutil2.default.toChecksumAddress(addressHex)
    } else {
      // Otherwise, use the private key:
      const keyBuffer = _buffer.Buffer.from(
        walletInfo.keys[pluginRegularKeyName].replace(/^0x/, ''),
        'hex'
      )
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      if (!_ethereumjsutil2.default.isValidPrivate(keyBuffer)) {
        throw new Error('Invalid private key')
      }
      address = `0x${_ethereumjsutil2.default.privateToAddress(keyBuffer).toString('hex')}`
    }
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (!_ethereumjsutil2.default.isValidAddress(address)) {
      throw new Error('Invalid address')
    }
    return { publicKey: address }
  }

  async _mnemonicToHex(mnemonic) {
    const { hdPathCoinType } = this.networkInfo
    const hdwallet = _hdkey2.default.fromMasterSeed(_bip39.mnemonicToSeedSync.call(void 0, mnemonic))
    const walletHdpath = `m/44'/${hdPathCoinType}'/0'/0`
    const walletPathDerivation = hdwallet.derivePath(`${walletHdpath}/0`)
    const wallet = walletPathDerivation.getWallet()
    const privKey = wallet.getPrivateKeyString().replace(/^0x/, '')
    return privKey
  }

  async parseUri(
    uri,
    currencyCode,
    customTokens
  ) {
    const networks = {}
    this.networkInfo.uriNetworks.forEach(network => {
      networks[network] = true
    })

    const { parsedUri, edgeParsedUri } = _uriHelpers.parseUriCommon.call(void 0, 
      this.currencyInfo,
      uri,
      networks,
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions, @typescript-eslint/prefer-nullish-coalescing
      currencyCode || this.currencyInfo.currencyCode,
      customTokens
    )

    let address = ''
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (edgeParsedUri.publicAddress) {
      address = edgeParsedUri.publicAddress
      edgeParsedUri.publicAddress = edgeParsedUri.publicAddress.toLowerCase()
    }

    let [prefix, contractAddress] = address.split('-') // Split the address to get the prefix according to EIP-681
    // If contractAddress is null or undefined it means there is no prefix
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (!contractAddress) {
      contractAddress = prefix // Set the contractAddress to be the prefix when the prefix is missing.
      prefix = 'pay' // The default prefix according to EIP-681 is "pay"
    }
    address = contractAddress

    // Verify checksum if it's present in the address
    if (
      /[A-F]/.test(address) &&
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      !_ethereumjsutil2.default.isValidChecksumAddress(address)
    ) {
      throw new Error('InvalidPublicAddressError')
    }

    // Verify address is valid
    address = address.toLowerCase()
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (!_ethereumjsutil2.default.isValidAddress(address || '')) {
      throw new Error('InvalidPublicAddressError')
    }

    // Parse according to EIP-961
    if (prefix === 'token' || prefix === 'token_info') {
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      if (!parsedUri.query) throw new Error('InvalidUriError')

      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      const currencyCode = _nullishCoalesce(parsedUri.query.symbol, () => ( 'SYM'))
      if (currencyCode.length < 2 || currencyCode.length > 5) {
        throw new Error('Wrong Token symbol')
      }
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      const currencyName = _nullishCoalesce(parsedUri.query.name, () => ( currencyCode))
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      const decimalsInput = _nullishCoalesce(parsedUri.query.decimals, () => ( '18'))
      let multiplier = '1000000000000000000'
      const decimals = parseInt(decimalsInput)
      if (decimals < 0 || decimals > 18) {
        throw new Error('Wrong number of decimals')
      }
      multiplier = '1' + '0'.repeat(decimals)

      const type = _nullishCoalesce(parsedUri.query.type, () => ( this.networkInfo.ercTokenStandard))

      const edgeParsedUriToken = {
        token: {
          currencyCode,
          contractAddress: contractAddress.toLowerCase(),
          currencyName,
          // @ts-expect-error
          multiplier,
          denominations: [{ name: currencyCode, multiplier }],
          type: type.toUpperCase()
        }
      }
      return edgeParsedUriToken
    }

    // Parse according to EIP-681
    if (prefix === 'pay') {
      const targetAddress = address
      const functionName = parsedUri.pathname.split('/')[1]
      const parameters = parsedUri.query

      // Handle contract function invocations
      // This is a very important measure to prevent accidental payment to contract addresses
      switch (functionName) {
        // ERC-20 token transfer
        case 'transfer': {
          const publicAddress = _nullishCoalesce(parameters.address, () => ( ''))
          const contractAddress = _nullishCoalesce(targetAddress, () => ( ''))
          const nativeAmount =
            parameters.uint256 != null
              ? _utils.biggyScience.call(void 0, parameters.uint256)
              : edgeParsedUri.nativeAmount

          // Get meta token from contract address
          const metaToken = this.currencyInfo.metaTokens.find(
            metaToken => metaToken.contractAddress === contractAddress
          )

          // If there is a currencyCode param, the metaToken must be found
          // and it's currency code must matching the currencyCode param.
          if (
            currencyCode != null &&
            (metaToken == null || metaToken.currencyCode !== currencyCode)
          ) {
            throw new Error('InternalErrorInvalidCurrencyCode')
          }

          // Validate addresses
          // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
          if (!_ethereumjsutil2.default.isValidAddress(publicAddress)) {
            throw new Error('InvalidPublicAddressError')
          }
          // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
          if (!_ethereumjsutil2.default.isValidAddress(contractAddress)) {
            throw new Error('InvalidContractAddressError')
          }

          return {
            ...edgeParsedUri,
            currencyCode: _optionalChain([metaToken, 'optionalAccess', _ => _.currencyCode]),
            nativeAmount,
            publicAddress
          }
        }
        // ETH payment
        case undefined: {
          const publicAddress = targetAddress
          const nativeAmount =
            parameters.value != null
              ? _utils.biggyScience.call(void 0, parameters.value)
              : edgeParsedUri.nativeAmount

          return { ...edgeParsedUri, publicAddress, nativeAmount }
        }
        default: {
          throw new Error('UnsupportedContractFunction')
        }
      }
    }

    throw new Error('InvalidUriError')
  }

  async encodeUri(
    obj,
    customTokens = []
  ) {
    const { publicAddress, nativeAmount, currencyCode } = obj
    const valid = _ethereumjsutil2.default.isValidAddress(publicAddress)
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (!valid) {
      throw new Error('InvalidPublicAddressError')
    }
    let amount
    if (typeof nativeAmount === 'string') {
      const denom = _utils.getLegacyDenomination.call(void 0, 
        _nullishCoalesce(currencyCode, () => ( this.currencyInfo.currencyCode)),
        this.currencyInfo,
        customTokens
      )
      if (denom == null) {
        throw new Error('InternalErrorInvalidCurrencyCode')
      }
      amount = _biggystring.div.call(void 0, nativeAmount, denom.multiplier, 18)
    }
    const encodedUri = _uriHelpers.encodeUriCommon.call(void 0, obj, this.currencyInfo.pluginId, amount)
    return encodedUri
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getSplittableTypes(walletInfo) {
    return Object.keys(_ethereumInfos.ethereumPlugins).map(plugin => `wallet:${plugin}`)
  }

  async getTokenId(token) {
    _tokenHelpers.validateToken.call(void 0, token)
    const cleanLocation = _tokenHelpers.asMaybeContractLocation.call(void 0, token.networkLocation)
    if (
      cleanLocation == null ||
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      !_ethereumjsutil2.default.isValidAddress(cleanLocation.contractAddress)
    ) {
      throw new Error('ErrorInvalidContractAddress')
    }
    return cleanLocation.contractAddress.toLowerCase().replace(/^0x/, '')
  }

  // #region otherMethods

  /**
   * Resolve an ENS name, for example: "bob.eth"
   */
  async resolveEnsName(ensName) {
    const { networkAdapterConfigs } = this.networkInfo

    const networkAdapterConfig = networkAdapterConfigs.find(
      networkAdapterConfig => networkAdapterConfig.type === 'rpc'
    )

    if (networkAdapterConfig == null)
      throw new Error('resolveEnsName: No RpcAdapterConfig')

    const rpcServers = networkAdapterConfig.servers

    const ethProviders = rpcServers.map(
      // This call only works on Ethereum networks, hence chainId of 1
      rpcServer => new _ethers.ethers.providers.JsonRpcProvider(rpcServer, 1)
    )

    return await _utils.multicastEthProviders


({
      func: async (ethProvider) =>
        await ethProvider.resolveName(ensName),
      providers: ethProviders
    })
  }
} exports.EthereumTools = EthereumTools;

// #endregion otherMethods

 async function makeCurrencyTools(
  env
) {
  const out = new EthereumTools(env)

  return out
} exports.makeCurrencyTools = makeCurrencyTools;

var _EthereumEngine = require('./EthereumEngine'); _createNamedExportFrom(_EthereumEngine, 'makeCurrencyEngine', 'makeCurrencyEngine');
