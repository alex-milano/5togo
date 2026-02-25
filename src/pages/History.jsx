import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase/firebaseConfig'
import { useAuth } from '../contexts/AuthContext'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  getWeekDates, shortDayLabel, weekRangeLabel,
} from '../utils/dateUtils'
import { calcPoints, getScoreLevel, getBalanceStatus } from '../utils/balanceUtils'

export default function History() {
  const { currentUser } = useAuth()
  const [weekOffset, setWeekOffset]   = useState(0)
  const [activeTab,  setActiveTab]    = useState('work') // 'work' | 'life'
  const [tasks,      setTasks]        = useState([])
  const [restDays,   setRestDays]     = useState({})   // dateStr → reason
  const [loading,    setLoading]      = useState(true)

  const weekDates = getWeekDates(weekOffset)

  // Load all tasks + rest days for the visible week
  useEffect(() => {
    if (!currentUser) return
    setLoading(true)
    const tQuery = query(
      collection(db, 'tasks'),
      where('userId', '==', currentUser.uid),
      where('dateStr', '>=', weekDates[0]),
      where('dateStr', '<=', weekDates[6]),
    )
    const rQuery = query(
      collection(db, 'restDays'),
      where('userId', '==', currentUser.uid),
      where('date', '>=', weekDates[0]),
      where('date', '<=', weekDates[6]),
    )
    Promise.all([getDocs(tQuery), getDocs(rQuery)]).then(([tSnap, rSnap]) => {
      setTasks(tSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      const rd = {}
      rSnap.docs.forEach(d => { rd[d.data().date] = d.data().reason || 'Rest' })
      setRestDays(rd)
      setLoading(false)
    })
  }, [currentUser, weekDates[0]])

  // ── Derived per-day data ───────────────────────────────────────────────────
  const dayRows = weekDates.map(dateStr => {
    const isRest      = Boolean(restDays[dateStr])
    const restReason  = restDays[dateStr] || null
    const dayTasks    = tasks.filter(t => t.dateStr === dateStr)
    const workerDone  = dayTasks.filter(t => t.mode === 'worker' && t.status === 'touchdown')
    const workerTotal = dayTasks.filter(t => t.mode === 'worker')
    const lifeDone    = dayTasks.filter(t => t.mode === 'life'   && t.status === 'touchdown')
    const lifeTotal   = dayTasks.filter(t => t.mode === 'life')
    const pts         = isRest ? 0 : calcPoints(workerDone)
    const level       = getScoreLevel(pts)
    const balance     = getBalanceStatus(workerTotal.length, lifeTotal.length)
    return { dateStr, workerDone, workerTotal, lifeDone, lifeTotal, pts, level, balance, isRest, restReason }
  })

  // ── Weekly totals ──────────────────────────────────────────────────────────
  const weekPts       = dayRows.reduce((s, d) => s + d.pts, 0)
  const peakDays      = dayRows.filter(d => d.pts >= 5).length
  const totalWorker   = dayRows.reduce((s, d) => s + d.workerDone.length, 0)
  const totalLife     = dayRows.reduce((s, d) => s + d.lifeDone.length, 0)
  const weekLevel     = getScoreLevel(Math.round(weekPts / 7))

  return (
    <div className="history-page">
      {/* ── Back nav ── */}
      <div className="history-nav">
        <Link to="/app" className="history-back">
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
      </div>

      {/* ── Title ── */}
      <div className="history-title-row">
        <h1 className="history-title">📊 Weekly History</h1>
        <div className="week-nav">
          <button className="week-nav-btn" onClick={() => setWeekOffset(o => o - 1)}>
            <ChevronLeft size={16} />
          </button>
          <span className="week-nav-label">{weekRangeLabel(weekDates)}</span>
          <button
            className="week-nav-btn"
            onClick={() => setWeekOffset(o => o + 1)}
            disabled={weekOffset >= 0}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ── Weekly summary chips ── */}
      <div className="week-summary">
        <div className="ws-chip">
          <span className="ws-chip-val">{weekPts}</span>
          <span className="ws-chip-lbl">Total pts</span>
        </div>
        <div className="ws-chip">
          <span className="ws-chip-val">{peakDays}</span>
          <span className="ws-chip-lbl">Peak Days</span>
        </div>
        <div className="ws-chip">
          <span className="ws-chip-val">{totalWorker}</span>
          <span className="ws-chip-lbl">Worker Done</span>
        </div>
        <div className="ws-chip">
          <span className="ws-chip-val">{totalLife}</span>
          <span className="ws-chip-lbl">Life Done</span>
        </div>
        <div className={`ws-chip ws-level ${weekLevel.cls}`}>
          <span className="ws-chip-val">{weekLevel.icon}</span>
          <span className="ws-chip-lbl">Week: {weekLevel.label}</span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="history-tabs">
        <button
          className={`htab ${activeTab === 'work' ? 'htab-active' : ''}`}
          onClick={() => setActiveTab('work')}
        >⚡ Work History</button>
        <button
          className={`htab ${activeTab === 'life' ? 'htab-active' : ''}`}
          onClick={() => setActiveTab('life')}
        >🏠 Life Balance</button>
      </div>

      {loading ? (
        <div className="history-loading">
          <div className="spinner" />
        </div>
      ) : activeTab === 'work' ? (
        <WorkTab dayRows={dayRows} />
      ) : (
        <LifeTab dayRows={dayRows} />
      )}
    </div>
  )
}

