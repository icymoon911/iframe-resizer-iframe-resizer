import { HEIGHT_EDGE, OVERFLOW_ATTR } from '../../common/consts'
import { id } from '../../common/utils'
import { createObserver } from './utils'

const isHidden = (node) =>
  node.hidden || node.offsetParent === null || node.style.display === 'none'

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

  return createObserver({
    type: 'Overflow',
    observer,
  })
}

export default createOverflowObserver
