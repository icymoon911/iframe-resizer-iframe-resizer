import { isElementNode } from './utils'

describe('isElementNode', () => {
  test('returns true for element nodes', () => {
    const div = document.createElement('div')
    expect(isElementNode(div)).toBe(true)
  })

  test('returns true for various HTML elements', () => {
    expect(isElementNode(document.createElement('span'))).toBe(true)
    expect(isElementNode(document.createElement('nav'))).toBe(true)
    expect(isElementNode(document.createElement('section'))).toBe(true)
  })

  test('returns false for text nodes', () => {
    const textNode = document.createTextNode('hello')
    expect(isElementNode(textNode)).toBe(false)
  })

  test('returns false for comment nodes', () => {
    const comment = document.createComment('a comment')
    expect(isElementNode(comment)).toBe(false)
  })

  test('returns false for document fragment nodes', () => {
    const fragment = document.createDocumentFragment()
    expect(isElementNode(fragment)).toBe(false)
  })
})
