// Determine if a DOM node is visually hidden for overflow-detection purposes.
// A node is considered hidden when:
//   - it has the HTML `hidden` attribute,
//   - it has inline `display: none`,
//   - it has computed `display: none` (offsetParent is null and it is not fixed).
//
// Note: `position: fixed` elements have offsetParent === null but are NOT hidden.
// <body> and <html> also have offsetParent === null but are never considered hidden.
export const isNodeHidden = (node) => {
  if (node.hidden) return true
  if (node.style.display === 'none') return true
  if (node.offsetParent !== null) return false

  // offsetParent is null for: display:none, position:fixed, <body>, <html>
  // position:fixed elements are visible — do not treat as hidden
  if (getComputedStyle(node).position === 'fixed') return false

  // <body> and <html> are never considered hidden
  if (node === document.documentElement || node === document.body) return false

  return true
}
