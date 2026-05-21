# Custom Hooks

Shared hooks used across the app. Feature-scoped hooks (calculator, charts) live alongside their components.

---

## useBreakpoint

Synchronizes React state with a CSS media query using the `matchMedia` API instead of resize listeners.

**Use case:** Logic that can't be handled by Tailwind classes alone (e.g. conditional chart rendering).

**Key detail:** `addEventListener('change')` fires only when the breakpoint crosses, not on every pixel — ~10x cheaper than a throttled resize handler.

---

## useDebounce

Delays propagation of a rapidly-changing value until the user stops typing.

**Use case:** Search inputs, min TVL / volume number inputs.

**Key detail:** Skips the debounce on mount to avoid overwriting URL state on initial hydration.

---

## useDebouncedFilterInputs

Layered on top of `useDebounce`. Maintains instant local state for text/number inputs while debouncing the URL writes that drive filtering.

**Use case:** Filter bar — gives immediate visual feedback with no lag, while keeping the URL (the source of truth) from updating on every keystroke.

**Key detail:** Includes a reset guard (`isResetting` ref) that prevents a race condition where clearing filters would be immediately undone by a pending debounced value restoring itself to the URL.

---

## useFavorites

Manages a user's watchlist by syncing with Firestore. Exposes a `toggleFavorite` function that updates local state optimistically before the Firestore write confirms.

**Use case:** Star/unstar pools from the table, detail page, or watchlist.

**Key detail:** Opens the auth modal automatically if the user isn't logged in.

---

## useIntersection

Wraps `IntersectionObserver` to track which table rows have entered the viewport.

**Use case:** Lazy-loading sparkline data — only fetches for pools the user can actually see.

**Key detail:** Pool IDs are never removed from the tracked Set once they've intersected. This is intentional: it acts as a fetch-once cache so scrolling back up doesn't re-trigger requests.

---

## usePoolFilters

Single source of truth for all filter state, stored in URL search params via React Router.

**Use case:** Replaces prop drilling across `PoolsContent → PoolFilters → individual inputs`.

**Key detail:** `togglePlatform` is separate from the generic `updateFilter` because multi-select needs array manipulation (add/remove), while other filters are simple value replacements.

---

## usePrevious

Returns the value a variable held on the previous render.

**Use case:** Detecting reference changes in complex objects (e.g. knowing filters actually changed vs. just re-rendered).

**Key detail:** The ref update runs after the render commits, so `ref.current` always lags one cycle behind — that's the feature, not a bug.

---

## useSparklines

Fetches 14-day APY trend data for pools currently visible in the viewport.

**Use case:** Populating sparkline charts in the pool table.

**Key detail:** Replaces the original token-bucket / per-pool REST approach with a single batched GraphQL query to TheGraph. Only fetches pools not already in the session cache (differential updates), and is gated to page 1 only.
