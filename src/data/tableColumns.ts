export interface ColumnMeta {
  showOn: 'both' | 'desktop' | 'mobile'
  tooltip?: string
  isSticky?: boolean
}

interface TableColumn {
  header: string
  meta: ColumnMeta
  accessorKey?: string
  size?: number
  /** Required if accessorKey not provided */
  id?: string
}

/**
 * Base column configuration for pools table.
 * Defines structure, visibility, and behavior for each data field.
 */
export const baseColumns: TableColumn[] = [
  {
    accessorKey: 'name',
    header: 'Pool',
    size: 160,
    meta: { showOn: 'both', isSticky: true }
  },
  {
    accessorKey: 'apyBase',
    header: 'APY',
    size: 100,
    meta: {
      showOn: 'both',
      tooltip: 'Annualized Yield based on generated fees in the last 24h'
    }
  },
  {
    accessorKey: 'tvlUsd',
    header: 'TVL',
    size: 130,
    meta: {
      showOn: 'both',
      tooltip: 'Total Value Locked - Total liquidity accumulated in the pool'
    }
  },
  {
    accessorKey: 'volumeUsd1d',
    header: 'Vol (24h)',
    size: 130,
    meta: {
      showOn: 'both',
      tooltip: 'Total swap volume for the pool in the last 24 hours'
    }
  },
  {
    accessorKey: 'sparklineIn7d',
    header: 'APY (14d)',
    size: 130,
    meta: { showOn: 'both' }
  },
  {
    accessorKey: 'chain',
    header: 'Chain',
    size: 110,
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
    size: 160,
    meta: { showOn: 'desktop' }
  }
]
