/**
 * Create a throttle gate that limits how frequently an action can run.
 *
 * @param {number} interval - Minimum milliseconds between invocations
 * @returns {{ shouldThrottle: (now: number) => boolean, getRemaining: (now: number) => number, reset: () => void }}
 */
export function createThrottleGate(interval) {
  let lastRunTime = 0

  return {
    /**
     * Returns true if the action should be throttled (skipped/deferred).
     */
    shouldThrottle(now) {
      if (interval <= 0) return false
      return now - lastRunTime < interval
    },

    /**
     * Returns remaining time in ms until the gate opens.
     */
    getRemaining(now) {
      if (interval <= 0) return 0
      return Math.max(0, interval - (now - lastRunTime))
    },

    /**
     * Mark the gate as having just run.
     */
    mark(now) {
      lastRunTime = now
    },

    /**
     * Reset the gate so the next call is not throttled.
     */
    reset() {
      lastRunTime = 0
    },
  }
}
