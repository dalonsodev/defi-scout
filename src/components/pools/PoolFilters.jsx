import { Dropdown } from '../common/Dropdown'

/**
 * UI: Client-Side Pool Filtering Interface
 *
 * Architecture Decision: All filtering logic runs in-browser instead of API queries
 * because DeFiLlama's endpoint doesn't support query params (returns full +8k dataset).
 * Trade-off: Instant filtering UX vs initial 1.2s load time.
 *
 * Filter Pipeline: Search (text match) => Platform (multi-select) => TVL/Volume (numeric threshold)
 * Triggers re-render in parent (PoolsContent) via updateFilter callback.
 *
 * @param {Object} props
 * @param {Object} props.filters - Active filter state (search, platforms, tvlUSD, volumeUsd1d)
 * @param {Function} props.updateFilter - Setter for individual filter keys (debounced in parent)
 * @param {Function} props.togglePlatform - Multi-select handler for platform dropdown
 * @param {Function} props.clearFilters - Reset all filters to default values
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
  return (
    <div className="flex flex-wrap gap-2 mb-4 p-4 bg-base-100">
      <label className="form-control max-w-xs">
        <div className="label">
          <span className="label-text">Coin/Pair</span>
        </div>
        <input
          type="text"
          placeholder="SOL or SOL/USDC"
          value={filters.search}
          className="input input-bordered input-sm rounded-xl"
          onChange={(e) => updateFilter('search', e.target.value)}
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
          value={filters.tvlUsd}
          className="input input-bordered input-sm rounded-xl"
          onChange={(e) => updateFilter('tvlUsd', e.target.value)}
        />
      </label>

      <label className="form-control w-full max-w-xs">
        Vol (24h)
        <input
          type="number"
          placeholder="Min 24h Vol ($)"
          value={filters.volumeUsd1d}
          className="input input-bordered input-sm rounded-xl"
          onChange={(e) => updateFilter('volumeUsd1d', e.target.value)}
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
