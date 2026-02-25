import { todayStr } from '../utils/dateUtils'
import { getTagColor } from '../utils/balanceUtils'

const FORWARD = { locked: 'progress', progress: 'touchdown', ice: 'locked' }
const BACK    = { progress: 'locked', touchdown: 'progress' }
const FWD_LBL = { locked: '→ Start', progress: '✓ Done', ice: '↑ Activate' }
const BCK_LBL = { progress: '← Back', touchdown: '← Undo' }

const STARS = { 1: '⭐', 2: '⭐⭐', 3: '⭐⭐⭐' }

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function shortDateLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`
}

export default function TaskCard({ task, onMove, onDelete, onDragStart, onDragEnd, isDragging, currentUser, userProfile, onShare, onEdit }) {
  const today    = todayStr()
  const isOld    = task.dateStr && task.dateStr < today
  const isFuture = task.dateStr && task.dateStr > today

  // Permission logic
  const myHandle   = userProfile?.handle || null
  const myUid      = currentUser?.uid || null
  const isOwner    = task.userId === myUid
  const sharedWithMe = (task.sharedWith || []).includes(myHandle)
  const isCollaborator = sharedWithMe && !isOwner
  const canEdit    = isOwner || isCollaborator
  const canDelete  = isOwner
  const canShare   = isOwner

  let classes = `task-card m-${task.mode} s-${task.status}`
  if (isDragging) classes += ' is-dragging'
  if (isOld)     classes += ' old-task'
  if (isFuture)  classes += ' future-task'

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
      {/* Future date badge */}
      {isFuture && (
        <div className="task-future-badge">📅 {shortDateLabel(task.dateStr)}</div>
      )}

      {/* Shared badge */}
      {task.isShared && (
        <div className="task-shared-badge">
          {isOwner
            ? `🔗 Shared with ${(task.sharedWith || []).length} ${(task.sharedWith || []).length === 1 ? 'person' : 'people'}`
            : `🔗 Shared by @${task.sharedBy}`}
        </div>
      )}

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

        {task.mode === 'worker' && task.difficulty && (
          <span className="task-stars" title={`Difficulty ${task.difficulty}`}>
            {STARS[task.difficulty] || '⭐'}
          </span>
        )}

        <div className="task-actions">
          {canEdit && FORWARD[task.status] && (
            <button className="act fwd" onClick={() => onMove(task.id, FORWARD[task.status])}>
              {FWD_LBL[task.status]}
            </button>
          )}
          {canEdit && BACK[task.status] && (
            <button className="act back" onClick={() => onMove(task.id, BACK[task.status])}>
              {BCK_LBL[task.status]}
            </button>
          )}
          {canEdit && (task.status === 'locked' || task.status === 'progress') && (
            <button className="act ice" onClick={() => onMove(task.id, 'ice')}>🧊</button>
          )}
          {canShare && onShare && (
            <button className="act share" onClick={() => onShare(task.id)}>🔗</button>
          )}
          {canEdit && onEdit && (
            <button className="act edit" onClick={() => onEdit(task)}>✏️</button>
          )}
          {canDelete && (
            <button className="act del" onClick={() => onDelete(task.id)}>🗑</button>
          )}
        </div>
      </div>
    </div>
  )
}
