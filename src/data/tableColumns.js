/**
 * @typedef {Object} ColumnMeta
 * @property {"both" | "desktop" | "mobile"} showOn - Determines device visibility for the column
 * @property {string} [tooltip] - Tooltip text to be shown on table header cells
 * @property {boolean} [isSticky] - Indicates if column should remain fixed during horizontal scrolling
 */

/**
 * @typedef {Object} TableColumn
 * @property {string} [accessorKey] - Data key used to retrieve value for this column
 * @property {string} [id] - Unique identifier for column (required if accessorKey not provided)
 * @property {string} header - Display text for column header
 * @property {ColumnMeta} meta - Additional metadata for UI configuration and visibility logic
 */

/**
 * Base column configuration for pools table.
 * Defines structure, visibility, and behavior for each data field.
 * @type {TableColumn[]}
 */
export const baseColumns = [
  {
    accessorKey: 'name',
    size: 160,
    header: 'Pool',
    meta: { showOn: 'both', isSticky: true }
  },
  {
    accessorKey: 'apyBase',
    header: 'APY',
    meta: {
      showOn: 'both',
      tooltip: "Annualized Yield based on generated fees in the last 24h"
    }
  },
  {
    accessorKey: 'tvlUsd',
    header: 'TVL',
    meta: {
      showOn: 'both',
      tooltip: "Total Value Locked - Total liquidity accumulated in the pool"
    }
  },
  {
    accessorKey: 'volumeUsd1d',
    header: 'Vol (24h)',
    meta: {
      showOn: 'both',
      tooltip: "Total swap volume for the pool in the last 24 hours"
    }
  },
  {
    accessorKey: 'sparklineIn7d',
    header: 'APY (14d)',
    meta: { showOn: 'both' }
  },
  {
    accessorKey: 'chain',
    header: 'Chain',
    meta: { showOn: 'desktop' }
  },
  {
    id: 'platformIconOnly',
    header: 'DEX',
    meta: { showOn: 'mobile' }
  },
  {
    accessorKey: 'platformName',
    header: 'Platform',
    meta: { showOn: 'desktop' }
  }
]