// ── Work History tab ──────────────────────────────────────────────────────────
function WorkTab({ dayRows }) {
  const maxPts = Math.max(...dayRows.map(d => d.pts), 5)

  return (
    <div className="history-tab-content">
      {dayRows.map(({ dateStr, pts, level, workerDone, workerTotal, isRest, restReason }) => (
        <div key={dateStr} className={`day-row ${isRest ? 'day-row-rest' : ''}`}>
          <div className="day-row-left">
            <span className="day-label">{shortDayLabel(dateStr)}</span>
            {isRest
              ? <span className="day-level-badge rest-badge">🌿 Rest Day{restReason ? ` — ${restReason}` : ''}</span>
              : <span className={`day-level-badge ${level.cls}`}>{level.icon} {level.label}</span>
            }
          </div>

          {!isRest && (
            <div className="day-bar-wrap">
              <div className="day-bar-track">
                <div
                  className={`day-bar-fill ${level.cls}`}
                  style={{ width: `${Math.min((pts / maxPts) * 100, 100)}%` }}
                />
                <div className="day-bar-target" style={{ left: `${(5 / maxPts) * 100}%` }} />
              </div>
            </div>
          )}

          {!isRest && (
            <div className="day-row-right">
              <span className="day-pts">{pts}<span className="day-pts-label">pts</span></span>
              <span className="day-tasks-done">
                {workerDone.length}/{workerTotal.length} done
              </span>
            </div>
          )}

          {!isRest && workerDone.length > 0 && (
            <div className="day-task-list">
              {workerDone.map(t => (
                <span key={t.id} className="day-task-chip">
                  {'⭐'.repeat(t.difficulty || 1)} {t.text}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Life Balance tab ──────────────────────────────────────────────────────────
function LifeTab({ dayRows }) {
  return (
    <div className="history-tab-content">
      {dayRows.map(({ dateStr, lifeDone, lifeTotal, workerTotal, balance }) => (
        <div key={dateStr} className="life-day-row">
          <div className="day-row-left">
            <span className="day-label">{shortDayLabel(dateStr)}</span>
            <span className={`balance-badge ${balance.cls}`}>{balance.icon} {balance.label}</span>
          </div>

          <div className="life-bar-group">
            <div className="life-bar-item">
              <span className="life-bar-lbl">⚡ Worker</span>
              <div className="day-bar-track">
                <div
                  className="day-bar-fill worker-fill"
                  style={{ width: `${Math.min(workerTotal.length * 14, 100)}%` }}
                />
              </div>
              <span className="life-bar-count">{workerTotal.length}</span>
            </div>
            <div className="life-bar-item">
              <span className="life-bar-lbl">🏠 Life</span>
              <div className="day-bar-track">
                <div
                  className="day-bar-fill life-fill"
                  style={{ width: `${Math.min(lifeTotal.length * 14, 100)}%` }}
                />
              </div>
              <span className="life-bar-count">{lifeTotal.length}</span>
            </div>
          </div>

          <div className="day-row-right">
            <span className="life-done-badge">{lifeDone.length} life done</span>
          </div>

          {/* Completed life tasks */}
          {lifeDone.length > 0 && (
            <div className="day-task-list">
              {lifeDone.map(t => (
                <span key={t.id} className="day-task-chip life-chip">✅ {t.text}</span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
