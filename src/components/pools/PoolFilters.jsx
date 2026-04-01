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
    <div className="flex flex-col md:flex-row gap-2 mb-4 p-4">
      {/* Mobile row: search + toggle */}
      <div className="relative flex flex-1 gap-2">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
          <svg className="w-4 h-4" viewBox="0 0 20 20">
            <path fill="currentColor" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9z" />
          </svg>
        </span>
        <input
          type="text"
          placeholder="WETH or WETH/USDC"
          value={localFilters.search}
          className="input glass-input input-sm rounded-xl pl-8 w-full"
          onChange={(e) => updateLocalFilter('search', e.target.value)}
        />
        <button
          onClick={() => {setIsOpen(true)}}
          className="btn btn-sm btn-outline md:hidden rounded-xl btn-glass"
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
        className={`fixed bottom-0 left-0 right-0 z-50 md:hidden glass-modal
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
                className="input sm:flex-1 w-full glass-input input-sm rounded-xl"
                onChange={(e) => updateLocalFilter('tvlUsd', e.target.value)}
              />

              <input
                type="number"
                placeholder="Min Vol 24h ($)"
                value={localFilters.volumeUsd1d}
                className="input sm:flex-1 w-full glass-input input-sm rounded-xl"
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
        className="hidden md:block input glass-input input-sm rounded-xl w-36"
        onChange={(e) => updateLocalFilter('tvlUsd', e.target.value)}
      />
      <input
        type="number"
        placeholder="Min Vol 24h ($)"
        value={localFilters.volumeUsd1d}
        className="hidden md:block input glass-input input-sm rounded-xl w-36"
        onChange={(e) => updateLocalFilter('volumeUsd1d', e.target.value)}
      />
      <button onClick={handleClearFilters} className="hidden md:block btn btn-sm btn-glass rounded-xl">
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
