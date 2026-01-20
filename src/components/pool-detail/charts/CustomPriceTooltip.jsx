import { CHART_COLORS } from "../../../constants/chartColors"

export function CustomPriceTooltip({ 
   active, 
   payload, 
   label, 
   tokenSymbols, 
   selectedTokenIdx 
}) {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  const entry = payload[0]
  const selectedSymbol = tokenSymbols[selectedTokenIdx]
  const oppositeSymbol = tokenSymbols[selectedTokenIdx === 0 ? 1 : 0]
  
  // Formatear precio según magnitud
  const price = entry.value
  const formattedPrice = price < 1 ? price.toFixed(8) : price.toFixed(2)

  return (
    <div 
      className="rounded-lg p-3 shadow-lg border"
      style={{
        backgroundColor: CHART_COLORS.tooltip.bg,
        borderColor: CHART_COLORS.tooltip.border,
        color: CHART_COLORS.tooltip.text,
      }}
    >
      <p className="font-semibold mb-2">{label}</p>
      
      <div className="flex items-center gap-2">
        <div 
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: entry.color }}
        />
        <div>
          <span className="text-sm font-semibold">{formattedPrice}</span>
          <span className="text-xs text-base-content/70 ml-1">
            {selectedSymbol} per {oppositeSymbol}
          </span>
        </div>
      </div>
    </div>
  );
}