import { useState, useMemo } from 'react'
import KanbanColumn from './KanbanColumn'
import TagInput from './TagInput'
import { useTheme } from '../contexts/ThemeContext'
import { getTagColor } from '../utils/balanceUtils'

export default function LifeBoard({
  tasks,             // Life tasks not in ice
  iceTasks,          // Life ice tasks (4th column)
  completedToday,    // count of done life tasks today
  draggingId,
  onMove,
  onDelete,
  onDragStart,
  onDragEnd,
  onAddTask,
  currentUser,
  userProfile,
  onShare,
}) {
  const { themeData } = useTheme()
  const cols = themeData.life
  const ice = themeData.ice || { name: 'Ice Bucket', sub: 'Frozen', icon: '🧊' }

  const [text, setText]           = useState('')
  const [tags, setTags]           = useState([])
  const [tagFilter, setTagFilter] = useState(null)

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
    await onAddTask({ text: text.trim(), mode: 'life', difficulty: 1, tags })
    setText(''); setTags([])
  }

  return (
    <div className="life-side">

      {/* ── Board header ── */}
      <div className="board-header life-header">
        <div className="bh-top">
          <span className="bh-title">{cols.headerLabel}</span>
          {completedToday > 0 && (
            <span className="life-completed-badge">
              {completedToday} completed today ✨
            </span>
          )}
        </div>
        <p className="life-tagline">No pressure, just progress</p>
      </div>

      {/* ── Add task form ── */}
      <form className="board-add-form" onSubmit={handleSubmit}>
        <div className="baf-row1">
          <input
            className="baf-input"
            placeholder="Add a life task…"
            value={text}
            onChange={e => setText(e.target.value)}
            maxLength={140}
          />
          <button className="baf-btn life-btn" type="submit">+ Add</button>
        </div>
        <div className="baf-row2">
          <TagInput tags={tags} onChange={setTags} placeholder="tags: health, family…" />
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
              colorClass={`col-life-${status}`}
              tasks={visible.filter(t => t.status === status)}
              onMove={onMove} onDelete={onDelete}
              draggingId={draggingId}
              onDragStart={onDragStart} onDragEnd={onDragEnd}
              currentUser={currentUser} userProfile={userProfile} onShare={onShare}
            />
          )
        })}
        {/* 4th column: Ice */}
        <KanbanColumn
          title={ice.name} subtitle={ice.sub} icon={ice.icon}
          status="ice" colorClass="col-life-ice"
          tasks={tagFilter ? iceTasks.filter(t => (t.tags || []).includes(tagFilter)) : iceTasks}
          onMove={onMove} onDelete={onDelete}
          draggingId={draggingId}
          onDragStart={onDragStart} onDragEnd={onDragEnd}
          currentUser={currentUser} userProfile={userProfile} onShare={onShare}
        />
      </div>
    </div>
  )
}
