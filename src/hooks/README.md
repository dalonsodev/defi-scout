# Custom Hooks

## useDebounce

Prevents excessive re-renders during rapid state changes.

**Use Case:** Search inputs, slider controls.

**Key Feature:** Skips debounce on mount for hydration compatibility.

## useProjectionCalculator

Simulates HODL vs LP strategies under price scenarios.

**Use Case:** DeFi portfolio analysis.

**Key Feature:** Accounts for IL + fees with ±20% accuracy.

## useRequestQueue

Token bucket rate limiter with circuit breaker.

**Use Case:** Client-side throttling for API-heavy UIs.

**Key Feature:** Fail-fast on 429, prevents API key burnout.
