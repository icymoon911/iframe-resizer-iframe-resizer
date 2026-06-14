import { isHidden } from './overflow'
import { isElementNode } from './utils'

// overflow.js imports from ../console; stub it so the module loads cleanly.
jest.mock('../console', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
  event: jest.fn(),
}))

describe('isHidden', () => {
  let node

  beforeEach(() => {
    node = document.createElement('div')
    document.body.append(node)
  })

  afterEach(() => {
    node.remove()
  })

  test('returns false for a normal visible element', () => {
    // jsdom returns offsetParent=null for ALL elements (no layout engine),
    // so getComputedStyle is used as fallback. It must report display:block
    // (the CSS default for <div>) and the element must be classified visible.
    expect(isHidden(node)).toBe(false)
  })

  test('returns true when the hidden attribute is set', () => {
    node.hidden = true
    expect(isHidden(node)).toBe(true)
  })

  test('returns true when inline style is display:none', () => {
    node.style.display = 'none'
    expect(isHidden(node)).toBe(true)
  })

  test('returns false for a position:fixed element (offsetParent is null)', () => {
    node.style.position = 'fixed'
    // jsdom always returns null for offsetParent, so the getComputedStyle
    // fallback is exercised here — it must read position:fixed and say visible.
    expect(isHidden(node)).toBe(false)
  })

  test('returns false for a position:sticky element (offsetParent is null)', () => {
    node.style.position = 'sticky'
    expect(isHidden(node)).toBe(false)
  })

  test('returns true when display:none is applied via computed style (no inline)', () => {
    // No inline display:none — we want the offsetParent + getComputedStyle
    // branch to fire, then getComputedStyle to report display:none.
    const spy = jest
      .spyOn(window, 'getComputedStyle')
      .mockReturnValue({ position: 'static', display: 'none' })

    expect(isHidden(node)).toBe(true)
    spy.mockRestore()
  })

  test('returns true for element with static position, no inline style, and null offsetParent', () => {
    // Simulates a genuinely hidden element where offsetParent is null and
    // getComputedStyle confirms it is not fixed/sticky and is display:none.
    const spy = jest
      .spyOn(window, 'getComputedStyle')
      .mockReturnValue({ position: 'static', display: 'none' })

    expect(isHidden(node)).toBe(true)
    spy.mockRestore()
  })

  test('returns true for position:relative element that is display:none via CSS', () => {
    // offsetParent may be null (jsdom) or non-null (real browser with
    // display:none). Either path should reach getComputedStyle.display.
    const spy = jest
      .spyOn(window, 'getComputedStyle')
      .mockReturnValue({ position: 'relative', display: 'none' })

    expect(isHidden(node)).toBe(true)
    spy.mockRestore()
  })
})

describe('isElementNode', () => {
  test('returns true for an element node', () => {
    expect(isElementNode(document.createElement('div'))).toBe(true)
  })

  test('returns true for any HTML element', () => {
    expect(isElementNode(document.createElement('span'))).toBe(true)
    expect(isElementNode(document.createElement('iframe'))).toBe(true)
  })

  test('returns false for a text node', () => {
    expect(isElementNode(document.createTextNode('hello'))).toBe(false)
  })

  test('returns false for a comment node', () => {
    expect(isElementNode(document.createComment('c'))).toBe(false)
  })

  test('returns false for a document fragment', () => {
    expect(isElementNode(document.createDocumentFragment())).toBe(false)
  })
})
