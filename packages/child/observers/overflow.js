import { HIGHLIGHT } from 'auto-console-group'

import { HEIGHT_EDGE, OVERFLOW_ATTR } from '../../common/consts'
import { id } from '../../common/utils'
import { info } from '../console'
import {
  createDetachObservers,
  createLogCounter,
  createLogNewlyObserved,
  createWarnAlreadyObserved,
  isElementNode,
} from './utils'

const OVERFLOW = 'Overflow'
const logAddOverflow = createLogCounter(OVERFLOW)
const logRemoveOverflow = createLogCounter(OVERFLOW, false)
const logNewlyObserved = createLogNewlyObserved(OVERFLOW)
const warnAlreadyObserved = createWarnAlreadyObserved(OVERFLOW)

export const isHidden = (node) => {
  // The hidden attribute hides the element (UA stylesheet display:none).
  // Checking explicitly for jsdom where getComputedStyle may not reflect it.
  if (node.hidden) return true

  // Inline style check — fast path, avoids getComputedStyle call.
  if (node.style.display === 'none') return true

  // offsetParent is null for display:none elements AND position:fixed/sticky
  // elements (where null is expected and does NOT mean hidden).
  // When offsetParent is null, use getComputedStyle to distinguish them.
  if (node.offsetParent === null) {
    const style = window.getComputedStyle(node)
    if (style.position === 'fixed' || style.position === 'sticky') return false
    return style.display === 'none'
  }

  return false
}

const createOverflowObserver = (callback, options) => {
  const side = options.side || HEIGHT_EDGE
  const observerOptions = {
    root: options.root,
    rootMargin: '0px',
    threshold: 1,
  }

  const afterReflow = window?.requestAnimationFrame || id
  const emitOverflowDetected = (mutated = false) => callback(mutated)

  const isOverflowed = (edge, rootBounds) =>
    edge === 0 || edge > rootBounds[side]

  const setOverflow = (node, hasOverflow) =>
    node.toggleAttribute(OVERFLOW_ATTR, hasOverflow)

  function observation(entries) {
    for (const entry of entries) {
      const { boundingClientRect, rootBounds, target } = entry
      if (!rootBounds) continue // guard
      const edge = boundingClientRect[side]
      const hasOverflow = isOverflowed(edge, rootBounds) && !isHidden(target)

      setOverflow(target, hasOverflow)
    }

    afterReflow(emitOverflowDetected)
  }

  const observer = new IntersectionObserver(observation, observerOptions)
  const observed = new WeakSet()

  function attachObservers(nodeList) {
    const alreadyObserved = new Set()
    const newlyObserved = new Set()
    let counter = 0

    for (const node of nodeList) {
      if (!isElementNode(node)) continue
      if (observed.has(node)) {
        alreadyObserved.add(node)
        continue
      }

      observer.observe(node)
      observed.add(node)
      newlyObserved.add(node)
      counter += 1
    }

    warnAlreadyObserved(alreadyObserved)
    logNewlyObserved(newlyObserved)
    logAddOverflow(counter)

    newlyObserved.clear()
    alreadyObserved.clear()
  }

  return {
    attachObservers,
    detachObservers: createDetachObservers(
      OVERFLOW,
      observer,
      observed,
      logRemoveOverflow,
    ),
    disconnect: () => {
      observer.disconnect()
      info('Detached%c OverflowObserver', HIGHLIGHT)
    },
  }
}

export default createOverflowObserver
