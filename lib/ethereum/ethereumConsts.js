"use strict";Object.defineProperty(exports, "__esModule", {value: true}); const WEI_MULTIPLIER = 1000000000; exports.WEI_MULTIPLIER = WEI_MULTIPLIER
 const GAS_STATION_WEI_MULTIPLIER = 100000000; exports.GAS_STATION_WEI_MULTIPLIER = GAS_STATION_WEI_MULTIPLIER // 100 million is the multiplier for ethgasstation because it uses 10x gwei
 const GAS_PRICE_SANITY_CHECK = 30000; exports.GAS_PRICE_SANITY_CHECK = GAS_PRICE_SANITY_CHECK // 3000 Gwei (ethgasstation api reports gas prices with additional decimal place)
 const OPTIMAL_FEE_HIGH_MULTIPLIER = 0.75; exports.OPTIMAL_FEE_HIGH_MULTIPLIER = OPTIMAL_FEE_HIGH_MULTIPLIER
 const NETWORK_FEES_POLL_MILLISECONDS = 60 * 10 * 1000; exports.NETWORK_FEES_POLL_MILLISECONDS = NETWORK_FEES_POLL_MILLISECONDS // 10 minutes
 const ROLLUP_FEE_PARAMS = 5 * 60 * 1000; exports.ROLLUP_FEE_PARAMS = ROLLUP_FEE_PARAMS // 5 minutes
