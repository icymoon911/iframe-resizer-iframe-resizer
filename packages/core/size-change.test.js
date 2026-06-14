import { calculateDirection, createSizeStableScheduler } from './size-change'

describe('calculateDirection', () => {
  test('returns "unchanged" when both height and width are the same', () => {
    expect(calculateDirection(100, 100, 200, 200)).toBe('unchanged')
  })

  test('returns "expanded" when height increases', () => {
    expect(calculateDirection(100, 200, 200, 200)).toBe('expanded')
  })

  test('returns "expanded" when width increases', () => {
    expect(calculateDirection(100, 100, 200, 300)).toBe('expanded')
  })

  test('returns "collapsed" when height decreases', () => {
    expect(calculateDirection(200, 100, 200, 200)).toBe('collapsed')
  })

  test('returns "collapsed" when width decreases', () => {
    expect(calculateDirection(100, 100, 300, 200)).toBe('collapsed')
  })

  test('returns "expanded" when net delta is positive (height grows more than width shrinks)', () => {
    // height: +100, width: -50 => net +50
    expect(calculateDirection(100, 200, 200, 150)).toBe('expanded')
  })

  test('returns "collapsed" when net delta is negative (height shrinks more than width grows)', () => {
    // height: -100, width: +50 => net -50
    expect(calculateDirection(200, 100, 100, 150)).toBe('collapsed')
  })

  test('returns "unchanged" when deltas cancel out exactly', () => {
    // height: +50, width: -50 => net 0
    expect(calculateDirection(100, 150, 200, 150)).toBe('unchanged')
  })

  test('handles zero dimensions', () => {
    expect(calculateDirection(0, 100, 0, 100)).toBe('expanded')
    expect(calculateDirection(100, 0, 100, 0)).toBe('collapsed')
    expect(calculateDirection(0, 0, 0, 0)).toBe('unchanged')
  })
})

describe('createSizeStableScheduler', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('fires callback after the specified delay', () => {
    const scheduler = createSizeStableScheduler()
    const callback = jest.fn()

    scheduler.schedule(callback, 200)

    expect(callback).not.toHaveBeenCalled()
    jest.advanceTimersByTime(199)
    expect(callback).not.toHaveBeenCalled()
    jest.advanceTimersByTime(1)
    expect(callback).toHaveBeenCalledTimes(1)
  })

  test('debounces: resets timer on subsequent schedule calls', () => {
    const scheduler = createSizeStableScheduler()
    const callback = jest.fn()

    scheduler.schedule(callback, 200)
    jest.advanceTimersByTime(100)

    // Second call resets the timer
    scheduler.schedule(callback, 200)
    jest.advanceTimersByTime(100)

    // Total 200ms elapsed but only 100ms since last schedule
    expect(callback).not.toHaveBeenCalled()

    jest.advanceTimersByTime(100)
    expect(callback).toHaveBeenCalledTimes(1)
  })

  test('cancel prevents the callback from firing', () => {
    const scheduler = createSizeStableScheduler()
    const callback = jest.fn()

    scheduler.schedule(callback, 200)
    scheduler.cancel()

    jest.advanceTimersByTime(500)
    expect(callback).not.toHaveBeenCalled()
  })

  test('pending reflects whether a timer is active', () => {
    const scheduler = createSizeStableScheduler()
    const callback = jest.fn()

    expect(scheduler.pending).toBe(false)

    scheduler.schedule(callback, 200)
    expect(scheduler.pending).toBe(true)

    jest.advanceTimersByTime(200)
    expect(scheduler.pending).toBe(false)
  })

  test('multiple rapid schedules result in a single callback invocation', () => {
    const scheduler = createSizeStableScheduler()
    const callback = jest.fn()

    scheduler.schedule(callback, 200)
    scheduler.schedule(callback, 200)
    scheduler.schedule(callback, 200)
    scheduler.schedule(callback, 200)

    jest.advanceTimersByTime(200)
    expect(callback).toHaveBeenCalledTimes(1)
  })
})
