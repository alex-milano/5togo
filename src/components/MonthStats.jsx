export default function MonthStats({ stats }) {
  const items = [
    { icon: '🔥', label: 'Peak Days',    value: stats.peakDays    },
    { icon: '💪', label: 'Solid Days',   value: stats.solidDays   },
    { icon: '🌿', label: 'Rest Days',    value: stats.restDays    },
    { icon: '📅', label: 'Planned',      value: stats.plannedDays },
    { icon: '📊', label: 'Avg Score',    value: stats.avgScore    },
    { icon: '⚡', label: 'Best Streak',  value: stats.longestStreak },
  ]

  return (
    <div className="month-stats">
      {items.map(item => (
        <div key={item.label} className="ms-card">
          <span className="ms-icon">{item.icon}</span>
          <span className="ms-value">{item.value}</span>
          <span className="ms-label">{item.label}</span>
        </div>
      ))}
    </div>
  )
}
