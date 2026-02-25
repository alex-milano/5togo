import { useState, useMemo } from 'react'
import KanbanColumn from './KanbanColumn'
import DifficultySelector from './DifficultySelector'
import TagInput from './TagInput'
import BalanceZoneIndicator from './BalanceZoneIndicator'
import { useTheme } from '../contexts/ThemeContext'
import { getZone, getScoreLevel, getTagColor } from '../utils/balanceUtils'

const DIFF_LABEL = { 1: '⭐ Easy', 2: '⭐⭐ Med', 3: '⭐⭐⭐ Hard' }

export default function WorkerBoard({
  tasks,               // Worker tasks not in ice
  activeWorkerCount,   // count for zone calc
  todayPoints,
  streak,
  draggingId,
  onMove,
  onDelete,
  onDragStart,
  onDragEnd,
  onAddTask,
}) {
  const { themeData } = useTheme()
  const cols = themeData.worker

  const [text, setText]         = useState('')
  const [difficulty, setDiff]   = useState(2)
  const [tags, setTags]         = useState([])
  const [tagFilter, setTagFilter] = useState(null)
  const [showBurnout, setShowBurnout] = useState(false)
  const [pending, setPending]   = useState(null)

  const zone  = getZone(activeWorkerCount)
  const level = getScoreLevel(todayPoints)
  const pct   = Math.min((todayPoints / 10) * 100, 100)

  // Unique tags from all worker tasks
  const allTags = useMemo(() => {
    const s = new Set()
    tasks.forEach(t => (t.tags || []).forEach(tag => s.add(tag)))
    return [...s]
  }, [tasks])

  const visible = tagFilter
    ? tasks.filter(t => (t.tags || []).includes(tagFilter))
    : tasks

  async function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) return

    if (activeWorkerCount >= 7) {
      setPending({ text: text.trim(), difficulty, tags })
      setShowBurnout(true)
      return
    }

    await doAdd('worker', text.trim(), difficulty, tags)
  }

  async function doAdd(mode, taskText, diff, taskTags) {
    await onAddTask({ text: taskText, mode, difficulty: diff, tags: taskTags })
    setText(''); setTags([])
  }

  async function handleMoveToLife() {
    if (!pending) return
    await doAdd('life', pending.text, pending.difficulty, pending.tags)
    closeBurnout()
  }
  function handleScheduleTomorrow() { closeBurnout() }
  async function handleForceAdd() {
    if (!pending) return
    await doAdd('worker', pending.text, pending.difficulty, pending.tags)
    closeBurnout()
  }
  function closeBurnout() { setShowBurnout(false); setPending(null) }

  return (
    <div className={`worker-side zone-border-${zone}`}>

      {/* ── Board header ── */}
      <div className="board-header worker-header">
        <div className="bh-top">
          <span className="bh-title">{cols.headerLabel}</span>
          <BalanceZoneIndicator zone={zone} activeCount={activeWorkerCount} />
        </div>

        {/* Score bar */}
        <div className="bh-score">
          <div className="bh-score-row">
            <span className={`bh-pts ${level.cls}`}>{todayPoints}<span className="bh-pts-max">/10 pts</span></span>
            <span className={`bh-level-badge ${level.cls}`}>{level.icon} {level.label}</span>
            {streak > 0 && <span className="bh-streak">🔥 {streak}d</span>}
          </div>
          <div className="bh-bar-track">
            <div className={`bh-bar-fill ${level.cls}`} style={{ width: `${pct}%` }} />
          </div>
          {level.note && <span className="bh-note">{level.note}</span>}
        </div>
      </div>

      {/* ── Add task form ── */}
      <form className="board-add-form" onSubmit={handleSubmit}>
        <div className="baf-row1">
          <input
            className="baf-input"
            placeholder="Add a worker task…"
            value={text}
            onChange={e => setText(e.target.value)}
            maxLength={140}
          />
          <button className="baf-btn worker-btn" type="submit">+ Add</button>
        </div>
        <div className="baf-row2">
          <DifficultySelector value={difficulty} onChange={setDiff} />
          <TagInput tags={tags} onChange={setTags} placeholder="tags…" />
        </div>
      </form>

      {/* ── Tag filter ── */}
      {allTags.length > 0 && (
        <div className="tag-filter-bar">
          <button
            className={`tf-chip ${!tagFilter ? 'tf-active' : ''}`}
            onClick={() => setTagFilter(null)}
          >All</button>
          {allTags.map(tag => {
            const c = getTagColor(tag)
            return (
              <button
                key={tag}
                className={`tf-chip ${tagFilter === tag ? 'tf-active' : ''}`}
                style={{ background: c.bg, color: c.text, borderColor: c.border }}
                onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
              >#{tag}</button>
            )
          })}
        </div>
      )}

      {/* ── Columns ── */}
      <div className="board-cols">
        {(['locked', 'progress', 'touchdown']).map(status => {
          const c = cols[status]
          return (
            <KanbanColumn
              key={status}
              title={c.name} subtitle={c.sub} icon={c.icon}
              status={status}
              colorClass={`col-${status}`}
              tasks={visible.filter(t => t.status === status)}
              onMove={onMove} onDelete={onDelete}
              draggingId={draggingId}
              onDragStart={onDragStart} onDragEnd={onDragEnd}
            />
          )
        })}
      </div>

      {/* ── Burnout modal ── */}
      {showBurnout && (
        <div className="modal-overlay open" onClick={closeBurnout}>
          <div className="modal-box burnout-box" onClick={e => e.stopPropagation()}>
            <div className="burnout-icon">🚨</div>
            <h2 className="burnout-title">BURNOUT RISK!</h2>
            <p className="burnout-msg">
              You're pushing too hard. 8+ active tasks could affect your wellbeing and performance.
            </p>
            <div className="burnout-actions">
              <button className="bb-btn bb-life" onClick={handleMoveToLife}>
                🏠 Move to Life mode instead
              </button>
              <button className="bb-btn bb-tomorrow" onClick={handleScheduleTomorrow}>
                📅 Schedule for tomorrow
              </button>
              <button className="bb-btn bb-force" onClick={handleForceAdd}>
                ⚠️ I understand the risk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
