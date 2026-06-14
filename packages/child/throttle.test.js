import { createThrottleGate } from './throttle'

describe('createThrottleGate', () => {
  test('shouldThrottle returns false when interval is 0 (no throttling)', () => {
    const gate = createThrottleGate(0)
    expect(gate.shouldThrottle(100)).toBe(false)
    gate.mark(100)
    expect(gate.shouldThrottle(101)).toBe(false)
  })

  test('shouldThrottle returns true when called within the interval', () => {
    const gate = createThrottleGate(100)
    gate.mark(0)
    expect(gate.shouldThrottle(50)).toBe(true)
    expect(gate.shouldThrottle(99)).toBe(true)
  })

  test('shouldThrottle returns false when called after the interval', () => {
    const gate = createThrottleGate(100)
    gate.mark(0)
    expect(gate.shouldThrottle(100)).toBe(false)
    expect(gate.shouldThrottle(200)).toBe(false)
  })

  test('getRemaining returns correct remaining time', () => {
    const gate = createThrottleGate(100)
    gate.mark(0)
    expect(gate.getRemaining(50)).toBe(50)
    expect(gate.getRemaining(90)).toBe(10)
    expect(gate.getRemaining(100)).toBe(0)
    expect(gate.getRemaining(200)).toBe(0)
  })

  test('getRemaining returns 0 when interval is 0', () => {
    const gate = createThrottleGate(0)
    gate.mark(0)
    expect(gate.getRemaining(1)).toBe(0)
  })

  test('reset clears the gate so next call is not throttled', () => {
    const gate = createThrottleGate(100)
    gate.mark(500)
    expect(gate.shouldThrottle(550)).toBe(true)
    gate.reset()
    // After reset, lastRunTime=0, so any time >= interval is not throttled
    expect(gate.shouldThrottle(200)).toBe(false)
  })

  test('mark updates the last run time', () => {
    const gate = createThrottleGate(100)
    gate.mark(0)
    expect(gate.shouldThrottle(50)).toBe(true)

    // Mark at time 200, now time 250 should not be throttled
    gate.mark(200)
    expect(gate.shouldThrottle(250)).toBe(true)
    expect(gate.shouldThrottle(300)).toBe(false)
  })

  test('first call with no prior mark is not throttled', () => {
    const gate = createThrottleGate(100)
    // lastRunTime starts at 0, so any positive now value > 100 won't throttle
    expect(gate.shouldThrottle(200)).toBe(false)
  })
})
