import { FOREGROUND, HIGHLIGHT } from 'auto-console-group'

import { info } from '../console'

export default function visibilityObserver(callback) {
  const observer = new IntersectionObserver(
    (entries) => callback(entries.at(-1).isIntersecting),
    {
      threshold: 0,
    },
  )

  const target = document.documentElement
  observer.observe(target)

  // Supplement IntersectionObserver with a MutationObserver that detects
  // CSS visibility changes (visibility:hidden, opacity:0) applied to the
  // <html> element or its ancestors. IntersectionObserver alone may miss
  // these in some browsers — especially Safari.
  const mutationObserver = new MutationObserver(() => {
    const style = window.getComputedStyle(target)
    const isVisible =
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      !document.hidden
    callback(isVisible)
  })

  mutationObserver.observe(target, {
    attributes: true,
    attributeFilter: ['style', 'class', 'hidden'],
  })

  // Listen for Page Visibility API changes (tab switches, minimise, etc.)
  const onVisibilityChange = () => callback(!document.hidden)
  document.addEventListener('visibilitychange', onVisibilityChange)

  info('Attached%c VisibilityObserver%c to page', HIGHLIGHT, FOREGROUND)

  return {
    disconnect: () => {
      observer.disconnect()
      mutationObserver.disconnect()
      document.removeEventListener('visibilitychange', onVisibilityChange)
      info('Detached%c VisibilityObserver', HIGHLIGHT)
    },
  }
}
