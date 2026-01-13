export function CalculatorInputs({ 
   inputs, 
   onChange, 
   currentPrice,
   priceLabel,
   token0Symbol, 
   token1Symbol,
   token0PriceUSD,
   token1PriceUSD
   }) {
   const priceNum = Number(currentPrice)
      
   // Token amounts based on 50/50 split
   const token0Amount = token0PriceUSD > 0
      ? (inputs.capitalUSD / 2) / token0PriceUSD
      : 0

   const token1Amount = token1PriceUSD > 0
      ? (inputs.capitalUSD / 2) / token1PriceUSD
      : 0

   return (
      <div>
         {/* Deposit Amount */}
         <div className="mb-6">
         <label className="block text-sm font-semibold mb-2">Deposit Amount</label>
         <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-base-content/60">$</span>
            <input
               type="number"
               value={inputs.capitalUSD}
               onChange={(e) => onChange('capitalUSD', Number(e.target.value))}
               className="input input-lg w-full pl-10 text-2xl font-bold bg-base-300"
               min="0"
            />
         </div>

         {/* Token breakdown */}
         <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
               <span className="flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-primary"></span>
               {token0Symbol}:
               </span>
               <span>
               {token0Amount > 0 ? token0Amount.toFixed(5) : "N/A"} 
               <span className="text-base-content/60 ml-2">${(inputs.capitalUSD / 2).toFixed(2)}</span>
               </span>
            </div>
            <div className="flex items-center justify-between text-sm">
               <span className="flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-secondary"></span>
               {token1Symbol}:
               </span>
               <span>
               {token1Amount > 0 ? token1Amount.toFixed(5) : "N/A"}
               <span className="text-base-content/60 ml-2">${(inputs.capitalUSD / 2).toFixed(2)}</span>
               </span>
            </div>
         </div>
         </div>

         {/* Price Range */}
         <div className="mb-6">
         <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-semibold">Price Range</label>
            <label className="flex items-center gap-2 cursor-pointer">
               <span className="text-sm">Full Range:</span>
               <input
               type="checkbox"
               checked={inputs.fullRange}
               onChange={(e) => onChange('fullRange', e.target.checked)}
               className="toggle toggle-sm"
               />
            </label>
         </div>

         {/* Min/Max inputs (disabled if fullRange) */}
         <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
               <label className="block text-xs text-base-content/60 mb-1">Min Price</label>
               <input
                  type="number"
                  value={inputs.minPrice}
                  onChange={(e) => onChange('minPrice', e.target.value)}
                  disabled={inputs.fullRange}
                  placeholder="0"
                  className="input input-sm w-full bg-base-300"
                  step="0.0001"
               />
               <p className="text-xs text-base-content/50 mt-1">
                  {priceLabel}
               </p>
            </div>
            <div>
               <label className="block text-xs text-base-content/60 mb-1">Max Price</label>
               <input
                  type="number"
                  value={inputs.maxPrice}
                  onChange={(e) => onChange('maxPrice', e.target.value)}
                  disabled={inputs.fullRange}
                  placeholder="∞"
                  className="input input-sm w-full bg-base-300"
                  step="0.0001"
               />
               <p className="text-xs text-base-content/50 mt-1">
                  {priceLabel}
               </p>
            </div>
         </div>

         {/* Most Active Price - usar priceNum */}
         <div className="bg-base-300 rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
               <span className="text-xs text-base-content/60">Most Active Price Assumption</span>
               <button className="btn btn-circle btn-xs">?</button>
            </div>
            <p className="text-sm font-mono">{priceNum.toFixed(8)}</p>
            <p className="text-xs text-base-content/50">{priceLabel}</p>
         </div>
         </div>

         {/* Create Position Button */}
         <button className="btn btn-primary w-full">
            Create Position on Uniswap →
         </button>
      </div>
   )
}