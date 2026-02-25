// ViewSelector — desktop panel mode toggle (split / worker-only / life-only)
// Persists in localStorage — UI preference, not Firebase

const MODES = [
  { key: 'worker', icon: '⚡', label: 'Worker' },
  { key: 'split',  icon: '👁️', label: 'Split'  },
  { key: 'life',   icon: '🏠', label: 'Life'   },
]

export default function ViewSelector({ viewMode, onChange }) {
  return (
    <div className="view-selector" role="group" aria-label="Panel view mode">
      {MODES.map(m => (
        <button
          key={m.key}
          className={`vs-btn ${viewMode === m.key ? 'vs-active' : ''}`}
          onClick={() => onChange(m.key)}
          title={`${m.label} view`}
        >
          <span className="vs-icon">{m.icon}</span>
          <span className="vs-label">{m.label}</span>
        </button>
      ))}
    </div>
  )
}
