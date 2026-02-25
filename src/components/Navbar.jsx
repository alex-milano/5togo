import { Link, useNavigate } from 'react-router-dom'
import { LogOut, Settings as SettingsIcon, Shield, BarChart2, CalendarDays, User } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getScoreLevel, ZONES } from '../utils/balanceUtils'
import ThemeToggle from './ThemeToggle'
import NotificationBell from './NotificationBell'

export default function Navbar({ todayPoints = 0, streak = 0, zone = 'empty', onOpenSettings }) {
  const { currentUser, userRole, userProfile, logout } = useAuth()
  const navigate = useNavigate()
  const level    = getScoreLevel(todayPoints)
  const zoneData = ZONES[zone] || ZONES.empty

  async function handleLogout() {
    try { await logout() } catch (e) { console.error(e) }
  }

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/app" className="nav-logo">
          5<span className="nav-logo-accent">to</span>Go
        </Link>
        <span className="nav-tagline">5 YARDS TO TOUCHDOWN</span>
      </div>

      <div className="navbar-center">
        <div className="nav-score">
          <span className="nav-score-label">TODAY</span>
          <span className={`nav-score-value ${level.cls}`}>{todayPoints}</span>
          <span className="nav-score-sep">/10 pts</span>
          <div className="nav-score-divider" />
          <span className={`nav-score-status ${level.cls}`}>{level.icon} {level.label}</span>
        </div>

        <div className={`nav-zone-pill ${zoneData.cls}`}>{zoneData.label}</div>

        {streak > 0 && (
          <div className="nav-streak">
            <span>🔥</span>
            <span className="nav-streak-num">{streak}</span>
            <span className="nav-streak-label">day streak</span>
          </div>
        )}
      </div>

      <div className="navbar-right">
        <ThemeToggle />
        <NotificationBell currentUser={currentUser} />
        {userProfile?.handle && (
          <Link to={`/profile/${userProfile.handle}`} className="nav-btn">
            <User size={14} /> Profile
          </Link>
        )}
        <Link to="/calendar" className="nav-btn">
          <CalendarDays size={14} /> Calendar
        </Link>
        <Link to="/history" className="nav-btn">
          <BarChart2 size={14} /> History
        </Link>
        <button className="nav-btn" onClick={onOpenSettings}>
          <SettingsIcon size={14} /> Settings
        </button>
        {userRole === 'admin' && (
          <Link to="/admin" className="nav-btn admin">
            <Shield size={14} /> Admin
          </Link>
        )}
        <button className="nav-btn logout" onClick={handleLogout}>
          <LogOut size={14} /> {userProfile?.handle ? `@${userProfile.handle}` : currentUser?.email?.split('@')[0]}
        </button>
      </div>
    </nav>
  )
}
