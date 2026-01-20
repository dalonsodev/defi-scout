export function TimeLineControl({ days, onDaysChange, daysToBreakEven }) {
   const increment = () => onDaysChange(Math.min(days + 1, 365))
   const decrement = () => onDaysChange(Math.max(days - 1, 0))

   return (
      <div className="form-control">
         <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center gap-2">
               <label className="label">
                  <span className="label-text font-semibold">Days of Active Position</span>
               </label>
               <label className="label">
                  <span className="label-text-alt text-warning text-center text-wrap">
                     {`Position must be active ≥ ${daysToBreakEven.toFixed(2)}d to cover IL`}
                  </span>
               </label>
            </div>

            <div className="flex items-center gap-2">
               <button 
                  type="button"
                  onClick={decrement}
                  className="btn btn-circle btn-sm"
               >
                  −
               </button>
               
               <input 
                  type="number"
                  value={days}
                  onChange={(e) => {
                     const val = parseInt(e.target.value)
                     if (isNaN(val)) {
                        onDaysChange(0)
                     } else {
                        onDaysChange(Math.max(0, Math.min(val, 365)))
                     }
                  }}
                  min="0"
                  max="365"
                  className="input input-bordered text-center" 
                  aria-label="Days of active position."
               />

               <button 
                  type="button"
                  onClick={increment}
                  className="btn btn-circle btn-sm"
               >
                  +
               </button>
            </div>
         </div>
      </div>
   )
}