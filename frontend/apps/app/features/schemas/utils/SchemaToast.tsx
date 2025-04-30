import styles from './SchemaToast.module.css'

/**
 * Possible toast notification types
 */
export type ToastType = 'success' | 'error' | 'info'

/**
 * Shows a toast notification for schema modifications
 * @param message - The message to display
 * @param type - The type of notification (success, error, info)
 */
export function showSchemaToast(
  message: string,
  type: ToastType = 'info',
): void {
  // Get or create toast container
  let toastContainer = document.getElementById('schema-toast-container')
  if (!toastContainer) {
    toastContainer = document.createElement('div')
    toastContainer.id = 'schema-toast-container'
    toastContainer.className = styles.toastContainer
    document.body.appendChild(toastContainer)
  }

  // Create toast element
  const toast = document.createElement('div')
  toast.className = `${styles.toast} ${styles[type]}`
  toast.textContent = message

  // Add toast to container
  toastContainer.appendChild(toast)

  // Auto-remove after delay
  setTimeout(() => {
    toast.classList.add(styles.fadeOut)
    setTimeout(() => {
      if (toastContainer.contains(toast)) {
        toastContainer.removeChild(toast)
      }
      // Remove container if empty
      if (toastContainer.childNodes.length === 0) {
        document.body.removeChild(toastContainer)
      }
    }, 300) // Allow time for fade out animation
  }, 3000) // Show for 3 seconds
}
