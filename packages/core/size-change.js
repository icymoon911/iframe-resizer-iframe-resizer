/**
 * Compute the direction of an iframe size change.
 *
 * @param {number} oldHeight - Previous height in px
 * @param {number} newHeight - New height in px
 * @param {number} oldWidth  - Previous width in px
 * @param {number} newWidth  - New width in px
 * @returns {'expanded'|'collapsed'|'unchanged'}
 */
export function computeDirection(oldHeight, newHeight, oldWidth, newWidth) {
  const heightIncreased = newHeight > oldHeight
  const widthIncreased = newWidth > oldWidth
  const heightDecreased = newHeight < oldHeight
  const widthDecreased = newWidth < oldWidth

  if (heightIncreased || widthIncreased) return 'expanded'
  if (heightDecreased || widthDecreased) return 'collapsed'
  return 'unchanged'
}

/**
 * Create a debounced "stable" timer. Each call to `notify(data)` cancels any
 * pending timer and starts a new one. The `onStable` callback fires once
 * `delay` ms have elapsed without another call.
 *
 * Returns `{ notify, cancel }` so callers can trigger or abort the timer.
 */
export function createStableTimer(delay, onStable) {
  let timerId = null

  function notify(data) {
    if (timerId) clearTimeout(timerId)

    timerId = setTimeout(() => {
      timerId = null
      onStable(data)
    }, delay)
  }

  function cancel() {
    if (timerId) {
      clearTimeout(timerId)
      timerId = null
    }
  }

  return { notify, cancel }
}
