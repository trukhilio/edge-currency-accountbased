"use strict";Object.defineProperty(exports, "__esModule", {value: true});

// We are using the memo to pass Ethereum contract calls:
 const evmMemoOptions = [
  {
    type: 'hex',
    hidden: true,
    memoName: 'data'
  }
]; exports.evmMemoOptions = evmMemoOptions
