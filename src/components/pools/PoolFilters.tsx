import { useState } from 'react'
import { useDebouncedFilterInputs } from '../../hooks/useDebouncedFilterInputs'
import { Dropdown } from '../common/Dropdown'
import type { ReactNode } from 'react'
import type { ParamsState } from '../../types'

type Filters = Pick<ParamsState, 'search' | 'platforms' | 'tvlUsd' | 'volumeUsd1d'>

interface PoolFiltersProps {
  filters: Filters
  updateFilter: (key: string, value: unknown) => void
  togglePlatform: (platform: string) => void
  clearFilters: () => void
  availablePlatforms: { value: string, display: string }[]
}

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
 * @param props
 * @param props.filters - Current filter state from URL (search, platforms, tvlUsd, volumeUsd1d)
 * @param props.updateFilter - URL updater from usePoolFilters (not directly debounced)
 * @param props.togglePlatform - Platform multi-select handler
 * @param props.clearFilters - Reset all filters to defaults
 * @param props.availablePlatforms - Platform options from pool data
 */
export function PoolFilters({
  filters,
  updateFilter,
  togglePlatform,
  clearFilters,
  availablePlatforms
}: PoolFiltersProps): ReactNode {
  const [isOpen, setIsOpen] = useState(false)

  const { localFilters, updateLocalFilter, resetLocalFilters } =
    useDebouncedFilterInputs(filters, updateFilter)

  // Coordinated reset: Clear local state first (sets guard flag), then URL
  // Order matters: prevents debounced values from restoring after URL clear
  const handleClearFilters = () => {
    resetLocalFilters() // 1. Set isResetting=true + clear local state
    clearFilters() // 2. Clear URL (Effect 1 will skip one cycle)
  }

  const activeCount = [
    filters.search !== '',
    filters.platforms.length > 0,
    filters.tvlUsd !== '',
    filters.volumeUsd1d !== ''
  ].filter(Boolean).length

  return (
    <div className="mb-4 flex flex-col gap-2 p-4 md:flex-row">
      {/* Mobile row: search + toggle */}
      <div className="relative flex flex-1 gap-2">
        <span className="text-muted pointer-events-none absolute top-1/2 left-3 -translate-y-1/2">
          <svg className="h-4 w-4" viewBox="0 0 20 20">
            <path
              fill="currentColor"
              d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9z"
            />
          </svg>
        </span>
        <input
          type="text"
          placeholder="WETH or WETH/USDC"
          value={localFilters.search}
          className="input glass-input input-sm w-full rounded-xl pl-8"
          onChange={(e) => updateLocalFilter('search', e.target.value)}
        />
        <button
          onClick={() => setIsOpen(true)}
          className="btn btn-sm btn-outline btn-glass rounded-xl md:hidden"
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
        className={`
          fixed inset-0 z-40 bg-black/50
          transition-opacity duration-300 md:hidden
          ${isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}
        `}
        onClick={() => setIsOpen(false)}
      />

      {/* Bottom sheet */}
      <div
        className={`
          glass-modal fixed right-0 bottom-0 left-0 z-50 rounded-t-4xl
          transition-transform duration-300 ease-out md:hidden
          ${isOpen ? 'translate-y-0' : 'translate-y-[140%]'}
        `}
      >
        <div className="p-4">
          <div className="bg-base-300 mx-auto mb-4 h-1 w-12 rounded-full" />
          <button
            className="btn btn-sm btn-circle btn-glass absolute top-4 right-4 mb-4 text-sm"
            onClick={() => setIsOpen(false)}
          >
            ✕
          </button>

          {/* Desktop row: dropdown + tvl + vol + clear */}
          <div className="mt-10 p-2 whitespace-nowrap">
            <Dropdown
              selected={filters.platforms}
              onToggle={togglePlatform}
              options={availablePlatforms}
            />
          </div>

          <div className="my-2 flex flex-1 flex-col flex-wrap gap-6 p-2 sm:flex-row sm:gap-4">
            <input
              type="number"
              placeholder="Min TVL ($)"
              value={localFilters.tvlUsd}
              className="input glass-input input-sm w-full rounded-xl sm:flex-1"
              onChange={(e) => updateLocalFilter('tvlUsd', e.target.value)}
            />

            <input
              type="number"
              placeholder="Min Vol 24h ($)"
              value={localFilters.volumeUsd1d}
              className="input glass-input input-sm w-full rounded-xl sm:flex-1"
              onChange={(e) => updateLocalFilter('volumeUsd1d', e.target.value)}
            />

            <button
              onClick={handleClearFilters}
              className="btn btn-sm btn-glass rounded-xl"
            >
              Clear filters
            </button>
          </div>
        </div>
      </div>

      <div className="hidden whitespace-nowrap md:flex">
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
        className="input glass-input input-sm hidden w-36 rounded-xl md:block"
        onChange={(e) => updateLocalFilter('tvlUsd', e.target.value)}
      />
      <input
        type="number"
        placeholder="Min Vol 24h ($)"
        value={localFilters.volumeUsd1d}
        className="input glass-input input-sm hidden w-36 rounded-xl md:block"
        onChange={(e) => updateLocalFilter('volumeUsd1d', e.target.value)}
      />
      <button
        onClick={handleClearFilters}
        className="btn btn-sm btn-glass hidden rounded-xl md:block"
      >
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
