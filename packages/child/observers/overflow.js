import { HIGHLIGHT } from 'auto-console-group'

import { HEIGHT_EDGE, OVERFLOW_ATTR } from '../../common/consts'
import { id } from '../../common/utils'
import { info } from '../console'
import { createNodeObserver, registerDisconnect } from './utils'

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

  const nodeObserver = createNodeObserver({
    type: 'Overflow',
    observer,
  })

  registerDisconnect(() => {
    observer.disconnect()
    info('Detached%c OverflowObserver', HIGHLIGHT)
  })

  return {
    attachObservers: nodeObserver.attach,
    detachObservers: nodeObserver.detach,
  }
}

export default createOverflowObserver
