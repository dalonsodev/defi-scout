export default function Dropdown({ selected, onToggle, options }) {
   function renderOptions(selected, onToggle) {
      const optionsList = options.map(option => (
         <li key={option.value}>
            <label className="label cursor-pointer">
               <input 
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  checked={selected.includes(option.value)}
                  onChange={() => onToggle(option.value)}
               />
               <span className="label-text ml-2">{option.display}</span>
            </label>
         </li>
      ))

      return (
         <ul
            className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52"
            tabIndex="0"
         >
            {optionsList}
         </ul>
      )
   }

   return (
      <div className="dropdown">
         <label 
            tabIndex={0} 
            className="btn btn-sm w-full justify-between"
            onClick={(e) => e.stopPropagation()}
         >
            {selected.length > 0 ? `Selected (${selected.length})` : "All Platforms"}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
         </label>
         {renderOptions(selected, onToggle)}
      </div>
   )
}