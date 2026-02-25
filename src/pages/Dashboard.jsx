import { useState, useEffect, useCallback, useRef } from 'react'
import {
  collection, query, where, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc,
  serverTimestamp, getDoc, setDoc,
} from 'firebase/firestore'
import { db } from '../firebase/firebaseConfig'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import Navbar from '../components/Navbar'
import WorkerBoard from '../components/WorkerBoard'
import LifeBoard from '../components/LifeBoard'
import KanbanColumn from '../components/KanbanColumn'
import Settings from '../components/Settings'
import Confetti from '../components/Confetti'
import { todayStr, yesterdayStr, getWeekNumber, getDateNDaysAgo } from '../utils/dateUtils'
import { calcPoints, getScoreLevel, getZone } from '../utils/balanceUtils'

export default function Dashboard() {
  const { currentUser } = useAuth()
  const { themeData }   = useTheme()

  // ── All tasks (real-time) ──────────────────────────────────────────────────
  const [tasks, setTasks]         = useState([])
  const [streak, setStreak]       = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [showPeakModal, setShowPeakModal] = useState(false)
  const [showConfetti,  setShowConfetti]  = useState(false)
  const [showRecovery,  setShowRecovery]  = useState(false)
  const [mobileView,    setMobileView]    = useState('worker') // 'worker' | 'life'
  const [draggingId,    setDraggingId]    = useState(null)
  const peakShownRef   = useRef(null)
  const frozenRef      = useRef(false)  // prevent double-freeze runs

  const today = todayStr()

  // ── Firestore listener ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return
    const q = query(collection(db, 'tasks'), where('userId', '==', currentUser.uid))
    return onSnapshot(q, snap => {
      const loaded = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      loaded.sort((a, b) => {
        if (a.status === 'touchdown' && b.status !== 'touchdown') return 1
        if (b.status === 'touchdown' && a.status !== 'touchdown') return -1
        return (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)
      })
      setTasks(loaded)
    })
  }, [currentUser])

  // ── Load streak ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return
    getDoc(doc(db, 'userSettings', currentUser.uid)).then(snap => {
      if (snap.exists()) {
        setStreak(snap.data().streak || 0)
        peakShownRef.current = snap.data().peakModalShownDate || null
      }
    })
  }, [currentUser])

  // ── Auto-freeze expired Worker tasks ───────────────────────────────────────
  useEffect(() => {
    if (!tasks.length || frozenRef.current) return
    const toFreeze = tasks.filter(t =>
      t.mode === 'worker' &&
      t.dateStr && t.dateStr < today &&
      (t.status === 'locked' || t.status === 'progress')
    )
    if (toFreeze.length === 0) return
    frozenRef.current = true
    Promise.all(toFreeze.map(t => updateDoc(doc(db, 'tasks', t.id), { status: 'ice' })))
      .finally(() => setTimeout(() => { frozenRef.current = false }, 5000))
  }, [tasks, today])

  // ── Derived ────────────────────────────────────────────────────────────────
  const workerTasks       = tasks.filter(t => t.mode === 'worker' && t.status !== 'ice')
  const lifeTasks         = tasks.filter(t => t.mode === 'life'   && t.status !== 'ice')
  const iceTasks          = tasks.filter(t => t.status === 'ice')

  const todayWorker       = tasks.filter(t => t.mode === 'worker' && t.dateStr === today)
  const activeWorkerCount = todayWorker.filter(t => t.status !== 'ice').length
  const completedWorker   = todayWorker.filter(t => t.status === 'touchdown')
  const todayPoints       = calcPoints(completedWorker)

  const todayLife         = tasks.filter(t => t.mode === 'life' && t.dateStr === today && t.status === 'touchdown')
  const zone              = getZone(activeWorkerCount)

  // ── Watch for PEAK DAY ─────────────────────────────────────────────────────
  useEffect(() => {
    if (todayPoints >= 10 && peakShownRef.current !== today) {
      peakShownRef.current = today
      handleStreak()
      setShowPeakModal(true)
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 4500)
    }
  }, [todayPoints])

  async function handleStreak() {
    if (!currentUser) return
    const ref = doc(db, 'userSettings', currentUser.uid)
    const snap = await getDoc(ref)
    const data = snap.exists() ? snap.data() : {}
    const last = data.lastPeakDay || null
    const yest = yesterdayStr()

    const newStreak = last === today  ? (data.streak || 1)
                    : last === yest   ? (data.streak || 0) + 1
                    :                  1

    await setDoc(ref, {
      streak: newStreak,
      lastPeakDay: today,
      peakModalShownDate: today,
      updatedAt: serverTimestamp(),
    }, { merge: true })

    setStreak(newStreak)
  }

  // ── Burnout tracking (record zone, check 3-day streak) ────────────────────
  useEffect(() => {
    if (!currentUser || zone === 'empty' || zone === 'green') return

    const docId = `${currentUser.uid}_${today}`
    setDoc(doc(db, 'burnoutTracking', docId), {
      userId: currentUser.uid, date: today,
      tasksCount: activeWorkerCount, zone,
    }, { merge: true })

    if (zone !== 'red') return

    // Check if 3 consecutive red-zone days
    Promise.all([
      getDoc(doc(db, 'burnoutTracking', `${currentUser.uid}_${getDateNDaysAgo(1)}`)),
      getDoc(doc(db, 'burnoutTracking', `${currentUser.uid}_${getDateNDaysAgo(2)}`)),
    ]).then(([d1, d2]) => {
      if (d1.exists() && d1.data().zone === 'red' &&
          d2.exists() && d2.data().zone === 'red') {
        setShowRecovery(true)
      }
    })
  }, [zone, currentUser, today])

  // ── Add task ───────────────────────────────────────────────────────────────
  const handleAddTask = useCallback(async ({ text, mode, difficulty, tags }) => {
    await addDoc(collection(db, 'tasks'), {
      userId:      currentUser.uid,
      text,
      mode,
      status:      'locked',
      difficulty:  Number(difficulty) || 1,
      tags:        tags || [],
      createdAt:   serverTimestamp(),
      completedAt: null,
      weekNumber:  getWeekNumber(),
      year:        new Date().getFullYear(),
      dateStr:     today,
    })
  }, [currentUser, today])

  // ── Move task ──────────────────────────────────────────────────────────────
  const handleMove = useCallback(async (id, newStatus) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    const updates = { status: newStatus }
    if (newStatus === 'touchdown') {
      updates.completedAt = serverTimestamp()
      // Unfreezing old task → pull into today
      if (task.status === 'ice' && task.dateStr !== today) updates.dateStr = today
    } else {
      updates.completedAt = null
    }
    if (task.status === 'ice' && newStatus === 'locked') updates.dateStr = today
    await updateDoc(doc(db, 'tasks', id), updates)
  }, [tasks, today])

  // ── Delete task ────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (id) => {
    await deleteDoc(doc(db, 'tasks', id))
  }, [])

  // ── Drag ──────────────────────────────────────────────────────────────────
  const handleDragStart = useCallback(id => setDraggingId(id), [])
  const handleDragEnd   = useCallback(()  => setDraggingId(null), [])

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const h = e => {
      if (e.key === 'Escape') { setShowPeakModal(false); setShowSettings(false) }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  const ice = themeData.ice || { name: 'Ice Bucket', sub: 'Frozen', icon: '🧊' }

  return (
    <div className="app-layout">
      <Navbar
        todayPoints={todayPoints}
        streak={streak}
        zone={zone}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* ── Mobile toggle ── */}
      <div className="mobile-toggle">
        <button
          className={`mt-btn ${mobileView === 'worker' ? 'mt-active' : ''}`}
          onClick={() => setMobileView('worker')}
        >⚡ Worker</button>
        <button
          className={`mt-btn ${mobileView === 'life' ? 'mt-active' : ''}`}
          onClick={() => setMobileView('life')}
        >🏠 Life</button>
      </div>

      {/* ── Recovery alert ── */}
      {showRecovery && (
        <div className="recovery-alert">
          <span>🌿 Recovery Day Recommended — 3 consecutive Red Zone days detected.</span>
          <span className="recovery-tip">Focus on Life tasks today. Your health matters.</span>
          <button className="recovery-close" onClick={() => setShowRecovery(false)}>✕</button>
        </div>
      )}

      {/* ── Dual board ── */}
      <div className="dual-board">
        <div className={`worker-panel ${mobileView === 'worker' ? 'mobile-visible' : 'mobile-hidden'}`}>
          <WorkerBoard
            tasks={workerTasks}
            activeWorkerCount={activeWorkerCount}
            todayPoints={todayPoints}
            streak={streak}
            draggingId={draggingId}
            onMove={handleMove}
            onDelete={handleDelete}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onAddTask={handleAddTask}
          />
        </div>

        <div className="board-divider" />

        <div className={`life-panel ${mobileView === 'life' ? 'mobile-visible' : 'mobile-hidden'}`}>
          <LifeBoard
            tasks={lifeTasks}
            completedToday={todayLife.length}
            draggingId={draggingId}
            onMove={handleMove}
            onDelete={handleDelete}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onAddTask={handleAddTask}
          />
        </div>
      </div>

      {/* ── Ice Bucket ── */}
      <div className="ice-section">
        <div className="ice-section-header">
          <span className="ice-section-title">{ice.icon} {ice.name}</span>
          <span className="ice-section-sub">{ice.sub} · {iceTasks.length} tasks</span>
        </div>
        <div className="ice-cols">
          <KanbanColumn
            title={ice.name} subtitle={ice.sub} icon={ice.icon}
            status="ice"
            colorClass="col-ice"
            tasks={iceTasks}
            onMove={handleMove}
            onDelete={handleDelete}
            draggingId={draggingId}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
        </div>
      </div>

      {/* ── PEAK DAY modal ── */}
      <div
        className={`modal-overlay ${showPeakModal ? 'open' : ''}`}
        onClick={() => setShowPeakModal(false)}
      >
        <div className="modal-box" onClick={e => e.stopPropagation()}>
          <span className="modal-trophy">🏆</span>
          <h2 className="modal-title">PEAK DAY!</h2>
          <p className="modal-sub">10+ points earned. You're on fire.</p>
          <div className="modal-streak">🔥 {streak}-day streak!</div>
          <button className="modal-btn" onClick={() => setShowPeakModal(false)}>Keep Going! →</button>
        </div>
      </div>

      <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <Confetti active={showConfetti} />
    </div>
  )
}
