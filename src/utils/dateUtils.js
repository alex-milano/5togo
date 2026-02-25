/** Returns today's date string: 'YYYY-MM-DD' */
export function todayStr() {
  return new Date().toISOString().split('T')[0]
}

/** Returns yesterday's date string: 'YYYY-MM-DD' */
export function yesterdayStr() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
}

/** ISO week number (1–53) for a given Date */
export function getWeekNumber(date = new Date()) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const yearStart = new Date(d.getFullYear(), 0, 1)
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

/** Format a Firestore Timestamp or Date for display */
export function formatDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Human-readable short date for today header */
export function todayDisplay() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month:   'short',
    day:     'numeric',
  })
}

/** Returns a date string N days ago: 'YYYY-MM-DD' */
export function getDateNDaysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

/** Returns an array of 7 date strings for the given week offset (0 = current week) */
export function getWeekDates(weekOffset = 0) {
  const now = new Date()
  // Monday as first day
  const day = now.getDay() || 7
  const monday = new Date(now)
  monday.setDate(now.getDate() - day + 1 + weekOffset * 7)
  monday.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toISOString().split('T')[0]
  })
}

/** Short weekday + date label: "Mon 12" */
export function shortDayLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
}

/** "Feb 12 – Feb 18" range label for a week */
export function weekRangeLabel(weekDates) {
  if (!weekDates || weekDates.length === 0) return ''
  const fmt = ds => new Date(ds + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(weekDates[0])} – ${fmt(weekDates[6])}`
}
