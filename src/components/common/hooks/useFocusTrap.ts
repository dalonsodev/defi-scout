import { useRef, useEffect, RefObject } from 'react'

const FOCUSABLE_SELECTOR = 'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Traps keyboard focus within a modal. Handles Tab/Shift+Tab cycling.
 * Escape to close, and restores focus to the trigger element on close.
 *
 * @param modalRef - Ref of container element to trap focus within
 * @param isOpen - Whether the focus trap is currently active
 * @param onClose - Callback function executed to close the modal (e.g. when pressing 'Escape')
 */
export function useFocusTrap(modalRef: RefObject<HTMLElement | null>, isOpen: boolean, onClose: () => void): void {
  const savedFocusRef = useRef<Element | null>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (isOpen) {
      savedFocusRef.current = document.activeElement

      const focusableElements = [...(modalRef.current as HTMLElement).querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)]
      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (focusableElements.length) {
        focusableElements[0].focus()
      }

      const handleKeyDown = (e: KeyboardEvent) => {
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
        document.removeEventListener('keydown', handleKeyDown);
        (savedFocusRef.current as HTMLElement)?.focus()
      }
    }
  }, [isOpen, modalRef])
}

