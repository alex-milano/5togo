import { useNavigate } from 'react-router-dom'

export default function UserCard({ user }) {
  const navigate = useNavigate()
  const initial = user.displayName?.[0]?.toUpperCase() || user.handle?.[0]?.toUpperCase() || '?'

  return (
    <div className="user-card" onClick={() => navigate(`/profile/${user.handle}`)}>
      <div className="uc-avatar">{initial}</div>
      <div className="uc-info">
        <div className="uc-display-name">{user.displayName || '—'}</div>
        <div className="uc-handle">@{user.handle}</div>
      </div>
    </div>
  )
}
