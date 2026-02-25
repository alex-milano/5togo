import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase/firebaseConfig'
import { useAuth } from '../contexts/AuthContext'
import { formatDate } from '../utils/dateUtils'
import { ArrowLeft, Edit3 } from 'lucide-react'
import EditProfileModal from '../components/EditProfileModal'

export default function Profile() {
  const { handle } = useParams()
  const { currentUser } = useAuth()

  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  // Load profile by handle
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const q = query(collection(db, 'users'), where('handle', '==', handle.toLowerCase()))
        const snap = await getDocs(q)
        if (snap.empty) {
          setNotFound(true)
          setLoading(false)
          return
        }
        const prof = { id: snap.docs[0].id, ...snap.docs[0].data() }
        setProfile(prof)

        // Load stats for this user
        const tSnap = await getDocs(query(
          collection(db, 'tasks'),
          where('userId', '==', prof.uid),
          where('status', '==', 'touchdown'),
        ))
        const completed = tSnap.docs.map(d => d.data())

        // Count peak days
        const byDate = {}
        completed.forEach(t => {
          if (!t.dateStr || t.mode !== 'worker') return
          byDate[t.dateStr] = (byDate[t.dateStr] || 0) + (t.difficulty || 1)
        })
        const peakDays = Object.values(byDate).filter(pts => pts >= 10).length

        // Top tags
        const tagCount = {}
        completed.forEach(t => {
          (t.tags || []).forEach(tag => {
            tagCount[tag] = (tagCount[tag] || 0) + 1
          })
        })
        const topTags = Object.entries(tagCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([tag]) => tag)

        setStats({ completedCount: completed.length, topTags, peakDays })
      } catch (e) {
        console.error('Profile load error:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [handle])

  const isOwnProfile = currentUser && profile && currentUser.uid === profile.uid

  if (loading) {
    return (
      <div className="profile-page">
        <div className="cal-loading">
          <div className="spinner" />
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="profile-page">
        <div className="profile-not-found">
          <p>No user found with handle <strong>@{handle}</strong></p>
          <Link to="/app" className="nav-btn">Back to App</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="profile-page">
      <div className="profile-back">
        <Link to="/app" className="nav-btn"><ArrowLeft size={14} /> Back</Link>
      </div>

      <div className="profile-card">
        {/* Avatar */}
        <div className="profile-avatar">
          {profile.displayName?.[0]?.toUpperCase() || '@'}
        </div>

        <div className="profile-info">
          <div className="profile-display-name">{profile.displayName}</div>
          <div className="profile-handle">@{profile.handle}</div>
          {profile.bio && <p className="profile-bio">{profile.bio}</p>}
          <div className="profile-meta">
            Member since {formatDate(profile.createdAt)}
          </div>
        </div>

        {isOwnProfile && (
          <button className="nav-btn" onClick={() => setShowEdit(true)}>
            <Edit3 size={13} /> Edit Profile
          </button>
        )}
      </div>

      {stats && (
        <div className="profile-stats">
          <div className="stat-card">
            <div className="stat-value">{stats.completedCount}</div>
            <div className="stat-label">Completed Tasks</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--gold)' }}>{stats.peakDays}</div>
            <div className="stat-label">Peak Days</div>
          </div>
        </div>
      )}

      {stats?.topTags?.length > 0 && (
        <div className="profile-tags-section">
          <div className="sched-field-label">Top Tags</div>
          <div className="profile-tags">
            {stats.topTags.map(tag => (
              <span key={tag} className="tag-chip">{tag}</span>
            ))}
          </div>
        </div>
      )}

      {showEdit && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => {
            setProfile(p => ({ ...p, ...updated }))
            setShowEdit(false)
          }}
        />
      )}
    </div>
  )
}
