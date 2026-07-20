import { ReactNode, useEffect, useRef, useState } from 'react'

interface Options {
  value: string
  display: string
}

interface DropdownProps {
  selected: string[]
  onToggle: (value: string) => void
  options: Options[]
}

/**
 * UI: Multi-select Filter Dropdown.
 *
 * Implementation Note: Uses manual click-outside detection instead of DaisyUI's
 * built-in dropdown behavior due to bugs with controlled checkboxes in v3.x
 * (automatic state management conflicts with React state).
 *
 * @param props
 * @param props.selected - Array of currently selected option values
 * @param props.onToggle - Callback function triggered when an option is checked/unchecked
 * @param props.options - List of available options to display
 * @returns The rendered dropdown component
 */
export function Dropdown({ selected, onToggle, options }: DropdownProps): ReactNode {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  // Event Management: Detection of interactions outside the component boundaries
  useEffect(() => {
    function handleClickOutside(e: MouseEvent): void {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    // We use "mousedown" for faster response and to capture the intent before focus shifts
    document.addEventListener('mousedown', handleClickOutside)

    // Cleanup: Prevents memory leaks when the component unmounts
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div
      className="relative"
      ref={dropdownRef}
    >
      {/* Trigger: Toggle button with dynamic label based on selection state */}
      <button
        type="button"
        className="btn btn-sm glass-input w-full justify-between rounded-xl"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {selected.length > 0 ? `Selected (${selected.length})` : 'All Platforms'}
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Menu: Floating list of checkboxes */}
      {isOpen && (
        <ul className="menu glass-overlay absolute z-20 mt-2 w-52 rounded-2xl p-2">
          {options.map((option) => (
            <li key={option.value}>
              <label className="label cursor-pointer rounded-xl">
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
