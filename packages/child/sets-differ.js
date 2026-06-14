// Check if two Sets have different contents.
// Equivalent to setA.symmetricDifference(setB).size > 0, but works in
// environments that lack Set.prototype.symmetricDifference (e.g. Safari <= 16).
export const setsDiffer = (setA, setB) => {
  if (setA.size !== setB.size) return true
  for (const item of setA) {
    if (!setB.has(item)) return true
  }
  return false
}
