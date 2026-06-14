import { createObserver } from './utils'

const isNonStatic = (node) => {
  const position = getComputedStyle(node)?.position
  return position !== '' && position !== 'static'
}

export default (callback) => {
  const observer = new ResizeObserver(callback)

  return createObserver({
    type: 'Resize',
    observer,
    filter: isNonStatic,
    initialTargets: [document.body],
  })
}
