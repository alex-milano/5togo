import { STATUS_CONFIG } from '../utils/calendarUtils'

export default function DayCell({ dateStr, status, score, futureTaskCount, isToday, onClick }) {
  if (!dateStr) return <div className="day-cell day-cell-empty" />

  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.nodata
  const day = parseInt(dateStr.split('-')[2], 10)

  return (
    <button
      className={`day-cell ${cfg.cls} ${isToday ? 'dc-today' : ''}`}
      onClick={() => onClick(dateStr)}
      title={cfg.label}
    >
      <span className="dc-num">{day}</span>

      {/* Score badge — past/today with score */}
      {!['future', 'planned', 'nodata'].includes(status) && score > 0 && (
        <span className="dc-score">{score}</span>
      )}

      {/* Future task count badge */}
      {status === 'planned' && futureTaskCount > 0 && (
        <span className="dc-badge planned-badge">📅 {futureTaskCount}</span>
      )}

      {/* Status icon */}
      {status !== 'nodata' && status !== 'future' && (
        <span className="dc-icon">{cfg.icon}</span>
      )}

      {isToday && <span className="dc-today-dot" />}
    </button>
  )
}
