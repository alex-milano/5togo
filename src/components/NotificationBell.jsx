import { useState, useEffect, useRef } from 'react'
import { Bell } from 'lucide-react'
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/firebaseConfig'
import { markNotificationRead, markAllNotificationsRead } from '../utils/shareUtils'

function formatTime(timestamp) {
  if (!timestamp) return '—'
  const ts = timestamp.seconds ? timestamp.seconds * 1000 : timestamp
  const now = Date.now()
  const diff = now - ts

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) {
    const d = new Date(ts)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function NotificationBell({ currentUser }) {
  const [notifs, setNotifs] = useState([])
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)

  const unreadCount = notifs.filter(n => !n.read).length

  // Real-time listener
  useEffect(() => {
    if (!currentUser) return
    const q = query(
      collection(db, 'sharedTaskNotifications'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    )
    return onSnapshot(q, snap => {
      const loaded = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setNotifs(loaded)
    })
  }, [currentUser])

  // Outside-click close
  useEffect(() => {
    if (!open) return
    const handleClick = e => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  async function handleMarkRead(id) {
    await markNotificationRead(id)
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead(notifs)
  }

  return (
    <div className="notif-bell" ref={panelRef}>
      <button className="nav-btn notif-bell-btn" onClick={() => setOpen(!open)}>
        <Bell size={14} />
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notif-panel">
          <div className="np-header">
            <span className="np-title">Notifications</span>
            {unreadCount > 0 && (
              <button className="np-mark-all" onClick={handleMarkAllRead}>
                Mark all read
              </button>
            )}
          </div>

          <div className="np-list">
            {notifs.length === 0 ? (
              <div className="np-empty">No notifications yet</div>
            ) : (
              notifs.map(n => (
                <div
                  key={n.id}
                  className={`np-item ${!n.read ? 'unread' : ''}`}
                  onClick={() => !n.read && handleMarkRead(n.id)}
                >
                  <div className="np-from">
                    Shared by <strong>@{n.sharedByHandle}</strong>
                  </div>
                  <div className="np-item-task">{n.taskText}</div>
                  <div className="np-item-time">{formatTime(n.createdAt)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
