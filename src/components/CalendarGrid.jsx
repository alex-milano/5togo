import DayCell from './DayCell'
import { WEEKDAY_LABELS } from '../utils/calendarUtils'

export default function CalendarGrid({ cells, dayDataMap, today, onDayClick }) {
  return (
    <div className="calendar-grid">
      {/* Weekday headers */}
      <div className="cgrid-headers">
        {WEEKDAY_LABELS.map(d => (
          <div key={d} className="cgrid-day-label">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="cgrid-cells">
        {cells.map((dateStr, i) => {
          if (!dateStr) return <div key={i} className="day-cell day-cell-empty" />
          const d = dayDataMap[dateStr] || {}
          return (
            <DayCell
              key={dateStr}
              dateStr={dateStr}
              status={d.status || 'nodata'}
              score={d.score || 0}
              futureTaskCount={d.futureTaskCount || 0}
              isToday={dateStr === today}
              onClick={onDayClick}
            />
          )
        })}
      </div>
    </div>
  )
}
