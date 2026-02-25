// ─── Calendar utility functions ───────────────────────────────────────────────

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** Format YYYY-MM-DD from year + month (1-based) + day */
export function toDateStr(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/** Number of days in a given month (1-based) */
export function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

/** First weekday of the month (0=Sun, 6=Sat) */
export function firstWeekdayOfMonth(year, month) {
  return new Date(year, month - 1, 1).getDay()
}

/**
 * Returns a flat array of cells for a calendar grid (7 cols).
 * Each cell: { dateStr: string } or null (padding).
 */
export function getCalendarGrid(year, month) {
  const total   = daysInMonth(year, month)
  const offset  = firstWeekdayOfMonth(year, month) // 0 = Sun
  const cells   = []
  for (let i = 0; i < offset; i++) cells.push(null)
  for (let d = 1; d <= total; d++) cells.push(toDateStr(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

/** "February 2026" */
export function formatMonthYear(year, month) {
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'long', year: 'numeric',
  })
}

/** First and last day strings of a month */
export function monthRange(year, month) {
  const first = toDateStr(year, month, 1)
  const last  = toDateStr(year, month, daysInMonth(year, month))
  return { first, last }
}

/**
 * Determine visual status of a calendar day cell.
 * Returns one of: 'peak' | 'solid' | 'good' | 'off' | 'rest' | 'planned' | 'future' | 'today' | 'nodata'
 */
export function getDayStatus({ score, hasAnyTasks, isRestDay, isFuture, hasFutureTasks, isToday }) {
  if (isRestDay)   return 'rest'
  if (isFuture)    return hasFutureTasks ? 'planned' : 'future'
  if (isToday) {
    if (score >= 5) return 'peak'
    if (score >= 4) return 'solid'
    if (score >= 2) return 'good'
    return 'today'
  }
  // Past day
  if (score >= 5) return 'peak'
  if (score >= 4) return 'solid'
  if (score >= 2) return 'good'
  if (score > 0 || hasAnyTasks) return 'off'
  return 'nodata'
}

/** Config per status: color class, icon, label */
export const STATUS_CONFIG = {
  peak:    { cls: 'ds-peak',    icon: '🔥', label: 'Peak Day',      color: 'var(--orange)' },
  solid:   { cls: 'ds-solid',   icon: '💪', label: 'Solid Day',     color: 'var(--green)'  },
  good:    { cls: 'ds-good',    icon: '👍', label: 'Good Effort',   color: 'var(--blue)'   },
  off:     { cls: 'ds-off',     icon: '😴', label: 'Off Day',       color: 'var(--gray2)'  },
  rest:    { cls: 'ds-rest',    icon: '🌿', label: 'Rest Day',      color: '#06d6a0'       },
  planned: { cls: 'ds-planned', icon: '📅', label: 'Tasks Planned', color: 'var(--purple)' },
  future:  { cls: 'ds-future',  icon: '⚪', label: 'Future',        color: 'var(--text3)'  },
  today:   { cls: 'ds-today',   icon: '📍', label: 'Today',         color: 'var(--orange)' },
  nodata:  { cls: 'ds-nodata',  icon: '·',  label: 'No Data',       color: 'var(--border)' },
}

/** Calculate month-level stats from a per-day data map */
export function calcMonthStats(dayMap, today) {
  let peakDays = 0, solidDays = 0, restDays = 0, plannedDays = 0
  let totalScore = 0, scoredDays = 0
  let longestStreak = 0, currentStreak = 0

  const sorted = Object.keys(dayMap).sort()
  for (const dateStr of sorted) {
    const d = dayMap[dateStr]
    if (d.status === 'rest')    { restDays++;   currentStreak = 0; continue }
    if (d.status === 'planned') { plannedDays++; continue }
    if (d.status === 'future')  { continue }
    if (dateStr > today)        { continue }

    if (d.status === 'peak')  { peakDays++;  currentStreak++; longestStreak = Math.max(longestStreak, currentStreak) }
    else if (d.status === 'solid') { solidDays++; currentStreak++; longestStreak = Math.max(longestStreak, currentStreak) }
    else { currentStreak = 0 }

    if (d.score !== undefined) { totalScore += d.score; scoredDays++ }
  }

  return {
    peakDays,
    solidDays,
    restDays,
    plannedDays,
    avgScore: scoredDays > 0 ? Math.round(totalScore / scoredDays * 10) / 10 : 0,
    longestStreak,
  }
}

/** Tomorrow's date string */
export function tomorrowStr() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

/** Full date label: "Monday, February 25, 2026" */
export function fullDateLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

/** Short relative date: "Today", "Tomorrow", "Yesterday", or "Mon, Feb 25" */
export function relativeDateLabel(dateStr, today) {
  if (dateStr === today) return 'Today'
  const d = new Date(dateStr + 'T00:00:00')
  const t = new Date(today   + 'T00:00:00')
  const diff = Math.round((d - t) / 86_400_000)
  if (diff === 1)  return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}
