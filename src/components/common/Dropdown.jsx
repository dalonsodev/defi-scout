import { useState, useRef, useEffect } from "react"

export default function Dropdown({ selected, onToggle, options }) {
   const [isOpen, setIsOpen] = useState(false)
   const dropdownRef = useRef(null)

   useEffect(() => {
      function handleClickOutside(e) {
         if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
            setIsOpen(false)
         }
      }
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
   }, [])

   return (
      <div className="relative" ref={dropdownRef}>
         <button
            type="button"
            className="btn btn-sm w-full justify-between rounded-xl"
            onClick={() => setIsOpen(!isOpen)}
         >
            {selected.length > 0 ? `Selected (${selected.length})` : "All Platforms"}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
         </button>

         {isOpen && (
            <ul className="absolute z-10 mt-2 menu p-2 shadow bg-base-100 rounded-3xl w-52">
               {options.map(option => (
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
               ))}
            </ul>
         )}
      </div>
   )
}