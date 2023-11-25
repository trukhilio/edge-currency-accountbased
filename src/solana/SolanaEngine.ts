import * as solanaWeb3 from '@solana/web3.js'
import { add, gt, mul } from 'biggystring'
import { asNumber } from 'cleaners'
import {
  EdgeCurrencyEngine,
  EdgeCurrencyEngineOptions,
  EdgeFetchFunction,
  EdgeSpendInfo,
  EdgeTransaction,
  EdgeWalletInfo,
  InsufficientFundsError,
  JsonObject,
  NoAmountSpecifiedError
} from 'edge-core-js/types'
import { base16 } from 'rfc4648'

import { CurrencyEngine } from '../common/CurrencyEngine'
import { PluginEnvironment } from '../common/innerPlugin'
import { upgradeMemos } from '../common/upgradeMemos'
import { utf8 } from '../common/utf8'
import {
  asyncWaterfall,
  cleanTxLogs,
  getFetchCors,
  getOtherParams
} from '../common/utils'
import { SolanaTools } from './SolanaTools'
import {
  asRecentBlockHash,
  asRpcBalance,
  asRpcGetTransaction,
  asSafeSolanaWalletInfo,
  asSolanaPrivateKeys,
  asSolanaWalletOtherData,
  RpcGetTransaction,
  RpcSignatureForAddress,
  SafeSolanaWalletInfo,
  SolanaNetworkInfo,
  SolanaWalletOtherData
} from './solanaTypes'

const {
  PublicKey,
  Keypair,
  SystemProgram,
  Transaction,
  TransactionInstruction
} = solanaWeb3

const ACCOUNT_POLL_MILLISECONDS = 5000
const BLOCKCHAIN_POLL_MILLISECONDS = 20000
const TRANSACTION_POLL_MILLISECONDS = 3000

export class SolanaEngine extends CurrencyEngine<
  SolanaTools,
  SafeSolanaWalletInfo
