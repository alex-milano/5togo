import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/firebaseConfig'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

const THEME_LIST = [
  { id: 'normal',     icon: '🏆', name: 'Default',    desc: 'Classic sports dark theme'  },
  { id: 'aesthetic',  icon: '✨', name: 'Aesthetic',  desc: 'Soft pastel vibes'           },
  { id: 'football',   icon: '🏈', name: 'Football',   desc: 'Green field energy'          },
  { id: 'soccer',     icon: '⚽', name: 'Soccer',     desc: 'Pitch-ready look'            },
  { id: 'basketball', icon: '🏀', name: 'Basketball', desc: 'Court colors'                },
  { id: 'baseball',   icon: '⚾', name: 'Baseball',   desc: 'Diamond classic'             },
]

export default function Settings({ isOpen, onClose }) {
  const { currentUser } = useAuth()
  const { themeName }   = useTheme()      // live value from ThemeContext
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  async function handleSelect(id) {
    if (!currentUser || saving || id === themeName) return
    setSaving(true)
    try {
      await updateDoc(doc(db, 'userSettings', currentUser.uid), {
        theme: id,
        updatedAt: serverTimestamp(),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    } catch (e) {
      console.error('Settings save error:', e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className={`settings-overlay ${isOpen ? 'open' : ''}`}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="settings-box">
        <div className="settings-header">
          <span className="settings-title">⚙️ Settings</span>
          <button className="settings-close" onClick={onClose}><X size={18} /></button>
        </div>

        <p className="settings-section-label">Visual Theme</p>
        <p style={{ fontSize: '0.72rem', color: 'var(--text2)', marginBottom: 14 }}>
          Theme changes apply instantly — column names, colors and accents all update.
        </p>

        <div className="theme-grid">
          {THEME_LIST.map(t => (
            <button
              key={t.id}
              className={`theme-btn ${themeName === t.id ? 'active' : ''}`}
              onClick={() => handleSelect(t.id)}
              disabled={saving}
              title={t.desc}
            >
              <span className="theme-btn-icon">{t.icon}</span>
              <span className="theme-btn-name">{t.name}</span>
              {themeName === t.id && <span className="theme-btn-check">✓</span>}
            </button>
          ))}
        </div>

        {saved && (
          <div className="settings-saved">✓ Theme applied!</div>
        )}

        <div className="settings-user">
          Signed in as <strong>{currentUser?.email}</strong>
        </div>
      </div>
    </div>
  )
}
