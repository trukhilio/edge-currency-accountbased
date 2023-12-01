"use strict";Object.defineProperty(exports, "__esModule", {value: true});
var _reactnative = require('react-native');
var _reactnativepiratechain = require('react-native-piratechain');
var _reactnativezcash = require('react-native-zcash');
var _yaob = require('yaob');

const { EdgeCurrencyAccountbasedModule } = _reactnative.NativeModules
const { sourceUri } = EdgeCurrencyAccountbasedModule.getConstants()

 const pluginUri = sourceUri; exports.pluginUri = pluginUri
 const debugUri = 'http://localhost:8082/edge-currency-accountbased.js'; exports.debugUri = debugUri

 function makePluginIo() {
  _yaob.bridgifyObject.call(void 0, _reactnativepiratechain.Tools)
  _yaob.bridgifyObject.call(void 0, _reactnativezcash.Tools)

  return {
    async fetchText(uri, opts) {
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
} exports.makePluginIo = makePluginIo;