> {
  networkInfo: SolanaNetworkInfo
  base58PublicKey: string
  feePerSignature: string
  recentBlockhash: string
  chainCode: string
  otherData!: SolanaWalletOtherData
  fetchCors: EdgeFetchFunction
  progressRatio: number

  constructor(
    env: PluginEnvironment<SolanaNetworkInfo>,
    tools: SolanaTools,
    walletInfo: SafeSolanaWalletInfo,
    opts: any // EdgeCurrencyEngineOptions
  ) {
    super(env, tools, walletInfo, opts)
    this.networkInfo = env.networkInfo
    this.chainCode = tools.currencyInfo.currencyCode
    this.fetchCors = getFetchCors(env.io)
    this.feePerSignature = '5000'
    this.recentBlockhash = '' // must be < ~2min old to send tx
    this.base58PublicKey = walletInfo.keys.publicKey
    this.progressRatio = 0
  }

  setOtherData(raw: any): void {
    this.otherData = asSolanaWalletOtherData(raw)
  }

  async fetchRpc(method: string, params: any = []): Promise<any> {
    const body = {
      jsonrpc: '2.0',
      id: 1,
      method,
      params
    }
    const options = {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }

    const funcs = this.networkInfo.rpcNodes.map(serverUrl => async () => {
      const res = await this.fetchCors(serverUrl, options)
      if (!res.ok) {
        throw new Error(
          `fetchRpc ${options.method} failed error: ${res.status}`
        )
      }
      return await res.json()
    })

    const response = await asyncWaterfall(funcs)
    return response.result
  }

  async queryBalance(): Promise<void> {
    try {
      const response = await this.fetchRpc('getBalance', [
        this.base58PublicKey,
        { commitment: this.networkInfo.commitment }
      ])
      const balance = asRpcBalance(response)
      this.updateBalance(this.chainCode, balance.value.toString())
    } catch (e: any) {
      // Nodes will return 0 for uninitiated accounts so thrown errors should be logged
      this.error(`Error checking ${this.chainCode} address balance`, e)
    }
  }

  async queryBlockheight(): Promise<void> {
    try {
      const blockheight = asNumber(await this.fetchRpc('getSlot'))
      if (blockheight > this.walletLocalData.blockHeight) {
        this.walletLocalData.blockHeight = blockheight
        this.walletLocalDataDirty = true
        this.currencyEngineCallbacks.onBlockHeightChanged(
          this.walletLocalData.blockHeight
        )
      }
    } catch (e: any) {
      this.error(`queryBlockheight Error `, e)
    }
  }

  async queryFee(): Promise<void> {
    try {
      const response = await this.fetchRpc('getRecentBlockhash')
      const {
        blockhash,
        feeCalculator: { lamportsPerSignature }
      } = asRecentBlockHash(response).value
      this.feePerSignature = lamportsPerSignature.toString()
      this.recentBlockhash = blockhash
    } catch (e: any) {
      this.error(`queryFee Error `, e)
    }
  }

  processSolanaTransaction(tx: RpcGetTransaction, timestamp: number): void {
    const ourReceiveAddresses = []
    const index = tx.transaction.message.accountKeys.findIndex(
      account => account === this.base58PublicKey
    )
    if (index < 0 || tx.meta == null) return
    const amount = tx.meta.postBalances[index] - tx.meta.preBalances[index]
    const fee = tx.meta.fee

    // Failed outgoing transactions can go through the normal flow since the payload returns pre- and post- balances which account for burned fees.
    // Failed incoming transactions need to be ignored
    if (amount >= 0) {
      if (tx.meta.err != null) return // ignore these
      ourReceiveAddresses.push(this.base58PublicKey)
    }
    const edgeTransaction: EdgeTransaction = {
      blockHeight: tx.slot,
      currencyCode: this.chainCode,
      date: timestamp,
      isSend: amount.toString().startsWith('-'),
      memos: [],
      nativeAmount: amount.toString(),
      networkFee: fee.toString(),
      ourReceiveAddresses,
      signedTx: '',
      txid: tx.transaction.signatures[0],
      walletId: this.walletId
    }
    this.addTransaction(this.chainCode, edgeTransaction)
  }

  async queryTransactions(): Promise<void> {
    let before = null
    const until =
      this.otherData.newestTxid !== '' ? this.otherData.newestTxid : null
    let txids: RpcSignatureForAddress[] = []
    try {
      // Gather all transaction IDs since we last updated
      while (true) {
        const params = [
          this.base58PublicKey,
          {
            until,
            before,
            limit: this.networkInfo.txQueryLimit,
            commitment: this.networkInfo.commitment
          }
        ]
        const response: RpcSignatureForAddress[] = await this.fetchRpc(
          'getSignaturesForAddress',
          params
        )
        txids = txids.concat(response)
        if (response.length < this.networkInfo.txQueryLimit) break // RPC limit
        before = response[this.networkInfo.txQueryLimit - 1].signature
      }
    } catch (e: any) {
      this.error('getTransactionSignatures failed with error: ', e)
      return
    }

    if (txids.length === 0) {
      this.tokenCheckTransactionsStatus[this.chainCode] = 1
      this.updateOnAddressesChecked()
      return
    }

    let failedTxQueryIndex = -1
    for (let i = txids.length - 1; i >= 0; i--) {
      // Process the transactions from oldest to newest
      try {
        const tx = asRpcGetTransaction(
          await this.fetchRpc('getTransaction', [
            txids[i].signature,
            { encoding: 'json', commitment: this.networkInfo.commitment }
          ])
        )

        // From testing, getSignaturesForAddress always returns a blocktime but it is optional in the RPC docs so we should be prepared to get it if it isn't present
        let timestamp = txids[i].blocktime
        if (timestamp == null || isNaN(timestamp))
          timestamp = asNumber(await this.fetchRpc('getBlockTime', [tx.slot]))

        this.processSolanaTransaction(tx, timestamp)

        // Update progress
        const percent = 1 - i / txids.length
        if (percent !== this.progressRatio) {
          if (Math.abs(percent - this.progressRatio) > 0.25 || percent === 1) {
            this.progressRatio = percent
            this.tokenCheckTransactionsStatus[this.chainCode] =
              this.progressRatio
            this.updateOnAddressesChecked()
          }
        }
      } catch (e: any) {
        // Note the oldest failed tx query so we try again next loop
        failedTxQueryIndex = i
        break
      }
    }

    if (failedTxQueryIndex === -1) {
      // all queries were successful so we can update the newestTxid the latest txid
      this.otherData.newestTxid = txids[0].signature
    } else if (txids.length > failedTxQueryIndex + 1) {
      // If a query failed, set newestTxId to the txid immediately preceding the failed query
      // so we try to get it again next time
      this.otherData.newestTxid = txids[failedTxQueryIndex + 1].signature
    } else {
      // If the failedTxQueryIndex is the end of the array then we don't update newestTxid
    }

    this.walletLocalDataDirty = true
    this.tokenCheckTransactionsStatus[this.chainCode] = 1
    this.updateOnAddressesChecked()

    if (this.transactionsChangedArray.length > 0) {
      this.currencyEngineCallbacks.onTransactionsChanged(
        this.transactionsChangedArray
      )
      this.transactionsChangedArray = []
    }
  }

  // // ****************************************************************************
  // // Public methods
  // // ****************************************************************************

  async startEngine(): Promise<void> {
    this.engineOn = true
    this.addToLoop('queryBlockheight', BLOCKCHAIN_POLL_MILLISECONDS).catch(
      () => {}
    )
    this.addToLoop('queryFee', BLOCKCHAIN_POLL_MILLISECONDS).catch(() => {})
    this.addToLoop('queryBalance', ACCOUNT_POLL_MILLISECONDS).catch(() => {})
    this.addToLoop('queryTransactions', TRANSACTION_POLL_MILLISECONDS).catch(
      () => {}
    )
    await super.startEngine()
  }

  async resyncBlockchain(): Promise<void> {
    await this.killEngine()
    await this.clearBlockchainCache()
    await this.startEngine()
  }

  async makeSpend(edgeSpendInfoIn: EdgeSpendInfo): Promise<EdgeTransaction> {
    edgeSpendInfoIn = upgradeMemos(edgeSpendInfoIn, this.currencyInfo)
    const { edgeSpendInfo, currencyCode } = this.makeSpendCheck(edgeSpendInfoIn)
    const { memos = [] } = edgeSpendInfo

    if (edgeSpendInfo.spendTargets.length !== 1) {
      throw new Error('Error: only one output allowed')
    }

    const { nativeAmount, publicAddress } = edgeSpendInfo.spendTargets[0]

    if (publicAddress == null)
      throw new Error('makeSpend Missing publicAddress')
    if (nativeAmount == null) throw new NoAmountSpecifiedError()

    const nativeNetworkFee = this.feePerSignature

    const balanceSol = this.walletLocalData.totalBalances[this.chainCode] ?? '0'
    let totalTxAmount = '0'
    totalTxAmount = add(nativeAmount, nativeNetworkFee)
    if (gt(totalTxAmount, balanceSol)) {
      throw new InsufficientFundsError()
    }
    // Create Solana transaction
    const payerPublicKey = new PublicKey(this.base58PublicKey)
    const txOpts = {
      recentBlockhash: this.recentBlockhash,
      feePayer: payerPublicKey
    }
    const solTx = new Transaction(txOpts).add(
      SystemProgram.transfer({
        fromPubkey: payerPublicKey,
        toPubkey: new PublicKey(publicAddress),
        lamports: parseInt(nativeAmount)
      })
    )

    if (memos[0]?.type === 'text') {
      const memoOpts = new TransactionInstruction({
        keys: [
          {
            pubkey: payerPublicKey,
            isSigner: true,
            isWritable: true
          }
        ],
        programId: new PublicKey(this.networkInfo.memoPublicKey),
        data: Buffer.from(utf8.parse(memos[0].value))
      })
      solTx.add(memoOpts)
    }

    const otherParams: JsonObject = {
      unsignedSerializedSolTx: solTx.serialize({
        requireAllSignatures: false
      })
    }

    // **********************************
    // Create the unsigned EdgeTransaction

    const edgeTransaction: EdgeTransaction = {
      blockHeight: 0,
      currencyCode,
      date: 0,
      isSend: true,
      memos,
      nativeAmount: mul(totalTxAmount, '-1'),
      networkFee: nativeNetworkFee,
      otherParams,
      ourReceiveAddresses: [],
      signedTx: '',
      txid: '',
      walletId: this.walletId
    }

    return edgeTransaction
  }

  async signTx(
    edgeTransaction: EdgeTransaction,
    privateKeys: JsonObject
  ): Promise<EdgeTransaction> {
    const solanaPrivateKeys = asSolanaPrivateKeys(this.currencyInfo.pluginId)(
      privateKeys
    )
    const { unsignedSerializedSolTx } = getOtherParams(edgeTransaction)
    if (unsignedSerializedSolTx == null)
      throw new Error('Missing unsignedSerializedSolTx')

    const keypair = Keypair.fromSecretKey(
      Uint8Array.from(base16.parse(solanaPrivateKeys.privateKey))
    )

    const solTx = Transaction.from(unsignedSerializedSolTx)
    solTx.recentBlockhash = this.recentBlockhash
    solTx.sign({
      publicKey: keypair.publicKey,
      secretKey: keypair.secretKey
    })
    edgeTransaction.signedTx = solTx.serialize().toString('base64')
    this.warn(`signTx\n${cleanTxLogs(edgeTransaction)}`)
    return edgeTransaction
  }

  async broadcastTx(
    edgeTransaction: EdgeTransaction
  ): Promise<EdgeTransaction> {
    if (edgeTransaction.signedTx == null) throw new Error('Missing signedTx')

    try {
      const params = [edgeTransaction.signedTx, { encoding: 'base64' }]
      const txid = await this.fetchRpc('sendTransaction', params)
      edgeTransaction.txid = txid
      edgeTransaction.date = Date.now() / 1000
      this.warn(`SUCCESS broadcastTx\n${cleanTxLogs(edgeTransaction)}`)
    } catch (e: any) {
      this.warn('FAILURE broadcastTx failed: ', e)
      throw e
    }

    return edgeTransaction
  }
}

export async function makeCurrencyEngine(
  env: PluginEnvironment<SolanaNetworkInfo>,
  tools: SolanaTools,
  walletInfo: EdgeWalletInfo,
  opts: EdgeCurrencyEngineOptions
): Promise<EdgeCurrencyEngine> {
  const safeWalletInfo = asSafeSolanaWalletInfo(walletInfo)
  const engine = new SolanaEngine(env, tools, safeWalletInfo, opts)

  // Do any async initialization necessary for the engine
  await engine.loadEngine()

  return engine
}
