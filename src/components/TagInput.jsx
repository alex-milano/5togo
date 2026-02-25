import { useState } from 'react'
import { getTagColor } from '../utils/balanceUtils'

/**
 * Tag input: type a tag and press Enter or comma to add.
 * Exposes value as string[] via onChange.
 */
export default function TagInput({ tags, onChange, placeholder = 'Add tag…' }) {
  const [draft, setDraft] = useState('')

  function commit(raw) {
    const clean = raw.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
    if (clean && !tags.includes(clean)) {
      onChange([...tags, clean])
    }
    setDraft('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commit(draft)
    }
    if (e.key === 'Backspace' && draft === '' && tags.length > 0) {
      onChange(tags.slice(0, -1))
    }
  }

  function removeTag(tag) {
    onChange(tags.filter(t => t !== tag))
  }

  return (
    <div className="tag-input-wrap">
      {tags.map(tag => {
        const c = getTagColor(tag)
        return (
          <span
            key={tag}
            className="tag-pill"
            style={{ background: c.bg, color: c.text, borderColor: c.border }}
          >
            #{tag}
            <button
              type="button"
              className="tag-pill-remove"
              onClick={() => removeTag(tag)}
              style={{ color: c.text }}
            >×</button>
          </span>
        )
      })}
      <input
        className="tag-input-field"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => draft.trim() && commit(draft)}
        placeholder={tags.length === 0 ? placeholder : ''}
        maxLength={30}
      />
    </div>
  )
}
