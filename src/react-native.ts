import { EdgeOtherMethods } from 'edge-core-js/types'
import { NativeModules } from 'react-native'
import { Tools as PiratechainNativeTools } from 'react-native-piratechain'
import { Tools as ZcashNativeTools } from 'react-native-zcash'
import { bridgifyObject } from 'yaob'

const { EdgeCurrencyAccountbasedModule } = NativeModules
const { sourceUri } = EdgeCurrencyAccountbasedModule.getConstants()

export const pluginUri = sourceUri
export const debugUri = 'http://localhost:8082/edge-currency-accountbased.js'

export function makePluginIo(): EdgeOtherMethods {
  bridgifyObject(PiratechainNativeTools)
  bridgifyObject(ZcashNativeTools)

  return {
    async fetchText(uri: string, opts: Object) {
      return await window.fetch(uri, opts).then(
        async reply =>
          await reply.text().then(text => ({
            ok: reply.ok,
            status: reply.status,
            statusText: reply.statusText,
            url: reply.url,
            text
          }))
      )
    }
  }
}
