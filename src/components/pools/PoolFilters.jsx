import { useState } from 'react'
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
  const [isOpen, setIsOpen] = useState(false)

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

  const activeCount = [
    filters.search !== '',
    filters.platforms.length > 0,
    filters.tvlUsd !== '',
    filters.volumeUsd1d !== ''
  ].filter(Boolean).length

  return (
    <div className="flex flex-col md:flex-row gap-2 mb-4 p-4 bg-base-100">
      {/* Mobile row: search + toggle */}
      <div className="flex gap-2 grow">
        <input
          type="text"
          placeholder="SOL or SOL/USDC"
          value={localFilters.search}
          className="input input-bordered input-sm rounded-xl flex-1"
          onChange={(e) => updateLocalFilter('search', e.target.value)}
        />
        <button
          onClick={() => {setIsOpen(true)}}
          className="btn btn-sm btn-outline md:hidden rounded-xl"
        >
          Filters
          <span
            className={`${activeCount < 1 ? 'hidden' : 'badge badge-xs badge-primary'}`}
          >
            {activeCount}
          </span>
        </button>
      </div>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => {setIsOpen(false)}}
      />

      {/* Bottom sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 md:hidden bg-base-100
          rounded-t-4xl transition-transform duration-300 ease-out
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="p-4">
          <div className="w-12 h-1 bg-base-300 rounded-full mx-auto mb-4" />
          <button
            className="btn btn-ghost absolute top-4 right-4 mb-4"
            onClick={() => {setIsOpen(false)}}
          >
            ✕
          </button>

          {/* Desktop row: dropdown + tvl + vol + clear */}
            <div className="whitespace-nowrap mt-10 p-2">
              <Dropdown
                selected={filters.platforms}
                onToggle={togglePlatform}
                options={availablePlatforms}
              />
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap flex-1 p-2 gap-6 sm:gap-4 my-2">
              <input
                type="number"
                placeholder="Min TVL ($)"
                value={localFilters.tvlUsd}
                className="input sm:flex-1 w-full input-bordered input-sm rounded-xl"
                onChange={(e) => updateLocalFilter('tvlUsd', e.target.value)}
              />

              <input
                type="number"
                placeholder="Min Vol 24h ($)"
                value={localFilters.volumeUsd1d}
                className="input sm:flex-1 w-full input-bordered input-sm rounded-xl"
                onChange={(e) => updateLocalFilter('volumeUsd1d', e.target.value)}
              />

              <button onClick={handleClearFilters} className="btn btn-sm btn-ghost">
                Clear filters
              </button>
            </div>

        </div>
      </div>

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
        className="hidden md:block input input-bordered input-sm rounded-xl w-36"
        onChange={(e) => updateLocalFilter('tvlUsd', e.target.value)}
      />
      <input
        type="number"
        placeholder="Min Vol 24h ($)"
        value={localFilters.volumeUsd1d}
        className="hidden md:block input input-bordered input-sm rounded-xl w-36"
        onChange={(e) => updateLocalFilter('volumeUsd1d', e.target.value)}
      />
      <button onClick={handleClearFilters} className="hidden md:block btn btn-sm btn-ghost">
        Clear filters
        <span
          className={`ml-2 ${activeCount < 1 ? 'hidden' : 'badge badge-xs badge-primary'}`}
        >
          {activeCount}
        </span>
      </button>
    </div>
  )
}
