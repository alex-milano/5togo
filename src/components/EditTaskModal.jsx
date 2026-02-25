import { useState } from 'react'
import { X } from 'lucide-react'
import DifficultySelector from './DifficultySelector'
import TagInput from './TagInput'

export default function EditTaskModal({ task, isOpen, onClose, onSave, saving }) {
  const [text, setText] = useState(task.text)
  const [difficulty, setDifficulty] = useState(task.difficulty || 1)
  const [tags, setTags] = useState(task.tags || [])
  const [dateStr, setDateStr] = useState(task.dateStr || '')

  if (!isOpen || !task) return null

  async function handleSave() {
    if (!text.trim()) return
    await onSave(task.id, {
      text: text.trim(),
      difficulty: Number(difficulty),
      tags,
      dateStr,
    })
  }

  return (
    <div
      className="modal-overlay open"
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal-box edit-task-modal" onClick={e => e.stopPropagation()}>
        <div className="sched-header">
          <h3 className="sched-title">✏️ Edit Task</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="sched-form">
          {/* Task text */}
          <div className="sched-field">
            <label className="sched-field-label">Task Description</label>
            <textarea
              className="msg-textarea"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Task description..."
              rows={3}
              maxLength={200}
            />
            <span className="char-count">{text.length}/200</span>
          </div>

          {/* Difficulty (only for Worker mode) */}
          {task.mode === 'worker' && (
            <div className="sched-field">
              <label className="sched-field-label">Difficulty</label>
              <DifficultySelector value={difficulty} onChange={setDifficulty} />
            </div>
          )}

          {/* Tags */}
          <div className="sched-field">
            <label className="sched-field-label">Tags</label>
            <TagInput tags={tags} onChange={setTags} placeholder="task tags…" />
          </div>

          {/* Date */}
          <div className="sched-field">
            <label className="sched-field-label">Scheduled Date</label>
            <input
              className="sched-date-input"
              type="date"
              value={dateStr}
              onChange={e => setDateStr(e.target.value)}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="sched-actions">
          <button type="button" className="msg-cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="msg-save-btn"
            onClick={handleSave}
            disabled={saving || !text.trim()}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
