import { useState, useEffect } from 'react'
import { db } from '../firebase/firebaseConfig'
import { useAuth } from '../contexts/AuthContext'
import { validateHandleFormat, checkHandleAvailable } from '../utils/handleValidation'

export default function SetHandleModal() {
  const { currentUser, updateUserProfile, logout } = useAuth()

  const [displayName, setDisplayName] = useState('')
  const [handle, setHandle] = useState('')
  const [handleMsg, setHandleMsg] = useState('')
  const [handleOk, setHandleOk] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Debounced handle check — 500ms
  useEffect(() => {
    setHandleOk(false)
    const fmt = validateHandleFormat(handle)
    if (handle.length === 0) {
      setHandleMsg('')
      return
    }
    if (fmt) {
      setHandleMsg(fmt)
      return
    }
    setHandleMsg('Checking…')
    const t = setTimeout(async () => {
      const available = await checkHandleAvailable(db, handle, currentUser?.uid)
      if (available) {
        setHandleMsg('✓ Available')
        setHandleOk(true)
      } else {
        setHandleMsg('Handle already taken.')
        setHandleOk(false)
      }
    }, 500)
    return () => clearTimeout(t)
  }, [handle, currentUser?.uid])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!handleOk || !displayName.trim()) return
    setSaving(true)
    setError('')
    try {
      await updateUserProfile({
        handle: handle.trim().toLowerCase(),
        displayName: displayName.trim(),
        bio: '',
      })
      // onSnapshot in AuthContext will update userProfile → needsHandle becomes false → modal disappears
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay open">
      <div className="modal-box set-handle-modal">
        <div className="shm-header">
          <span className="shm-logo">5<span>to</span>Go</span>
          <p className="shm-title">Set Up Your Profile</p>
          <p className="shm-sub">Choose a handle to identify yourself. This cannot be changed easily.</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form className="sched-form" onSubmit={handleSubmit}>
          {/* Display Name */}
          <div className="sched-field">
            <label className="sched-field-label">Display Name</label>
            <input
              className="auth-input"
              placeholder="Your name"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              maxLength={40}
              required
              autoFocus
            />
          </div>

          {/* Handle */}
          <div className="sched-field">
            <label className="sched-field-label">Handle</label>
            <div className="handle-input-wrap">
              <span className="handle-at">@</span>
              <input
                className={`auth-input handle-input ${handleOk ? 'handle-ok' : handleMsg && !handleOk ? 'handle-err' : ''}`}
                placeholder="your_handle"
                value={handle}
                onChange={e => setHandle(e.target.value.toLowerCase())}
                maxLength={20}
                required
                autoComplete="off"
              />
            </div>
            {handleMsg && (
              <span className={`handle-hint ${handleOk ? 'handle-hint-ok' : 'handle-hint-err'}`}>
                {handleMsg}
              </span>
            )}
            <span className="sched-field-label" style={{ marginTop: 2 }}>
              3–20 chars. Letters, numbers, underscore only.
            </span>
          </div>

          <button
            className="auth-submit"
            type="submit"
            disabled={saving || !handleOk || !displayName.trim()}
          >
            {saving ? 'Saving…' : 'Set Handle & Continue'}
          </button>
        </form>

        <button className="shm-logout" onClick={logout}>
          Sign out instead
        </button>
      </div>
    </div>
  )
}
