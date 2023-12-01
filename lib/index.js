"use strict";Object.defineProperty(exports, "__esModule", {value: true});require('regenerator-runtime/runtime');



var _ethereumInfos = require('./ethereum/ethereumInfos');
var _fioInfo = require('./fio/fioInfo');

const plugins = {
  ..._ethereumInfos.ethereumPlugins,
  fio: _fioInfo.fio
}







if (
  typeof window !== 'undefined' &&
  typeof window.addEdgeCorePlugins === 'function'
) {
  window.addEdgeCorePlugins(plugins)
}

exports. default = plugins
