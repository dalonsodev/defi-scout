/**
 * URL State Management Utilities
 *
 * Architecture: Pure functions for URL ↔ State conversion
 * Design: Setup C - URL as SSOT, no useState/useEffect sync
 *
 * Why pure functions:
 * - Testable without React dependencies
 * - Predictable (same input → same output)
 * - No side effects or implicit state mutations
 */

// Map for building URL params from accessorKeys
const SORT_COLUMN_MAP = {
  'name': 'name',
  'apy': 'apyBase',
  'tvl': 'tvlUsd',
  'vol': 'volumeUsd1d',
  'chain': 'chain',
  'platform': 'platformName'
}

// Reverse map URL params to TanStack Table accessorKeys
const COLUMN_TO_URL = {
  'name': 'name',
  'apyBase': 'apy',
  'tvlUsd': 'tvl',
  'volumeUsd1d': 'vol',
  'chain': 'chain',
  'platformName': 'platform'
}

// Defaults state values (used for validation and clean URL generation)
const DEFAULT_STATE = {
  search: '',
  platforms: [],
  tvlUsd: '',
  volumeUsd1d: '',
  sortBy: 'tvlUsd',
  sortDir: 'desc',
  page: 0
}

/**
 * Converts URLSearchParams to typed state object.
 *
 * @param {URLSearchParams} searchParams - URL Search Params object
 * @returns {Object} Parsed state with defaults for invalid/missing values
 *
 * Type Conversions:
 * - Strings: Direct extraction (search)
 * - Arrays: Comma-separated split (platforms)
 * - Numbers: String → Number with validation (tvlUsd, volumeUsd1d, page)
 * - Enums: Whitelist validation (sortBy, sortDir)
 *
 * Validation Rules:
 * - Numeric filters: > 0 (zero or negative values fallback to default)
 * - Sort column: Must exist in SORT_COLUMN_MAP (invalid → default)
 * - Sort direction: Must be 'asc' or 'desc' (invalid → default)
 * - Platforms: Deduplicated, empty strings filtered out
 *
 * @example
 * parseSearchParams(new URLSearchParams('?search=eth&platforms=uniswap,curve&tvlUsd=1000000'))
 * // => { search: 'eth', platforms: ['uniswap-v3', 'curve'], tvlUsd: '1000000', ... }
 */
export function parseSearchParams(searchParams) {
  // 1. Search term (string, no validation needed)
  const search = searchParams.get('search') || DEFAULT_STATE.search

  // 2. Platforms (array from comma-separated string, deduplicated)
  const platformsParam = searchParams.get('platforms')
  const platforms = platformsParam
    ? [...new Set(platformsParam.split(',').filter(Boolean))]
    : DEFAULT_STATE.platforms

  // 3. TVL filter (string → validated number → back to string for input compatibility)
  const tvlParam = searchParams.get('tvlUsd')
  const tvlNum = Number(tvlParam)
  const tvlUsd = tvlParam && !isNaN(tvlNum) && tvlNum > 0
    ? tvlParam
    : DEFAULT_STATE.tvlUsd

  // 4. Volume filter (same logic as TVL)
  const volParam = searchParams.get('volumeUsd1d')
  const volNum = Number(volParam)
  const volumeUsd1d = volParam && !isNaN(volNum) && volNum > 0
    ? volParam
    : DEFAULT_STATE.volumeUsd1d

  // 5. Sort column (validate against allowed columns)
  const sortByParam = searchParams.get('sortBy')
  const sortBy = sortByParam && SORT_COLUMN_MAP[sortByParam]
    ? SORT_COLUMN_MAP[sortByParam] // URL 'tvl' → accessorKey 'tvlUsd'
    : DEFAULT_STATE.sortBy

  // 6. Sort direction (validate enum)
  const sortDirParam = searchParams.get('sortDir')
  const sortDir = sortDirParam === 'desc' || sortDirParam === 'asc'
    ? sortDirParam
    : DEFAULT_STATE.sortDir

  // 7. Page index (number with >= 0 validation)
  const pageParam = searchParams.get('page')
  const pageNum = Number(pageParam)
  const page = !isNaN(pageNum) && pageNum >= 0
    ? pageNum
    : DEFAULT_STATE.page

  return {
    search,
    platforms,
    tvlUsd,
    volumeUsd1d,
    sortBy,
    sortDir,
    page
  }
}

