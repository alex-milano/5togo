import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase/firebaseConfig'
import { useAuth } from '../contexts/AuthContext'
import { ArrowLeft, Shield } from 'lucide-react'
import { formatDate } from '../utils/dateUtils'
import Navbar from './Navbar'

export default function AdminPanel() {
  const { currentUser } = useAuth()
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

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

  const adminCount = users.filter(u => u.role === 'admin').length
  const userCount  = users.filter(u => u.role !== 'admin').length

  return (
    <div className="app-layout">
      <Navbar completedToday={0} streak={0} onOpenSettings={() => {}} />

      <div className="admin-page">
        {/* Header */}
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

        {/* Stats */}
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

        {/* Content */}
        {loading && (
          <div style={{ padding: 32, textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto' }} />
          </div>
        )}

        {error && (
          <div className="auth-error">{error}</div>
        )}

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
      </div>
    </div>
  )
}
