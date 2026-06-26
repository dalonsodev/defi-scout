export interface RawToken {
  id: string
  symbol: string
  name: string
  decimals?: string
  derivedETH?: string
}

export interface RawTick {
  tickIdx: string
  liquidityNet: string
  liquidityGross: string
}

export interface RawPoolTicks {
  tick: string | null
  liquidity: string
  ticksBelow: RawTick[]
  ticksAbove: RawTick[]
}

export interface BasePool {
  id: string,
  feeTier: string
  totalValueLockedUSD: string
  totalValueLockedToken0: string
  totalValueLockedToken1: string
  token0Price: string
  token1Price: string
  createdAtTimestamp: string
  token0: RawToken
  token1: RawToken
}

export interface RawPool extends BasePool {
  volumeUSD: string
  volumeToken0: string
  volumeToken1: string
  collectedFeesUSD: string
  collectedFeesToken0: string
  collectedFeesToken1: string
  liquidity: string
}

export interface RawPoolHistory extends BasePool {
  tick?: string | null
}

export interface RawBundle {
  ethPriceUSD: string
}

export interface RawPoolDayData {
  date: number
  tvlUSD: string
  feesUSD: string
  volumeUSD?: string
  token0Price?: string
  token1Price?: string
  pool?: { id: string }
}

export interface RawPoolHourData {
  periodStartUnix: number
  token0Price: string
  token1Price: string
  feesUSD: string
  sqrtPrice: string
  liquidity: string
  tvlUSD: string
  tick: string | null
}

export interface PoolTickResult {
  tick: string | null
  liquidity: string
  ticks: RawTick[]
}

export interface ParamsState {
  search: string
  platforms: string[]
  tvlUsd: string
  volumeUsd1d: string
  sortBy: string
  sortDir: 'desc' | 'asc'
  page: number
}

export interface UserInputs {
  fullRange: boolean
  capitalUSD: number
  minPrice: string | number
  maxPrice: string | number
  assumedPrice: string | number
}

export interface Composition {
  amount0: number
  amount1: number
  currentPrice: string
  range: string
}

export interface FormattedPool {
  id: string
  symbol: string
  feeTier: number
  feeTierFormatted: string
  name: string
  chain: string
  project: string
  platformName: string
  apyBase: number
  apyFormatted: string
  liquidity: number
  liquidityFormatted: string
  tvlUsd: number
  tvlFormatted: string
  volumeUsd1d: number
  volumeFormatted: string
  feesUSD: number
  feesUSDFormatted: string
  poolAgeDays: number
  token0Price: number
  token0id: string
  token0symbol: string
  token0name: string
  token0PriceFormatted: string
  token0tvl: number
  token0tvlFormatted: string
  token0Vol: number
  token0VolFormatted: string
  token0feesUSD: number
  token0feesUSDFormatted: string
  token1id: string
  token1symbol: string
  token1name: string
  token1tvl: number
  token1tvlFormatted: string
  token1Vol: number
  token1VolFormatted: string
  token1feesUSD: number
  token1feesUSDFormatted: string
}

export interface FormattedPoolHistory {
  date: string
  dateTimestamp: number
  dateShort: string
  dayLabel: string
  volumeUSD: number
  tvlUSD: number
  feesUSD: number
  token0Price: number
  token1Price: number
  apy: number
}

export interface FormattedHourlyData {
  dateShort: string
  dayLabel: string
  token0Price: number | null
  token1Price: number | null
  periodStartUnix: number
  liquidity: number
  tvlUSD: number
  feesUSD: number
}
