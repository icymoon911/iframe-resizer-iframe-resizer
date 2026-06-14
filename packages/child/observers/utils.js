import { HIGHLIGHT, NORMAL } from 'auto-console-group'

import { NEW_LINE } from '../../common/consts'
import { debug, error, info } from '../console'

// --- Debug logging factories ---

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

// Pre-bound convenience aliases
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

export const createDetachObservers = (type, observer, observed, logCounter) => {
  const logNewlyRemoved = createLogNewlyRemoved(type)

  return (nodeList) => {
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
    logCounter(counter)
    newlyRemoved.clear()
  }
}

// --- Observer registry ---

const registry = []

export function registerDisconnect(disconnectFn) {
  registry.push(disconnectFn)
}

export function disconnectAll() {
  registry.forEach((fn) => fn())
  registry.length = 0
}

// --- Generic attach/detach factory for node-list observers ---

export function createNodeObserver({
  type,
  observer,
  observed = new WeakSet(),
  filter = () => true,
}) {
  const logAdd = createLogCounter(type)
  const logRemove = createLogCounter(type, false)
  const logNewlyObserved = createLogNewlyObserved(type)
  const warnAlreadyObserved = createWarnAlreadyObserved(type)

  function attach(nodeList) {
    const alreadyObserved = new Set()
    const newlyObserved = new Set()
    let counter = 0

    for (const node of nodeList) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue
      if (!filter(node)) continue

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

  const detach = createDetachObservers(type, observer, observed, logRemove)

  return { attach, detach, observed }
}
