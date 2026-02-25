const OPTIONS = [
  { value: 1, label: '⭐ Easy',   cls: 'diff-easy'   },
  { value: 2, label: '⭐⭐ Med',  cls: 'diff-medium' },
  { value: 3, label: '⭐⭐⭐ Hard', cls: 'diff-hard'   },
]

export default function DifficultySelector({ value, onChange }) {
  return (
    <div className="diff-selector">
      {OPTIONS.map(o => (
        <button
          key={o.value}
          type="button"
          className={`diff-opt ${o.cls} ${value === o.value ? 'selected' : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
