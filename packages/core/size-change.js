/**
 * Calculate the direction of a size change.
 *
 * @param {number} oldHeight
 * @param {number} newHeight
 * @param {number} oldWidth
 * @param {number} newWidth
 * @returns {'expanded' | 'collapsed' | 'unchanged'}
 */
export function calculateDirection(oldHeight, newHeight, oldWidth, newWidth) {
  const heightChanged = oldHeight !== newHeight
  const widthChanged = oldWidth !== newWidth

  if (!heightChanged && !widthChanged) {
    return 'unchanged'
  }

  const heightDelta = newHeight - oldHeight
  const widthDelta = newWidth - oldWidth
  const netDelta = heightDelta + widthDelta

  if (netDelta > 0) return 'expanded'
  if (netDelta < 0) return 'collapsed'
  return 'unchanged'
}

/**
 * Create a debounced onSizeStable scheduler for a single iframe.
 * Returns an object with `schedule(callback, delay)` and `cancel()` methods.
 */
export function createSizeStableScheduler() {
  let timer = null

  return {
    schedule(callback, delay) {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        timer = null
        callback()
      }, delay)
    },
    cancel() {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
    },
    get pending() {
      return timer !== null
    },
  }
}
