import { useDebouncedFilterInputs } from '../../hooks/useDebouncedFilterInputs'
import { Dropdown } from '../common/Dropdown'

/**
 * UI: Client-Side Pool Filtering Interface
 *
 * Architecture: Presentational component with local state for debounced inputs.
 * Uses useDebouncedFilterInputs hook to maintain responsive UX while preventing
 * expensive re-filtering of 8k pools on every keystroke.
 *
 * State Management:
 * - Text/Number inputs: Local state (instant visual feedback) → 500ms debounce → URL update
 * - Platform dropdown: Direct URL update (no debounce needed for single clicks)
 * - URL as SSOT: Browser back/forward syncs local state via useDebouncedFilterInputs
 *
 * Filter Pipeline (executed in parent PoolsContent):
 * Search (text match) → Platform (multi-select) → TVL/Volume (numeric threshold)
 *
 * @param {Object} props
 * @param {Object} props.filters - Current filter state from URL (search, platforms, tvlUsd, volumeUsd1d)
 * @param {Function} props.updateFilter - URL updater from usePoolFilters (not directly debounced)
 * @param {Function} props.togglePlatform - Platform multi-select handler
 * @param {Function} props.clearFilters - Reset all filters to defaults
 * @param {Array<{value: string, display: string}>} props.availablePlatforms - Platform options from pool data
 * @returns {JSX.Element}
 */
export function PoolFilters({
  filters,
  updateFilter,
  togglePlatform,
  clearFilters,
  availablePlatforms
}) {
  const {
    localFilters,
    updateLocalFilter,
    resetLocalFilters
  } = useDebouncedFilterInputs(filters, updateFilter)

  // Coordinated reset: Clear local state first (sets guard flag), then URL
  // Order matters: prevents debounced values from restoring after URL clear
  const handleClearFilters = () => {
    resetLocalFilters() // 1. Set isResetting=true + clear local state
    clearFilters()      // 2. Clear URL (Effect 1 will skip one cycle)
  }

  return (
    <div className="flex flex-col md:flex-row gap-2 mb-4 p-4 bg-base-100">
      {/* TODO: mobile toggle — commit 3 */}
      <input
        type="text"
        placeholder="SOL or SOL/USDC"
        value={localFilters.search}
        className="input input-bordered input-sm rounded-xl"
        onChange={(e) => updateLocalFilter('search', e.target.value)}
      />
      <div className="hidden md:flex whitespace-nowrap">
        <Dropdown
          selected={filters.platforms}
          onToggle={togglePlatform}
          options={availablePlatforms}
        />
      </div>
      <input
        type="number"
        placeholder="Min TVL ($)"
        value={localFilters.tvlUsd}
        className="hidden md:block input input-bordered input-sm rounded-xl"
        onChange={(e) => updateLocalFilter('tvlUsd', e.target.value)}
      />
      <input
        type="number"
        placeholder="Min Vol 24h ($)"
        value={localFilters.volumeUsd1d}
        className="hidden md:block input input-bordered input-sm rounded-xl"
        onChange={(e) => updateLocalFilter('volumeUsd1d', e.target.value)}
      />
      <button onClick={handleClearFilters} className="hidden md:block btn btn-sm btn-ghost">
        Clear
      </button>
    </div>
  )
}
