import { useState, useCallback } from 'react'

const TOAST_DURATION = 4000 // 4 seconds

export function useToast() {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((type = 'success', message = '', duration = TOAST_DURATION) => {
    const id = Math.random().toString(36).substring(7)
    const newToast = { id, type, message }

    setToasts((prev) => [...prev, newToast])

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const showSuccess = useCallback((message) => addToast('success', message), [addToast])
  const showError = useCallback((message) => addToast('error', message), [addToast])
  const showInfo = useCallback((message) => addToast('info', message), [addToast])

  return {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showInfo,
  }
}
