// ─── Balance zones ────────────────────────────────────────────────────────────

export const ZONES = {
  empty:  { key: 'empty',  label: 'Ready to start',     msg: 'Add your first task!',                          cls: 'zone-empty'  },
  green:  { key: 'green',  label: 'Peak performance',   msg: 'Peak performance zone 💚',                      cls: 'zone-green'  },
  yellow: { key: 'yellow', label: 'High workload',      msg: '⚠️ High workload. Don\'t overcommit.',          cls: 'zone-yellow' },
  red:    { key: 'red',    label: 'Burnout risk',       msg: '🔴 Burnout risk! Consider moving tasks to Life.', cls: 'zone-red'   },
}

export function getZone(activeCount) {
  if (activeCount === 0) return 'empty'
  if (activeCount <= 5)  return 'green'
  if (activeCount <= 7)  return 'yellow'
  return 'red'
}

// ─── Points & scoring ─────────────────────────────────────────────────────────

export const SCORE_LEVELS = [
  { min: 7,  label: 'OVERACHIEVER', icon: '🚀', cls: 'sc-over',  note: 'Remember to rest tomorrow 😊' },
  { min: 5,  label: 'PEAK DAY',     icon: '🔥', cls: 'sc-peak',  note: '' },
  { min: 4,  label: 'SOLID DAY',    icon: '💪', cls: 'sc-solid', note: '' },
  { min: 2,  label: 'GOOD EFFORT',  icon: '👍', cls: 'sc-good',  note: '' },
  { min: 0,  label: 'OFF DAY',      icon: '😴', cls: 'sc-off',   note: '' },
]

export function getScoreLevel(points) {
  for (const level of SCORE_LEVELS) {
    if (points >= level.min) return level
  }
  return SCORE_LEVELS[SCORE_LEVELS.length - 1]
}

/** Sum difficulty values of completed tasks */
export function calcPoints(tasks) {
  return tasks.reduce((sum, t) => sum + (Number(t.difficulty) || 1), 0)
}

// ─── Tag colors ───────────────────────────────────────────────────────────────

const TAG_PALETTE = [
  { bg: 'rgba(76,201,240,0.15)',  text: '#4cc9f0', border: 'rgba(76,201,240,0.3)'  },
  { bg: 'rgba(255,107,53,0.15)',  text: '#ff6b35', border: 'rgba(255,107,53,0.3)'  },
  { bg: 'rgba(45,198,83,0.15)',   text: '#2dc653', border: 'rgba(45,198,83,0.3)'   },
  { bg: 'rgba(155,93,229,0.15)',  text: '#9b5de5', border: 'rgba(155,93,229,0.3)'  },
  { bg: 'rgba(255,215,0,0.15)',   text: '#ffd700', border: 'rgba(255,215,0,0.3)'   },
  { bg: 'rgba(240,76,201,0.15)',  text: '#f04cc9', border: 'rgba(240,76,201,0.3)'  },
  { bg: 'rgba(76,240,201,0.15)',  text: '#4cf0c9', border: 'rgba(76,240,201,0.3)'  },
  { bg: 'rgba(255,165,0,0.15)',   text: '#ffa500', border: 'rgba(255,165,0,0.3)'   },
]

/** Deterministic color for a tag string */
export function getTagColor(tag) {
  let h = 0
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) | 0
  return TAG_PALETTE[Math.abs(h) % TAG_PALETTE.length]
}

// ─── Balance advice ───────────────────────────────────────────────────────────

export function getBalanceStatus(workerCount, lifeCount) {
  const total = workerCount + lifeCount
  if (total === 0) return { icon: '⚪', label: 'No activity', cls: 'bs-empty' }
  const ratio = lifeCount / total
  if (ratio >= 0.35) return { icon: '🟢', label: 'Balanced',     cls: 'bs-balanced'  }
  if (ratio >= 0.15) return { icon: '🟡', label: 'Work-focused', cls: 'bs-focused'   }
  if (lifeCount === 0) return { icon: '🔴', label: 'Workaholic', cls: 'bs-workaholic' }
  return                       { icon: '🟡', label: 'Work-heavy', cls: 'bs-focused'   }
}
