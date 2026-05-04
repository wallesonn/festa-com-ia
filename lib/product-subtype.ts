export function splitProductSubtype(value: string | null | undefined) {
  if (!value) return []

  return value
    .replaceAll('·', ',')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function composeProductSubtype(items: string[]) {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean))).join(', ')
}

export function toggleSelection(items: string[], item: string) {
  if (items.includes(item)) {
    return items.filter((current) => current !== item)
  }

  return [...items, item]
}
