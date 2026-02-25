import { todayStr } from '../utils/dateUtils'
import { getTagColor } from '../utils/balanceUtils'

const FORWARD = { locked: 'progress', progress: 'touchdown', ice: 'locked' }
const BACK    = { progress: 'locked', touchdown: 'progress' }
const FWD_LBL = { locked: '→ Start', progress: '✓ Done', ice: '↑ Activate' }
const BCK_LBL = { progress: '← Back', touchdown: '← Undo' }

const STARS = { 1: '⭐', 2: '⭐⭐', 3: '⭐⭐⭐' }

export default function TaskCard({ task, onMove, onDelete, onDragStart, onDragEnd, isDragging }) {
  const isOld = task.dateStr && task.dateStr !== todayStr()

  let classes = `task-card m-${task.mode} s-${task.status}`
  if (isDragging) classes += ' is-dragging'
  if (isOld)     classes += ' old-task'

  const tags = Array.isArray(task.tags) ? task.tags.filter(Boolean) : []

  return (
    <div
      className={classes}
      draggable
      data-id={task.id}
      onDragStart={e => {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', task.id)
        onDragStart(task.id)
      }}
      onDragEnd={onDragEnd}
    >
      {/* Title */}
      <div className="task-title">{task.text}</div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="task-tags">
          {tags.map((tag, i) => {
            const c = getTagColor(tag)
            return (
              <span
                key={i}
                className="tag-chip"
                style={{ background: c.bg, color: c.text, borderColor: c.border }}
              >
                #{tag}
              </span>
            )
          })}
        </div>
      )}

      {/* Footer */}
      <div className="task-footer">
        <span className={`mode-badge badge-${task.mode}`}>
          {task.mode === 'worker' ? 'WORKER' : 'LIFE'}
        </span>

        {/* Stars — Worker tasks only */}
        {task.mode === 'worker' && task.difficulty && (
          <span className="task-stars" title={`Difficulty ${task.difficulty}`}>
            {STARS[task.difficulty] || '⭐'}
          </span>
        )}

        <div className="task-actions">
          {FORWARD[task.status] && (
            <button className="act fwd" onClick={() => onMove(task.id, FORWARD[task.status])}>
              {FWD_LBL[task.status]}
            </button>
          )}
          {BACK[task.status] && (
            <button className="act back" onClick={() => onMove(task.id, BACK[task.status])}>
              {BCK_LBL[task.status]}
            </button>
          )}
          {(task.status === 'locked' || task.status === 'progress') && (
            <button className="act ice" onClick={() => onMove(task.id, 'ice')}>🧊</button>
          )}
          <button className="act del" onClick={() => onDelete(task.id)}>🗑</button>
        </div>
      </div>
    </div>
  )
}
