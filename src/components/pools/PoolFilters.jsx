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
  const { localFilters, updateLocalFilter } = useDebouncedFilterInputs(filters, updateFilter)

  return (
    <div className="flex flex-wrap gap-2 mb-4 p-4 bg-base-100">
      <label className="form-control max-w-xs">
        <div className="label">
          <span className="label-text">Coin/Pair</span>
        </div>
        <input
          type="text"
          placeholder="SOL or SOL/USDC"
          value={localFilters.search}
          className="input input-bordered input-sm rounded-xl"
          onChange={(e) => updateLocalFilter('search', e.target.value)}
        />
      </label>

      <label className="form-control w-full max-w-xs">
        <div className="label">
          <span className="label-text">Platform</span>
        </div>
        <Dropdown
          selected={filters.platforms}
          onToggle={togglePlatform}
          options={availablePlatforms}
        />
      </label>

      <label className="form-control w-full max-w-xs">
        TVL
        <input
          type="number"
          placeholder="Min TVL ($)"
          value={localFilters.tvlUsd}
          className="input input-bordered input-sm rounded-xl"
          onChange={(e) => updateLocalFilter('tvlUsd', e.target.value)}
        />
      </label>

      <label className="form-control w-full max-w-xs">
        Vol (24h)
        <input
          type="number"
          placeholder="Min 24h Vol ($)"
          value={localFilters.volumeUsd1d}
          className="input input-bordered input-sm rounded-xl"
          onChange={(e) => updateLocalFilter('volumeUsd1d', e.target.value)}
        />
      </label>

      <div className="flex items-end">
        <button onClick={clearFilters} className="btn btn-sm btn-ghost">
          Clear
        </button>
      </div>
    </div>
  )
}
