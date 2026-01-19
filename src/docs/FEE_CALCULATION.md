# Uniswap V3 Liquidity-Based Fee Calculation

**Branch:** `feat/range-calculator`  
**Purpose:** Simulate concentrated liquidity positions with accurate fee accumulation

## Overview

This implementation calculates fee share based on **liquidity contribution** rather than TVL ratio, accurately reflecting the concentration advantage of Uniswap V3 positions.

## Core Concept

In Uniswap V3, concentrated positions earn more fees because they provide **higher liquidity density** at specific price points. A $1,000 position in a ±5% range contributes more "active liquidity" than the same capital spread across full range.

## Mathematical Foundation

### Liquidity Formula (Off-Chain)

We use Uniswap V3's liquidity formulas adapted for off-chain simulation:

```javascript
// From token0 contribution
L0 = amount0 * (√price * √maxPrice) / (√maxPrice - √price)

// From token1 contribution  
L1 = amount1 / (√price - √minPrice)

// Conservative approach (bottleneck principle)
L_user = Math.min(L0, L1)
```

**Why Math.min()?** Both tokens must be present for swaps to execute in both directions. The limiting factor determines effective liquidity.

### Fee Share Calculation

```javascript
feeShare = L_user / (L_user + L_pool)
```

Where:
- `L_user`: User's liquidity (calculated above)
- `L_pool`: Pool's total liquidity from TheGraph (hourly snapshots)

### Impermanent Loss Calculation

```javascript
// Classic AMM formula
priceRatio = finalPrice / initialPrice
IL_decimal = (2 × √priceRatio) / (1 + priceRatio) - 1
```

**Used in:**
- Historical backtest: Compare initial vs final pool price
- Future projections: Compare current vs user-input future price  
- Strategy comparison: HODL value vs LP value (capital × (1 + IL))

**Implementation:** `src/utils/calculateIL.js`

### Universal Normalization

On-chain liquidity values are scaled by token decimals. To compare `L_user` (off-chain) with `L_pool` (on-chain), we normalize using the **geometric mean of token decimals**:

```javascript
exponent = (decimals0 + decimals1) / 2
L_pool_normalized = L_pool_onchain / 10^exponent
```

**Examples:**
- WETH (18) / USDC (6): exponent = 12 → factor = 10^12
- DAI (18) / USDC (6): exponent = 12 → factor = 10^12  
- WETH (18) / DAI (18): exponent = 18 → factor = 10^18

### Precision Handling

We use `BigInt` for on-chain liquidity values to avoid IEEE 754 precision loss:

```javascript
const L_pool_bigint = BigInt(hour.liquidity) // Preserves all digits
const L_pool_normalized = Number(L_pool_bigint) / Math.pow(10, exponent)
```

**Why?** On-chain liquidity values (~10^18) exceed JavaScript's `Number.MAX_SAFE_INTEGER` (2^53 - 1). `parseFloat()` would lose precision in the last digits.

## Implementation Details

### File Structure

```
src/utils/
├── calculateLiquidity.js          # L_user calculation
├── calculateIL.js                 # Impermanent loss formula
└── simulateRangePerformance.js    # Fee accumulation loop
```

### Integration Points

**Liquidity calculation (Stage 4.6):**
```javascript
const L_user = calculateLiquidity(
   amount0, amount1,
   currentPrice, effectiveMin, effectiveMax
)
```

**Fee accumulation (Stage 5.5):**
```javascript
const L_pool_bigint = BigInt(hour.liquidity)
const L_pool_normalized = Number(L_pool_bigint) / Math.pow(10, liquidityExponent)
const feeShare = L_user / (L_pool_normalized + L_user)
totalFeesUSD += hourFeesUSD * feeShare
```

### Key Edge Cases

1. **Price outside range:** `L_user = 0` (position inactive)
2. **Price at boundaries:** `L_user = 0` (avoid division by zero)
3. **Invalid pool data:** Skip hour if `L_pool <= 0`

### Validation Strategy

Compare fee share with TVL-based baseline:

```javascript
expectedFeeShare = capitalUSD / poolTVL  // Baseline (full range)
actualFeeShare = L_user / (L_user + L_pool) // Should be 3-30x higher for concentrated ranges
```

## Performance Impact

- **Full range (±∞):** Fee share ≈ TVL ratio (1x)
- **±50% range:** 2-5x higher  
- **±10% range:** 5-15x higher
- **±5% range:** 10-30x higher

## Technical Debt & Limitations

- **Current tick check:** We use `price >= minPrice && price <= maxPrice` instead of tick-based range checking (acceptable for off-chain simulation)
- **Assumes static composition:** Token amounts don't change during simulation (IL affects value, not quantities)
- **Hourly granularity:** Fee accumulation based on hourly snapshots, not per-block precision

## References

- [Uniswap V3 Whitepaper](https://uniswap.org/whitepaper-v3.pdf) - Section 6.2 (Liquidity)
- [Uniswap V3 Development Book](https://uniswapv3book.com/docs/milestone_3/calculating-liquidity/) - Practical implementation  
- [MDN BigInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt) - Precision handling