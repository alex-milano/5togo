import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { db } from '../firebase/firebaseConfig'
import { useAuth } from '../contexts/AuthContext'
import { validateHandleFormat, checkHandleAvailable } from '../utils/handleValidation'

export default function EditProfileModal({ profile, onClose, onSaved }) {
  const { currentUser, updateUserProfile } = useAuth()

  const [displayName, setDisplayName] = useState(profile.displayName || '')
  const [handle, setHandle] = useState(profile.handle || '')
  const [bio, setBio] = useState(profile.bio || '')
  const [handleMsg, setHandleMsg] = useState('')
  const [handleOk, setHandleOk] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Debounced handle validation — skip check if unchanged
  useEffect(() => {
    if (handle === profile.handle) {
      setHandleMsg('')
      setHandleOk(true)
      return
    }
    setHandleOk(false)
    const fmt = validateHandleFormat(handle)
    if (!handle) {
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
        setHandleMsg('Already taken.')
        setHandleOk(false)
      }
    }, 500)
    return () => clearTimeout(t)
  }, [handle, profile.handle, currentUser?.uid])

  async function handleSave(e) {
    e.preventDefault()
    if (!handleOk || !displayName.trim()) return
    setSaving(true)
    setError('')
    try {
      const data = {
        displayName: displayName.trim(),
        handle: handle.trim().toLowerCase(),
        bio: bio.trim(),
      }
      await updateUserProfile(data)
      onSaved(data)
    } catch (err) {
      setError('Save failed. Try again.')
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
      <div className="modal-box edit-profile-modal" onClick={e => e.stopPropagation()}>
        <div className="sched-header">
          <h3 className="sched-title">Edit Profile</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {error && <div className="auth-error" style={{ marginBottom: 12 }}>{error}</div>}

        <form className="sched-form" onSubmit={handleSave}>
          <div className="sched-field">
            <label className="sched-field-label">Display Name</label>
            <input
              className="auth-input"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              maxLength={40}
              required
            />
          </div>

          <div className="sched-field">
            <label className="sched-field-label">Handle</label>
            <div className="handle-input-wrap">
              <span className="handle-at">@</span>
              <input
                className={`auth-input handle-input ${handleOk ? 'handle-ok' : ''}`}
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
          </div>

          <div className="sched-field">
            <label className="sched-field-label">Bio (optional)</label>
            <textarea
              className="msg-textarea"
              value={bio}
              onChange={e => setBio(e.target.value)}
              maxLength={200}
              rows={3}
              placeholder="Tell people about yourself…"
            />
          </div>

          <div className="sched-actions">
            <button type="button" className="msg-cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="msg-save-btn"
              disabled={saving || !handleOk || !displayName.trim()}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
