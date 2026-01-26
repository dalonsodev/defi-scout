import { useState, useRef, useEffect } from "react"

/**
 * UI: Multi-select Filter Dropdown.
 * 
 * Implementation Note: Uses manual click-outside detection instead of DaisyUI's
 * built-in dropdown behavior due to bugs with controlled checkboxes in v3.x
 * (automatic state management conflicts with React state).
 * 
 * @param {Object} props
 * @param {string[]} props.selected - Array of currently selected option values
 * @param {Function} props.onToggle - Callback function triggered when an option is checked/unchecked
 * @param {Array<{value: string, display: string}>} props.options - List of available options to display
 * @returns {JSX.Element} The rendered dropdown component
 */
export function Dropdown({ selected, onToggle, options }) {
   const [isOpen, setIsOpen] = useState(false)
   const dropdownRef = useRef(null)

   // Event Management: Detection of interactions outside the component boundaries
   useEffect(() => {
      function handleClickOutside(e) {
         if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
            setIsOpen(false)
         }
      }
      // We use "mousedown" for faster response and to capture the intent before focus shifts
      document.addEventListener("mousedown", handleClickOutside)

      // Cleanup: Prevents memory leaks when the component unmounts
      return () => document.removeEventListener("mousedown", handleClickOutside)
   }, [])

   return (
      <div className="relative" ref={dropdownRef}>
         {/* Trigger: Toggle button with dynamic label based on selection state */}
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

         {/* Menu: Floating list of checkboxes */}
         {isOpen && (
            <ul className="absolute z-20 mt-2 menu p-2 shadow bg-base-100 rounded-3xl w-52">
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
