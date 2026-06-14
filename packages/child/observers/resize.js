import { FOREGROUND, HIGHLIGHT } from 'auto-console-group'

import { info } from '../console'
import { createNodeObserver, registerDisconnect } from './utils'

export default (callback) => {
  const observer = new ResizeObserver(callback)
  observer.observe(document.body)

  const nodeObserver = createNodeObserver({
    type: 'Resize',
    observer,
    filter: (node) => {
      const position = getComputedStyle(node)?.position
      return position !== '' && position !== 'static'
    },
  })

  // Track document.body in observed set
  nodeObserver.observed.add(document.body)
  info('Attached%c ResizeObserver%c to body', HIGHLIGHT, FOREGROUND)

  registerDisconnect(() => {
    observer.disconnect()
    info('Detached%c ResizeObserver', HIGHLIGHT)
  })

  return {
    attachObservers: nodeObserver.attach,
    detachObservers: nodeObserver.detach,
  }
}
