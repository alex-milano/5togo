import { useState } from 'react'
import { updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../firebase/firebaseConfig'
import { relativeDateLabel } from '../utils/calendarUtils'
import { todayStr } from '../utils/dateUtils'

const STARS = { 1: '⭐', 2: '⭐⭐', 3: '⭐⭐⭐' }

export default function UpcomingTasksSection({ tasks, onOpenSchedule }) {
  const today = todayStr()

  // Group by date, only future dates
  const futureTasks = tasks
    .filter(t => t.dateStr > today && (t.status === 'locked' || t.status === 'progress'))
    .sort((a, b) => a.dateStr.localeCompare(b.dateStr))

  if (futureTasks.length === 0) return null

  // Group
  const grouped = {}
  for (const t of futureTasks) {
    if (!grouped[t.dateStr]) grouped[t.dateStr] = []
    grouped[t.dateStr].push(t)
  }

  return (
    <div className="upcoming-section">
      <div className="upcoming-header">
        <span className="upcoming-title">📅 Upcoming Scheduled Tasks</span>
        <button className="upcoming-add-btn" onClick={onOpenSchedule}>+ Schedule</button>
      </div>

      <div className="upcoming-groups">
        {Object.entries(grouped).map(([dateStr, dayTasks]) => (
          <UpcomingDayGroup
            key={dateStr}
            dateStr={dateStr}
            tasks={dayTasks}
            today={today}
          />
        ))}
      </div>
    </div>
  )
}

function UpcomingDayGroup({ dateStr, tasks, today }) {
  const [confirmId, setConfirmId] = useState(null)

  async function moveToToday(task) {
    await updateDoc(doc(db, 'tasks', task.id), { dateStr: today })
  }

  async function deleteTask(id) {
    await deleteDoc(doc(db, 'tasks', id))
    setConfirmId(null)
  }

  return (
    <div className="upcoming-group">
      <div className="upcoming-day-label">{relativeDateLabel(dateStr, today)}</div>
      {tasks.map(t => (
        <div key={t.id} className="upcoming-task-row">
          <span className="utr-mode">{t.mode === 'worker' ? '⚡' : '🏠'}</span>
          <span className="utr-text">{t.text}</span>
          {t.mode === 'worker' && t.difficulty && (
            <span className="utr-stars">{STARS[t.difficulty] || '⭐'}</span>
          )}
          <div className="utr-actions">
            <button className="utr-btn move-btn" onClick={() => moveToToday(t)} title="Move to Today">
              ↑ Today
            </button>
            {confirmId === t.id ? (
              <>
                <button className="utr-btn del-confirm" onClick={() => deleteTask(t.id)}>Confirm</button>
                <button className="utr-btn" onClick={() => setConfirmId(null)}>Cancel</button>
              </>
            ) : (
              <button className="utr-btn del-btn" onClick={() => setConfirmId(t.id)}>🗑</button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
