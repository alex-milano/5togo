import { useState } from 'react'
import { X } from 'lucide-react'
import DifficultySelector from './DifficultySelector'
import TagInput from './TagInput'
import { tomorrowStr, fullDateLabel } from '../utils/calendarUtils'
import { todayStr } from '../utils/dateUtils'

export default function ScheduleTaskModal({ initialDate, onSchedule, onClose }) {
  const tomorrow = tomorrowStr()
  const today    = todayStr()

  const [text,       setText]       = useState('')
  const [mode,       setMode]       = useState('worker')
  const [difficulty, setDifficulty] = useState(2)
  const [tags,       setTags]       = useState([])
  const [date,       setDate]       = useState(initialDate || tomorrow)
  const [saving,     setSaving]     = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim() || !date) return
    setSaving(true)
    try {
      await onSchedule({ text: text.trim(), mode, difficulty, tags, date })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const isToday  = date === today
  const dateLabel = date ? fullDateLabel(date) : ''

  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="modal-box schedule-modal" onClick={e => e.stopPropagation()}>
        <div className="sched-header">
          <h3 className="sched-title">📅 Schedule Task</h3>
          <button className="modal-close-btn" onClick={onClose}><X size={16} /></button>
        </div>

        {dateLabel && (
          <div className="sched-date-label">{dateLabel}</div>
        )}

        <form className="sched-form" onSubmit={handleSubmit}>
          <input
            className="add-input"
            placeholder="Task description…"
            value={text}
            onChange={e => setText(e.target.value)}
            autoFocus
            required
          />

          {/* Date picker */}
          <div className="sched-field">
            <label className="sched-field-label">Schedule for</label>
            <input
              type="date"
              className="sched-date-input"
              value={date}
              min={isToday ? today : tomorrow}
              onChange={e => setDate(e.target.value)}
              required
            />
          </div>

          {/* Mode */}
          <div className="sched-field">
            <label className="sched-field-label">Mode</label>
            <div className="sched-mode-row">
              {[['worker', '⚡ Worker'], ['life', '🏠 Life']].map(([val, lbl]) => (
                <button
                  key={val}
                  type="button"
                  className={`sched-mode-btn ${mode === val ? 'sched-mode-active' : ''}`}
                  onClick={() => setMode(val)}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty — only for worker */}
          {mode === 'worker' && (
            <div className="sched-field">
              <label className="sched-field-label">Difficulty</label>
              <DifficultySelector value={difficulty} onChange={setDifficulty} />
            </div>
          )}

          {/* Tags */}
          <div className="sched-field">
            <label className="sched-field-label">Tags (optional)</label>
            <TagInput tags={tags} onChange={setTags} />
          </div>

          <div className="sched-actions">
            <button type="button" className="msg-cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="msg-save-btn"
              disabled={saving || !text.trim() || !date}
            >
              {saving ? 'Scheduling…' : '📅 Schedule Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
