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
