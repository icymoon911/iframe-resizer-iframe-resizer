import { HIGHLIGHT, NORMAL } from 'auto-console-group'

import { NEW_LINE } from '../../common/consts'
import { debug, error, info } from '../console'

// --- Logging helpers ---

export const createDebugLogger =
  (text = '') =>
  (type) =>
  (observed) => {
    if (observed.size > 0) {
      debug(
        `${type}Observer ${text}:`,
        ...Array.from(observed).flatMap((node) => [NEW_LINE, node]),
      )
    }
  }

export const createErrorLogger =
  (text = '') =>
  (type) =>
  (observed) => {
    if (observed.size > 0) {
      error(
        `${type}Observer ${text}:`,
        ...Array.from(observed).flatMap((node) => [NEW_LINE, node]),
      )
    }
  }

export const createLogNewlyObserved = createDebugLogger('attached to')

export const createWarnAlreadyObserved = createErrorLogger('already attached')

export const createLogNewlyRemoved = createDebugLogger('detached from')

export const createLogCounter =
  (type, isAttach = true) =>
  (counter) => {
    if (counter > 0) {
      info(
        `${isAttach ? 'At' : 'De'}tached %c${type}Observer%c ${isAttach ? 'to' : 'from'} %c${counter}%c element${counter === 1 ? '' : 's'}`,
        HIGHLIGHT,
        NORMAL,
        HIGHLIGHT,
        NORMAL,
      )
    }
  }

// --- Generic observer factory ---

/**
 * Creates a standard observer with attach/detach/disconnect lifecycle.
 * Handles nodeType checks, observed-set tracking, and logging.
 *
 * @param {Object} config
 * @param {string} config.type - Observer type label (e.g. 'Resize', 'Overflow')
 * @param {Object} config.observer - Native observer instance (ResizeObserver, IntersectionObserver, etc.)
 * @param {Function} [config.filter] - Optional predicate; nodes returning false are skipped on attach
 * @param {Iterable} [config.initialTargets] - Initial elements to observe immediately (e.g. [document.body])
 * @returns {{ attach: Function, detach: Function, disconnect: Function }}
 */
export function createObserver({ type, observer, filter, initialTargets }) {
  const observed = new WeakSet()
  const logAdd = createLogCounter(type)
  const logRemove = createLogCounter(type, false)
  const logNewlyObserved = createLogNewlyObserved(type)
  const warnAlreadyObserved = createWarnAlreadyObserved(type)
  const logNewlyRemoved = createLogNewlyRemoved(type)

  if (initialTargets) {
    for (const target of initialTargets) {
      observer.observe(target)
      observed.add(target)
    }
    info(`Attached%c ${type}Observer`, HIGHLIGHT)
  }

  function attach(nodeList) {
    const alreadyObserved = new Set()
    const newlyObserved = new Set()
    let counter = 0

    for (const node of nodeList) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue
      if (filter && !filter(node)) continue
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
    logAdd(counter)

    newlyObserved.clear()
    alreadyObserved.clear()
  }

  function detach(nodeList) {
    const newlyRemoved = new Set()
    let counter = 0

    for (const node of nodeList) {
      if (!observed.has(node)) continue
      observer.unobserve(node)
      observed.delete(node)
      newlyRemoved.add(node)
      counter += 1
    }

    logNewlyRemoved(newlyRemoved)
    logRemove(counter)
    newlyRemoved.clear()
  }

  function disconnect() {
    observer.disconnect()
    info(`Detached%c ${type}Observer`, HIGHLIGHT)
  }

  return { attach, detach, disconnect }
}

// --- Observer registry for unified disconnect ---

/**
 * Central registry that tracks all observer disconnect functions.
 * Call disconnectAll() to tear down every registered observer at once.
 * The registry is iterable — spread it into tearDownList to integrate
 * with the page-hide lifecycle:
 *   tearDownList.push(...observerRegistry)
 */
export const observerRegistry = {
  disconnects: new Set(),

  register(disconnect) {
    this.disconnects.add(disconnect)
  },

  disconnectAll() {
    for (const disconnect of this.disconnects) {
      disconnect()
    }
    this.disconnects.clear()
  },

  [Symbol.iterator]() {
    return this.disconnects.values()
  },
}
