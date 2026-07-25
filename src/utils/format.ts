export function localDateKey(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function uid(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}:${crypto.randomUUID()}`
  }
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 9)}`
}

export function formatShortDate(iso: string | null): string {
  if (!iso) return '記録なし'
  return new Intl.DateTimeFormat('ja-JP', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso))
}

export function wordCount(value: string): number {
  const matches = value.trim().match(/[A-Za-z]+(?:['-][A-Za-z]+)*/g)
  return matches?.length ?? 0
}
