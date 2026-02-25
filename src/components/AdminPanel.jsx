import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  collection, getDocs, query, orderBy,
  addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase/firebaseConfig'
import { useAuth } from '../contexts/AuthContext'
import { ArrowLeft, Shield, Plus, Pencil, Trash2, MessageSquare } from 'lucide-react'
import { formatDate } from '../utils/dateUtils'
import { seedMessages } from '../utils/seedMessages'
import Navbar from './Navbar'

// ─── Blank form state ─────────────────────────────────────────────────────────
const BLANK = { text: '', author: '', isActive: true }

export default function AdminPanel() {
  const { currentUser } = useAuth()

  // ── Users ──────────────────────────────────────────────────────────────────
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  // ── Messages ───────────────────────────────────────────────────────────────
  const [messages,    setMessages]    = useState([])
  const [msgLoading,  setMsgLoading]  = useState(true)
  const [showForm,    setShowForm]    = useState(false)
  const [editingId,   setEditingId]   = useState(null)   // null = new
  const [form,        setForm]        = useState(BLANK)
  const [saving,      setSaving]      = useState(false)
  const [seeding,     setSeeding]     = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)  // id to confirm delete

  // ── Load users ─────────────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchUsers() {
      try {
        const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'))
        const snap = await getDocs(q)
        setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (e) {
        setError('Could not load users. Check Firestore security rules.')
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  // ── Real-time messages listener ────────────────────────────────────────────
  useEffect(() => {
    const q = query(collection(db, 'motivationalMessages'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setMsgLoading(false)
    }, err => {
      console.error('AdminPanel messages:', err)
      setMsgLoading(false)
    })
    return unsub
  }, [])

  // ── Form helpers ───────────────────────────────────────────────────────────
  function openNew() {
    setEditingId(null)
    setForm(BLANK)
    setShowForm(true)
  }

  function openEdit(msg) {
    setEditingId(msg.id)
    setForm({ text: msg.text || '', author: msg.author || '', isActive: msg.isActive ?? true })
    setShowForm(true)
  }

  function cancelForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(BLANK)
  }

  async function handleSave(e) {
    e.preventDefault()
    const text = form.text.trim()
    if (!text) return
    setSaving(true)
    try {
      if (editingId) {
        await updateDoc(doc(db, 'motivationalMessages', editingId), {
          text,
          author:    form.author.trim() || null,
          isActive:  form.isActive,
          updatedAt: serverTimestamp(),
        })
      } else {
        await addDoc(collection(db, 'motivationalMessages'), {
          text,
          author:    form.author.trim() || null,
          isActive:  form.isActive,
          createdBy: currentUser.uid,
          createdAt: serverTimestamp(),
        })
      }
      cancelForm()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(msg) {
    await updateDoc(doc(db, 'motivationalMessages', msg.id), {
      isActive: !msg.isActive,
    })
  }

  async function handleDelete(id) {
    await deleteDoc(doc(db, 'motivationalMessages', id))
    setDeleteConfirm(null)
  }

  async function handleSeed() {
    if (!currentUser) return
    setSeeding(true)
    try {
      await seedMessages(db, currentUser.uid)
    } catch (err) {
      console.error(err)
    } finally {
      setSeeding(false)
    }
  }

  // ── Computed ───────────────────────────────────────────────────────────────
  const adminCount  = users.filter(u => u.role === 'admin').length
  const userCount   = users.filter(u => u.role !== 'admin').length
  const activeCount = messages.filter(m => m.isActive).length
  const charOver    = form.text.length > 200

  return (
    <div className="app-layout">
      <Navbar completedToday={0} streak={0} onOpenSettings={() => {}} />

      <div className="admin-page">

        {/* ── Header ── */}
        <div className="admin-header">
          <Link to="/app" className="nav-btn" style={{ display: 'inline-flex', marginBottom: 16 }}>
            <ArrowLeft size={14} /> Back to App
          </Link>
          <div className="admin-title">
            <Shield size={22} />
            Admin Panel
            <span className="admin-badge">ADMIN</span>
          </div>
          <p className="admin-sub">
            Signed in as <strong>{currentUser?.email}</strong>
          </p>
        </div>

        {/* ── User Stats ── */}
        {!loading && !error && (
          <div className="admin-stats">
            <div className="stat-card">
              <div className="stat-value">{users.length}</div>
              <div className="stat-label">Total Users</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--green)' }}>{userCount}</div>
              <div className="stat-label">Regular Users</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--purple)' }}>{adminCount}</div>
              <div className="stat-label">Admins</div>
            </div>
          </div>
        )}

        {/* ── Users table ── */}
        {loading && (
          <div style={{ padding: 32, textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto' }} />
          </div>
        )}

        {error && <div className="auth-error">{error}</div>}

        {!loading && !error && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>User ID</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td style={{ color: 'var(--text)', fontWeight: 500 }}>
                      {user.email}
                    </td>
                    <td>
                      <span className={`admin-role-badge role-${user.role}`}>
                        {(user.role || 'user').toUpperCase()}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>
                      {user.uid}
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            MOTIVATIONAL MESSAGES SECTION
        ══════════════════════════════════════════════════ */}
        <div className="admin-section-header">
          <div className="admin-section-title">
            <MessageSquare size={16} />
            Motivational Messages
            <span className="admin-section-count">{activeCount} active / {messages.length} total</span>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {messages.length === 0 && !msgLoading && (
              <button
                className="msg-seed-btn"
                onClick={handleSeed}
                disabled={seeding}
              >
                {seeding ? 'Seeding…' : '✨ Seed 33 Default Messages'}
              </button>
            )}
            <button className="msg-save-btn" onClick={openNew} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={13} /> New Message
            </button>
          </div>
        </div>

        {/* ── Add / Edit form ── */}
        {showForm && (
          <form className="msg-form" onSubmit={handleSave}>
            <div className="msg-form-title">
              {editingId ? '✏️ Edit Message' : '➕ New Message'}
            </div>

            <div>
              <textarea
                className="msg-textarea"
                placeholder="Enter motivational message… (max 200 chars)"
                value={form.text}
                onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
                maxLength={210}
                required
              />
              <div className={`msg-char-count ${charOver ? 'over-limit' : ''}`}>
                {form.text.length}/200
              </div>
            </div>

            <input
              className="msg-author-input"
              placeholder="Author (optional, max 50 chars)"
              value={form.author}
              onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
              maxLength={50}
            />

            <div className="msg-form-row">
              <label className="msg-form-active-label">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                />
                Active (shown as daily message)
              </label>

              <div className="msg-form-actions">
                <button type="button" className="msg-cancel-btn" onClick={cancelForm}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="msg-save-btn"
                  disabled={saving || charOver || !form.text.trim()}
                >
                  {saving ? 'Saving…' : editingId ? 'Update' : 'Add'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ── Messages list ── */}
        {msgLoading ? (
          <div style={{ padding: '16px 0', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : (
          <div className="msg-list">
            {messages.length === 0 && (
              <div style={{ color: 'var(--text3)', fontSize: '0.82rem', padding: '8px 0' }}>
                No messages yet. Add one above or seed default messages.
              </div>
            )}

            {messages.map(msg => (
              <div key={msg.id} className={`msg-row ${msg.isActive ? '' : 'msg-inactive'}`}>
                <div className="msg-body">
                  <div className="msg-text">"{msg.text}"</div>
                  {msg.author && <div className="msg-author">— {msg.author}</div>}
                </div>

                <div className="msg-actions">
                  {/* Active toggle pill */}
                  <button
                    className={`msg-active-badge ${msg.isActive ? 'is-active' : 'is-inactive'}`}
                    onClick={() => toggleActive(msg)}
                    title={msg.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {msg.isActive ? '✓ Active' : '○ Off'}
                  </button>

                  {/* Edit */}
                  <button
                    className="msg-icon-btn"
                    onClick={() => openEdit(msg)}
                    title="Edit"
                  >
                    <Pencil size={11} />
                  </button>

                  {/* Delete */}
                  {deleteConfirm === msg.id ? (
                    <>
                      <button
                        className="msg-icon-btn delete-btn"
                        onClick={() => handleDelete(msg.id)}
                      >
                        Confirm
                      </button>
                      <button
                        className="msg-icon-btn"
                        onClick={() => setDeleteConfirm(null)}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      className="msg-icon-btn delete-btn"
                      onClick={() => setDeleteConfirm(msg.id)}
                      title="Delete"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
