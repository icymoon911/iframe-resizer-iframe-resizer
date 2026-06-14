import { setsDiffer } from './sets-differ'

describe('setsDiffer', () => {
  describe('returns false (sets are equal)', () => {
    test('two empty sets', () => {
      expect(setsDiffer(new Set(), new Set())).toBe(false)
    })

    test('sets with same primitive values', () => {
      const a = new Set([1, 2, 3])
      const b = new Set([1, 2, 3])
      expect(setsDiffer(a, b)).toBe(false)
    })

    test('sets with same values in different insertion order', () => {
      const a = new Set([1, 2, 3])
      const b = new Set([3, 2, 1])
      expect(setsDiffer(a, b)).toBe(false)
    })

    test('sets with same object references', () => {
      const obj1 = { id: 1 }
      const obj2 = { id: 2 }
      const a = new Set([obj1, obj2])
      const b = new Set([obj2, obj1])
      expect(setsDiffer(a, b)).toBe(false)
    })

    test('sets with same string values', () => {
      const a = new Set(['a', 'b', 'c'])
      const b = new Set(['a', 'b', 'c'])
      expect(setsDiffer(a, b)).toBe(false)
    })
  })

  describe('returns true (sets differ)', () => {
    test('different sizes, one empty', () => {
      const a = new Set([1])
      const b = new Set()
      expect(setsDiffer(a, b)).toBe(true)
      expect(setsDiffer(b, a)).toBe(true)
    })

    test('different sizes, both non-empty', () => {
      const a = new Set([1, 2, 3])
      const b = new Set([1, 2])
      expect(setsDiffer(a, b)).toBe(true)
      expect(setsDiffer(b, a)).toBe(true)
    })

    test('same size but different values', () => {
      const a = new Set([1, 2, 3])
      const b = new Set([1, 2, 4])
      expect(setsDiffer(a, b)).toBe(true)
    })

    test('same size, completely different values', () => {
      const a = new Set([1, 2, 3])
      const b = new Set([4, 5, 6])
      expect(setsDiffer(a, b)).toBe(true)
    })

    test('same size but different object references', () => {
      const a = new Set([{ id: 1 }])
      const b = new Set([{ id: 1 }]) // different reference
      expect(setsDiffer(a, b)).toBe(true)
    })

    test('one set is subset of the other (same size check)', () => {
      const a = new Set([1, 2, 3, 4])
      const b = new Set([1, 2, 3, 5])
      expect(setsDiffer(a, b)).toBe(true)
    })
  })

  describe('Safari 16 fallback behavior', () => {
    test('handles DOM node sets correctly (simulating overflow scenario)', () => {
      const node1 = document.createElement('div')
      const node2 = document.createElement('span')
      const node3 = document.createElement('p')

      const setA = new Set([node1, node2])
      const setB = new Set([node1, node2])
      expect(setsDiffer(setA, setB)).toBe(false)

      const setC = new Set([node1, node3])
      expect(setsDiffer(setA, setC)).toBe(true)
    })

    test('handles adding element to overflow set', () => {
      const node1 = document.createElement('div')
      const node2 = document.createElement('span')

      const prev = new Set([node1])
      const curr = new Set([node1, node2])
      expect(setsDiffer(curr, prev)).toBe(true)
    })

    test('handles removing element from overflow set', () => {
      const node1 = document.createElement('div')
      const node2 = document.createElement('span')

      const prev = new Set([node1, node2])
      const curr = new Set([node1])
      expect(setsDiffer(curr, prev)).toBe(true)
    })

    test('handles unchanged overflow set (no spurious resize)', () => {
      const node1 = document.createElement('div')
      const node2 = document.createElement('span')

      const prev = new Set([node1, node2])
      const curr = new Set([node1, node2])
      // This is the key case: in Safari 16, without this fallback,
      // hasOverflowUpdated would always be true, causing spurious resizes.
      expect(setsDiffer(curr, prev)).toBe(false)
    })
  })
})
