import { useState } from 'react'
import { X, Leaf, CalendarPlus, Trash2 } from 'lucide-react'
import { fullDateLabel, STATUS_CONFIG } from '../utils/calendarUtils'
import { todayStr } from '../utils/dateUtils'
import EditTaskModal from './EditTaskModal'

const REASONS = ['Recovery', 'Vacation', 'Weekend', 'Sick Day', 'Personal Day']
const STARS   = { 1: '⭐', 2: '⭐⭐', 3: '⭐⭐⭐' }

export default function DayDetailModal({
  dateStr,
  status,
  score,
  tasks,          // completed tasks (past) or scheduled tasks (future)
  isRestDay,
  restReason,
  onClose,
  onMarkRest,     // (dateStr, reason) => void
  onRemoveRest,   // (dateStr) => void
  onAddTask,      // (dateStr) => void  — opens ScheduleTaskModal
  onDeleteTask,   // (taskId) => void
  onEditTask,     // (task) => void  — opens EditTaskModal (future tasks)
}) {
  const today  = todayStr()
  const isPast    = dateStr <  today
  const isToday   = dateStr === today
  const isFuture  = dateStr >  today
  const cfg       = STATUS_CONFIG[status] || STATUS_CONFIG.nodata

  const [showRestForm, setShowRestForm] = useState(false)
  const [reason,       setReason]       = useState(restReason || REASONS[0])
  const [confirmId,    setConfirmId]    = useState(null)
  const [editingTask,  setEditingTask]  = useState(null)
  const [savingEdit,   setSavingEdit]   = useState(false)

  const label = fullDateLabel(dateStr)

  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="modal-box day-detail-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="ddm-header">
          <div className="ddm-date-label">{label}</div>
          <button className="modal-close-btn" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Status badge */}
        <div className={`ddm-status ${cfg.cls}`}>
          <span>{cfg.icon}</span>
          <span>{cfg.label}</span>
          {score > 0 && !['rest','planned','future','today','nodata'].includes(status) && (
            <span className="ddm-score">{score} pts</span>
          )}
          {isToday && score > 0 && (
            <span className="ddm-score">{score} pts so far</span>
          )}
        </div>

        {/* Tasks list */}
        {tasks.length > 0 && (
          <div className="ddm-tasks">
            <div className="ddm-section-label">
              {isFuture ? '📅 Scheduled Tasks' : (isToday ? '⚡ Today\'s Tasks' : '✅ Completed Tasks')}
            </div>
            {tasks.map(t => (
              <div key={t.id} className="ddm-task-row">
                <span className="ddm-task-icon">
                  {t.mode === 'worker' ? '⚡' : '🏠'}
                </span>
                <span className="ddm-task-text">{t.text}</span>
                {t.mode === 'worker' && t.difficulty && (
                  <span className="ddm-task-stars">{STARS[t.difficulty] || '⭐'}</span>
                )}
                {/* Edit and Delete for future tasks */}
                {isFuture && (
                  <>
                    {onEditTask && (
                      <button className="msg-icon-btn" onClick={() => setEditingTask(t)} title="Edit task">
                        ✏️
                      </button>
                    )}
                    {confirmId === t.id ? (
                      <>
                        <button className="msg-icon-btn delete-btn" onClick={() => { onDeleteTask(t.id); setConfirmId(null) }}>
                          Confirm
                        </button>
                        <button className="msg-icon-btn" onClick={() => setConfirmId(null)}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button className="msg-icon-btn delete-btn" onClick={() => setConfirmId(t.id)}>
                        <Trash2 size={11} />
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {tasks.length === 0 && (isToday || isPast) && !isRestDay && (
          <div className="ddm-empty-note">
            {isToday ? 'No tasks completed yet today.' : 'No completed tasks recorded.'}
          </div>
        )}

        {/* Add Task button (future days only) */}
        {isFuture && (
          <button
            className="ddm-add-task-btn"
            onClick={() => { onClose(); onAddTask(dateStr) }}
          >
            <CalendarPlus size={14} /> Add Task for This Day
          </button>
        )}

        {/* Rest Day section */}
        <div className="ddm-rest-section">
          {isRestDay ? (
            <div className="ddm-rest-active">
              <span className="ddm-rest-pill">🌿 Rest Day{restReason ? ` — ${restReason}` : ''}</span>
              <button className="msg-icon-btn delete-btn" onClick={() => onRemoveRest(dateStr)}>
                Remove
              </button>
            </div>
          ) : (
            showRestForm ? (
              <div className="ddm-rest-form">
                <select
                  className="sched-date-input"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                >
                  {REASONS.map(r => <option key={r}>{r}</option>)}
                </select>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="msg-cancel-btn" onClick={() => setShowRestForm(false)}>Cancel</button>
                  <button
                    className="msg-save-btn"
                    onClick={() => { onMarkRest(dateStr, reason); setShowRestForm(false) }}
                  >
                    <Leaf size={12} /> Mark as Rest Day
                  </button>
                </div>
              </div>
            ) : (
              <button className="ddm-rest-btn" onClick={() => setShowRestForm(true)}>
                <Leaf size={13} /> Mark as Rest Day
              </button>
            )
          )}
        </div>

        {/* Edit Task Modal (for future tasks) */}
        {editingTask && (
          <EditTaskModal
            task={editingTask}
            isOpen={!!editingTask}
            onClose={() => setEditingTask(null)}
            onSave={async (taskId, updates) => {
              setSavingEdit(true)
              try {
                if (onEditTask) {
                  await onEditTask(taskId, updates)
                }
                setEditingTask(null)
              } finally {
                setSavingEdit(false)
              }
            }}
            saving={savingEdit}
          />
        )}

        <button className="modal-close-full-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  )
}
