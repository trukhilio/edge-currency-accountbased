"use strict";Object.defineProperty(exports, "__esModule", {value: true});var _biggystring = require('biggystring');







var _cleaners = require('cleaners');

const asHexNumber = raw => {
  const clean = _cleaners.asString.call(void 0, raw)
  if (/0[xX][0-9a-fA-F]+/.test(clean)) return parseInt(clean, 16)
  throw new TypeError('Expected a hex number')
}

const asHexString = raw => {
  const clean = _cleaners.asString.call(void 0, raw)
  if (/0[xX][0-9a-fA-F]+/.test(clean)) return _biggystring.add.call(void 0, raw, '0')
  throw new TypeError('Expected a hex number')
}

 const asEtherscanGetBlockHeight = _cleaners.asObject.call(void 0, {
  result: asHexNumber
}); exports.asEtherscanGetBlockHeight = asEtherscanGetBlockHeight

 const asEtherscanGetAccountNonce = _cleaners.asObject.call(void 0, {
  result: asHexString
}); exports.asEtherscanGetAccountNonce = asEtherscanGetAccountNonce

 const asEthGasStation = _cleaners.asObject.call(void 0, {
  safeLow: _cleaners.asNumber,
  average: _cleaners.asNumber,
  fast: _cleaners.asNumber,
  fastest: _cleaners.asNumber
}); exports.asEthGasStation = asEthGasStation

 const asEIP712TypedData = _cleaners.asObject.call(void 0, {
  types: _cleaners.asObject.call(void 0, 
    _cleaners.asArray.call(void 0, 
      _cleaners.asObject.call(void 0, {
        name: _cleaners.asString,
        type: _cleaners.asString
      })
    )
  ),
  primaryType: _cleaners.asString,
  domain: _cleaners.asUnknown,
  message: _cleaners.asUnknown
}); exports.asEIP712TypedData = asEIP712TypedData
