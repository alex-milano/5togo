import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '../firebase/firebaseConfig'
import { shareTask } from '../utils/shareUtils'

export default function ShareTaskModal({ task, currentUser, userProfile, onClose }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState([])
  const [saving, setSaving] = useState(false)
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef(null)

  const myHandle = userProfile?.handle || null

  // Debounced search
  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setResults([])
      return
    }

    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      const lower = searchQuery.trim().toLowerCase()
      try {
        const snap = await getDocs(
          query(
            collection(db, 'users'),
            where('handle', '>=', lower),
            where('handle', '<=', lower + '\uf8ff'),
            orderBy('handle'),
            limit(5)
          )
        )
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        // Filter: exclude self, exclude already in task.sharedWith, exclude already selected
        const filtered = docs.filter(u =>
          u.handle !== myHandle &&
          !(task.sharedWith || []).includes(u.handle) &&
          !selected.some(s => s.handle === u.handle)
        )
        setResults(filtered)
      } catch (e) {
        console.error('Search error:', e)
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 400)
  }, [searchQuery, myHandle, task.sharedWith, selected])

  function handleSelectUser(user) {
    setSelected([...selected, { handle: user.handle, userId: user.uid, displayName: user.displayName }])
    setSearchQuery('')
    setResults([])
  }

  function handleRemoveSelected(handle) {
    setSelected(selected.filter(s => s.handle !== handle))
  }

  async function handleConfirm() {
    if (!selected.length) return
    setSaving(true)
    try {
      await shareTask(task.id, selected, task, myHandle)
      onClose()
    } catch (e) {
      console.error('Share failed:', e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="modal-overlay open"
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal-box share-modal" onClick={e => e.stopPropagation()}>
        <div className="sched-header">
          <h3 className="sched-title">Share Task</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Task preview */}
        <div className="share-task-text">
          {task.text}
        </div>

        {/* Already shared with */}
        {(task.sharedWith || []).length > 0 && (
          <div className="share-existing-section">
            <div className="share-label">Already shared with:</div>
            <div className="share-chips">
              {(task.sharedWith || []).map(handle => (
                <span key={handle} className="share-chip-existing">
                  @{handle}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Selected chips */}
        {selected.length > 0 && (
          <div className="share-selected-section">
            <div className="share-label">Adding:</div>
            <div className="share-chips">
              {selected.map(u => (
                <span key={u.handle} className="share-chip-selected">
                  @{u.handle}
                  <button
                    className="chip-remove"
                    onClick={() => handleRemoveSelected(u.handle)}
                    type="button"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="share-search-wrap">
          <input
            className="share-search-input"
            placeholder="Search by handle (min 2 chars)…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            autoFocus
            autoComplete="off"
          />
        </div>

        {/* Results */}
        {searching && (
          <div className="share-results">
            <div className="share-loading">Searching…</div>
          </div>
        )}
        {!searching && searchQuery.length >= 2 && results.length === 0 && (
          <div className="share-results">
            <div className="share-no-results">No users found</div>
          </div>
        )}
        {!searching && results.length > 0 && (
          <div className="share-results">
            {results.map(user => (
              <button
                key={user.id}
                className="share-result-item"
                onClick={() => handleSelectUser(user)}
                type="button"
              >
                <div className="sri-avatar">{user.displayName?.[0]?.toUpperCase() || user.handle[0].toUpperCase()}</div>
                <div className="sri-info">
                  <div className="sri-handle">@{user.handle}</div>
                  <div className="sri-name">{user.displayName || '—'}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="share-actions">
          <button type="button" className="msg-cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="msg-save-btn"
            onClick={handleConfirm}
            disabled={saving || selected.length === 0}
          >
            {saving ? 'Sharing…' : `Share (${selected.length})`}
          </button>
        </div>
      </div>
    </div>
  )
}
