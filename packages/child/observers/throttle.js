import { FOREGROUND, HIGHLIGHT } from 'auto-console-group'

import { round } from '../../common/utils'
import { event, info } from '../console'

const DEFAULT_DELAY = 16 // Corresponds to 60fps
const DEFAULT_MARGIN = 2
const DEFAULT_MAX = 200

/**
 * Creates a backoff throttle that delays execution when the event loop
 * is busy. If the measured delay exceeds the expected limit (but stays
 * below a max), the call is rescheduled with exponential backoff.
 *
 * @param {Function} fn - The function to throttle
 * @param {Object} [options]
 * @param {number} [options.delay=16] - Base delay in ms (one frame at 60fps)
 * @param {number} [options.margin=2] - Extra margin added to delay limit
 * @param {number} [options.max=200] - Max delay before forcing execution
 * @returns {Function} throttledProcess - Call to schedule fn
 */
export default function createBackoffThrottle(fn, options = {}) {
  const {
    delay = DEFAULT_DELAY,
    margin = DEFAULT_MARGIN,
    max = DEFAULT_MAX,
  } = options

  let delayCount = 1
  let pending = false
  let perfMon = 0
  let throttledProcess

  function process() {
    const now = performance.now()
    const elapsed = now - perfMon
    const delayLimit = delay * delayCount++ + margin

    // Back off if the callStack is busy with other stuff
    if (elapsed > delayLimit && elapsed < max) {
      event('mutationThrottled')
      info('Update delayed due to heavy workload on the callStack')
      info(
        `EventLoop busy time: %c${round(elapsed)}ms %c> Max wait: %c${delayLimit - margin}ms`,
        HIGHLIGHT,
        FOREGROUND,
        HIGHLIGHT,
      )
      setTimeout(throttledProcess, delay * delayCount)
      perfMon = now
      return
    }

    delayCount = 1
    pending = false
    fn()
  }

  throttledProcess = function () {
    if (pending) return

    perfMon = performance.now()
    pending = true
    requestAnimationFrame(process)
  }

  return throttledProcess
}