/**
 * Creates URLSearchParams from state, omitting default values.
 *
 * @param {Object} state - Current application state
 * @returns {URLSearchParams} Clean params (no defaults, no empty values)
 *
 * Clean URL Strategy:
 * - Omits values matching DEFAULT_STATE (e.g. page=0, sortDir='desc')
 * - Omits empty strings and empty arrays
 * - Converts accessorKeys back to short URL params (tvlUsd → tvl)
 *
 * Why clean URLs:
 * - Shareability: ?tvlUsd=1000000 vs ?search=&page=0&sortBy=tvl&sortDir=desc&tvlUsd=1000000
 * - SEO-friendly (if applicable)
 * - Easier debugging in browser DevTools
 *
 * @example
 * buildCleanSearchParams({ search: '', platforms: [], tvlUsd: '1000000', sortBy: 'tvlUsd', sortDir: 'desc', page: 0 })
 * // => URLSearchParams with only ?tvlUsd=1000000 (rest are defaults)
 */
export function buildCleanSearchParams(state) {
  const params = new URLSearchParams()

  // 1. Search (skip if empty string)
  if (state.search !== DEFAULT_STATE.search) {
    params.set('search', state.search)
  }

  // 2. Platforms (skip if empty array)
  if (state.platforms.length > 0) {
    params.set('platforms', state.platforms.join(','))
  }

  // 3. TVL (skip if empty string)
  if (state.tvlUsd !== DEFAULT_STATE.tvlUsd) {
    params.set('tvlUsd', state.tvlUsd)
  }

  // 4. Volume (skip if empty string)
  if (state.volumeUsd1d !== DEFAULT_STATE.volumeUsd1d) {
    params.set('volumeUsd1d', state.volumeUsd1d)
  }

  // 5. Sort column (convert accessorKey → URL param, skip if default)
  if (state.sortBy !== DEFAULT_STATE.sortBy) {
    const urlParam = COLUMN_TO_URL[state.sortBy] || state.sortBy
    params.set('sortBy', urlParam)
  }

  // 6. Sort direction (skip if default)
  if (state.sortDir !== DEFAULT_STATE.sortDir) {
    params.set('sortDir', state.sortDir)
  }

  // 7. Page (skip if 0)
  if (state.page !== DEFAULT_STATE.page) {
    params.set('page', state.page.toString())
  }

  return params
}

/**
 * Merge partial state updates into current URL params
 *
 * @param {Object} navigate - React Router navigate function
 * @param {URLSearchParams} currentParams - Current URL search params
 * @param {Object} updates - Partial state changes to apply
 *
 * Flow: Parse current → Merge updates → Build clean → Navigate
 *
 * Why replace: true:
 * - Avoids polluting browser history with every filter change
 * - Back button exits page instead of undoing last filter
 * - Cleaner UX for non-power users
 *
 * Design Note: Receives navigate as parameter (not imported) for:
 * - Testability (can pass mock function)
 * - Keeps function pure (no side effects from imports)
 * - Separation of concerns (routing logic stays in components)
 *
 * @example
 * // Current URL: ?search=eth&tvlUsd=1000000
 * updateSearchParam(navigate, searchParams, { sortBy: 'apyBase', sortDir: 'asc' })
 * // Result: ?search=eth&tvlUsd=1000000&sortBy=apy&sortDir=asc
 */
export function updateSearchParams(navigate, currentParams, updates) {
  // 1. Parse current URL to full state object
  const current = parseSearchParams(currentParams)

  // 2. Merge updates (spread preserves unchanged values)
  const newState = { ...current, ...updates }

  // 3. Build clean params (omits defaults)
  const newParams = buildCleanSearchParams(newState)

  // 4. Navigate with new params (replace to avoid history pollution)
  navigate(`?${newParams.toString()}`, { replace: true })
}
