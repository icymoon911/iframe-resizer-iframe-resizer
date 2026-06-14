import { FOREGROUND, HIGHLIGHT } from 'auto-console-group'

import { IGNORE_ATTR, IGNORE_TAGS, SIZE_ATTR } from '../../common/consts'
import { info, log } from '../console'
import { createThrottledProcessor } from './throttle'
import { createDebugLogger, registerDisconnect } from './utils'

const MUTATION = 'Mutation'

const addedNodes = new Set()
const removedNodes = new Set()
const removedAddedNodes = new Set()
const newMutations = []

const config = {
  attributes: true,
  attributeFilter: [IGNORE_ATTR, SIZE_ATTR],
  attributeOldValue: false,
  characterData: false,
  characterDataOldValue: false,
  childList: true,
  subtree: true,
}

const logAdded = createDebugLogger('added')(MUTATION)
const logRemovedPage = createDebugLogger('removed (page)')(MUTATION)
const logRemovedAdded = createDebugLogger('removed (added)')(MUTATION)

const shouldSkip = (node) =>
  node.nodeType !== Node.ELEMENT_NODE ||
  IGNORE_TAGS.has(node.tagName.toLowerCase())

function addedMutation(mutation) {
  const added = mutation.addedNodes

  for (const node of added) {
    if (shouldSkip(node)) continue
    addedNodes.add(node)
  }
}

function removedMutation(mutation) {
  const removed = mutation.removedNodes

  for (const node of removed) {
    if (shouldSkip(node)) continue
    if (addedNodes.has(node)) {
      addedNodes.delete(node)
      removedAddedNodes.add(node)
    } else {
      removedNodes.add(node)
    }
  }
}

const flatFilterMutations = (mutations) => {
  info('Mutations:', mutations)

  for (const mutation of mutations) {
    addedMutation(mutation)
    removedMutation(mutation)
  }

  logAdded(addedNodes)
  logRemovedPage(removedNodes)
  logRemovedAdded(removedAddedNodes)
  removedAddedNodes.clear()
}

function logMutations() {
  if (removedNodes.size > 0) {
    log(
      `Detected %c${removedNodes.size} %cremoved element${removedNodes.size > 1 ? 's' : ''}`,
      HIGHLIGHT,
      FOREGROUND,
    )
  }

  if (addedNodes.size > 0) {
    log(
      `Found %c${addedNodes.size} %cnew element${addedNodes.size > 1 ? 's' : ''}`,
      HIGHLIGHT,
      FOREGROUND,
    )
  }
}

export default function createMutationObserver(callback) {
  const observer = new window.MutationObserver(mutationObserved)
  const target = document.body || document.documentElement

  const processMutations = () => {
    newMutations.forEach(flatFilterMutations)
    newMutations.length = 0

    logMutations()

    callback({ addedNodes, removedNodes })

    addedNodes.clear()
    removedNodes.clear()
  }

  const throttled = createThrottledProcessor(processMutations)

  function mutationObserved(mutations) {
    newMutations.push(mutations)
    throttled.schedule()
  }

  observer.observe(target, config)

  info('Attached%c MutationObserver%c to body', HIGHLIGHT, FOREGROUND)

  registerDisconnect(() => {
    addedNodes.clear()
    removedNodes.clear()
    newMutations.length = 0
    throttled.reset()
    observer.disconnect()
    info('Detached%c MutationObserver', HIGHLIGHT)
  })

  return observer
}
