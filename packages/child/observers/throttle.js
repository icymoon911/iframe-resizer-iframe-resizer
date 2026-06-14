import { round } from '../../common/utils'
import { event, info } from '../console'

const DELAY = 16 // Corresponds to 60fps
const DELAY_MARGIN = 2
const DELAY_MAX = 200

/**
 * Create a throttled processor with exponential backoff.
 * Returns { schedule, reset } — schedule queues work, reset clears state.
 */
// eslint-disable-next-line import/prefer-default-export
export function createThrottledProcessor(processFn, options = {}) {
  const {
    delay = DELAY,
    delayMargin = DELAY_MARGIN,
    delayMax = DELAY_MAX,
  } = options

  let delayCount = 1
  let pending = false
  let perfMon = 0

  function process() {
    const now = performance.now()
    const elapsed = now - perfMon
    const delayLimit = delay * delayCount++ + delayMargin

    // Back off if the callStack is busy with other stuff
    if (elapsed > delayLimit && elapsed < delayMax) {
      event('mutationThrottled')
      info('Update delayed due to heavy workload on the callStack')
      info(
        `EventLoop busy time: %c${round(elapsed)}ms %c> Max wait: %c${delayLimit - delayMargin}ms`,
      )
      setTimeout(process, delay * delayCount)
      perfMon = now
      return
    }

    delayCount = 1
    pending = false
    processFn()
  }

  function schedule() {
    if (pending) return
    perfMon = performance.now()
    pending = true
    requestAnimationFrame(process)
  }

  function reset() {
    delayCount = 1
    pending = false
    perfMon = 0
  }

  return { schedule, reset }
}
