import { FOREGROUND, HIGHLIGHT } from 'auto-console-group'

import { info } from '../console'

// Check if element is visually hidden via CSS visibility or opacity.
// IntersectionObserver handles display:none (element won't intersect),
// but visibility:hidden and opacity:0 still register as intersecting.
const isVisuallyHidden = (element) => {
  const style = getComputedStyle(element)
  return style.visibility === 'hidden' || style.opacity === '0'
}

export default function visibilityObserver(callback) {
  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries.at(-1)
      const isVisible =
        entry.isIntersecting && !isVisuallyHidden(entry.target)
      callback(isVisible)
    },
    {
      threshold: 0,
    },
  )

  const target = document.documentElement
  observer.observe(target)

  // Also observe for CSS visibility/opacity changes via MutationObserver,
  // since IntersectionObserver won't fire when only visibility/opacity changes.
  const mutationObserver = new MutationObserver(() => {
    const style = getComputedStyle(target)
    const isVisible = style.visibility !== 'hidden' && style.opacity !== '0'
    callback(isVisible)
  })

  mutationObserver.observe(target, {
    attributes: true,
    attributeFilter: ['style', 'class'],
  })

  info('Attached%c VisibilityObserver%c to page', HIGHLIGHT, FOREGROUND)

  return {
    disconnect: () => {
      observer.disconnect()
      mutationObserver.disconnect()
      info('Detached%c VisibilityObserver', HIGHLIGHT)
    },
  }
}
