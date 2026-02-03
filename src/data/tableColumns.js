/**
 * @typedef {Object} ColumnMeta
 * @property {"both" | "desktop" | "mobile"} showOn - Determines device visibility for the column
 * @property {boolean} [isSticky] - Indicates if column should remain fixed during horizontal scrolling
 */

/**
 * @typedef {Object} TableColumn
 * @property {string} [accessorKey] - Data key used to retrieve value for this column
 * @property {string} [id] - Unique identifier for column (required if accessorKey not provided)
 * @property {string} header - Display text for column header
 * @property {ColumnMeta} - meta - Additional metadata for UI configuration and visibility logic
 */

/**
 * Base column configuration for pools table.
 * Defines structure, visibility, and behavior for each data field.
 * @type {TableColumn[]}
 */
export const baseColumns = [
   {
      accessorKey: "name",
      header: "Pool",
      meta: { showOn: "both", isSticky: true }
   },
   {
      accessorKey: "apyBase",
      header: "APY",
      meta: { showOn: "both" }
   },
   {
      accessorKey: "tvlUsd",
      header: "TVL",
      meta: { showOn: "both" }
   },
   {
      accessorKey: "volumeUsd1d",
      header: "Vol (24h)",
      meta: { showOn: "both" }
   },
   {
      accessorKey: "sparklineIn7d",
      header: "APY (7d)",
      meta: { showOn: "both" }
   },
   {
      accessorKey: "chain",
      header: "Chain",
      meta: { showOn: "desktop" }
   },
   {
      id: "platformIconOnly",
      header: "DEX",
      meta: { showOn: "mobile" }
   },
   {
      accessorKey: "platformName",
      header: "Platform",
      meta: { showOn: "desktop" }
   }
]
