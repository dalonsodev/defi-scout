import { useRef, useEffect } from 'react'

const FOCUSABLE_SELECTOR = 'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Traps keyboard focus within a modal. Handles Tab/Shift+Tab cycling.
 * Escape to close, and restores focus to the trigger element on close.
 *
 * @param {React.RefObject<HTMLElement>} modalRef - Ref of container element to trap focus within
 * @param {boolean} isOpen - Whether the focus trap is currently active
 * @param {function(): void} onClose - Callback function executed to close the modal (e.g. when pressing 'Escape')
 */
export function useFocusTrap(modalRef, isOpen, onClose) {
  const savedFocusRef = useRef(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (isOpen) {
      savedFocusRef.current = document.activeElement

      const focusableElements = [...modalRef.current.querySelectorAll(FOCUSABLE_SELECTOR)]
      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (focusableElements.length) {
        focusableElements[0].focus()
      }

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onCloseRef.current()

        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement.focus()
              e.preventDefault()
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement.focus()
              e.preventDefault()
            }
          }
        }
      }
      document.addEventListener('keydown', handleKeyDown)

      return () => {
        document.removeEventListener('keydown', handleKeyDown)
        savedFocusRef.current?.focus()
      }
    }
  }, [isOpen, modalRef])
}

