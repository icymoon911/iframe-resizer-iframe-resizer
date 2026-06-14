import { computeDirection, createStableTimer } from './size-change'

describe('computeDirection', () => {
  test('returns "expanded" when height increases', () => {
    expect(computeDirection(100, 200, 50, 50)).toBe('expanded')
  })

  test('returns "expanded" when width increases', () => {
    expect(computeDirection(100, 100, 50, 80)).toBe('expanded')
  })

  test('returns "expanded" when both height and width increase', () => {
    expect(computeDirection(100, 200, 50, 80)).toBe('expanded')
  })

  test('returns "collapsed" when height decreases', () => {
    expect(computeDirection(200, 100, 50, 50)).toBe('collapsed')
  })

  test('returns "collapsed" when width decreases', () => {
    expect(computeDirection(100, 100, 80, 50)).toBe('collapsed')
  })

  test('returns "collapsed" when both height and width decrease', () => {
    expect(computeDirection(200, 100, 80, 50)).toBe('collapsed')
  })

  test('returns "unchanged" when dimensions are identical', () => {
    expect(computeDirection(100, 100, 50, 50)).toBe('unchanged')
  })

  test('returns "expanded" when height increases and width decreases', () => {
    // expansion wins over collapse when mixed
    expect(computeDirection(100, 200, 80, 50)).toBe('expanded')
  })

  test('returns "collapsed" when height decreases and width decreases', () => {
    expect(computeDirection(200, 100, 80, 50)).toBe('collapsed')
  })

  test('handles zero values correctly', () => {
    expect(computeDirection(0, 100, 0, 50)).toBe('expanded')
    expect(computeDirection(100, 0, 50, 0)).toBe('collapsed')
    expect(computeDirection(0, 0, 0, 0)).toBe('unchanged')
  })
})

describe('createStableTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  test('fires onStable after the specified delay', () => {
    const onStable = jest.fn()
    const timer = createStableTimer(200, onStable)

    timer.notify({ height: 100 })
    expect(onStable).not.toHaveBeenCalled()

    jest.advanceTimersByTime(199)
    expect(onStable).not.toHaveBeenCalled()

    jest.advanceTimersByTime(1)
    expect(onStable).toHaveBeenCalledTimes(1)
    expect(onStable).toHaveBeenCalledWith({ height: 100 })
  })

  test('debounces: rapid calls only fire once after the last call', () => {
    const onStable = jest.fn()
    const timer = createStableTimer(200, onStable)

    timer.notify({ height: 100 })
    jest.advanceTimersByTime(100)
    timer.notify({ height: 150 })
    jest.advanceTimersByTime(100)
    timer.notify({ height: 200 })

    // 200ms have passed since first call, but last call was only 0ms ago
    expect(onStable).not.toHaveBeenCalled()

    jest.advanceTimersByTime(200)
    expect(onStable).toHaveBeenCalledTimes(1)
    // Should fire with the latest data
    expect(onStable).toHaveBeenCalledWith({ height: 200 })
  })

  test('cancel prevents the callback from firing', () => {
    const onStable = jest.fn()
    const timer = createStableTimer(200, onStable)

    timer.notify({ height: 100 })
    timer.cancel()

    jest.advanceTimersByTime(300)
    expect(onStable).not.toHaveBeenCalled()
  })

  test('cancel is a no-op if no timer is pending', () => {
    const onStable = jest.fn()
    const timer = createStableTimer(200, onStable)

    // Should not throw
    expect(() => timer.cancel()).not.toThrow()
  })

  test('timer can be re-armed after firing', () => {
    const onStable = jest.fn()
    const timer = createStableTimer(200, onStable)

    timer.notify({ height: 100 })
    jest.advanceTimersByTime(200)
    expect(onStable).toHaveBeenCalledTimes(1)

    timer.notify({ height: 200 })
    jest.advanceTimersByTime(200)
    expect(onStable).toHaveBeenCalledTimes(2)
    expect(onStable).toHaveBeenLastCalledWith({ height: 200 })
  })

  test('cancel after fire is a no-op', () => {
    const onStable = jest.fn()
    const timer = createStableTimer(100, onStable)

    timer.notify({ height: 50 })
    jest.advanceTimersByTime(100)
    expect(onStable).toHaveBeenCalledTimes(1)

    // Cancel after fire should not throw or affect anything
    expect(() => timer.cancel()).not.toThrow()
  })
})
