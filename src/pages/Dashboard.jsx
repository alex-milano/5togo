import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  collection, query, where, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc,
  serverTimestamp, getDoc, getDocs, setDoc,
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
import ViewSelector from '../components/ViewSelector'
import DailyMotivation from '../components/DailyMotivation'
import UpcomingTasksSection from '../components/UpcomingTasksSection'
import ScheduleTaskModal from '../components/ScheduleTaskModal'
import ShareTaskModal from '../components/ShareTaskModal'
import { todayStr, yesterdayStr, getWeekNumber, getDateNDaysAgo } from '../utils/dateUtils'
import { calcPoints, getScoreLevel, getZone } from '../utils/balanceUtils'

const VIEW_KEY     = '5togo_viewMode'
const REASONS      = ['Recovery', 'Vacation', 'Weekend', 'Sick Day', 'Personal Day']

export default function Dashboard() {
  const { currentUser, userProfile } = useAuth()
  const { themeData }   = useTheme()

  // ── Tasks (real-time) ──────────────────────────────────────────────────────
  const [ownTasks, setOwnTasks]     = useState([])
  const [sharedTasks, setSharedTasks] = useState([])
  const [streak, setStreak]       = useState(0)
  const [showSettings,  setShowSettings]  = useState(false)
  const [showPeakModal, setShowPeakModal] = useState(false)
  const [showConfetti,  setShowConfetti]  = useState(false)
  const [showRecovery,  setShowRecovery]  = useState(false)
  const [mobileView,    setMobileView]    = useState('worker')
  const [viewMode,      setViewMode]      = useState(
    () => localStorage.getItem(VIEW_KEY) || 'split'
  )
  const [draggingId,  setDraggingId]  = useState(null)
  const [shareModalTask, setShareModalTask] = useState(null)

  // Rest day
  const [showRestModal,  setShowRestModal]  = useState(false)
  const [restReason,     setRestReason]     = useState(REASONS[0])
  const [todayIsRest,    setTodayIsRest]    = useState(false)
  const [savingRest,     setSavingRest]     = useState(false)

  // Schedule modal
  const [scheduleOpen, setScheduleOpen] = useState(false)

  const peakShownRef = useRef(null)
  const frozenRef    = useRef(false)
  const today        = todayStr()

  function handleViewMode(mode) {
    setViewMode(mode)
    localStorage.setItem(VIEW_KEY, mode)
  }

  // ── Firestore listeners: own + shared tasks ───────────────────────────────
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
      setOwnTasks(loaded)
    })
  }, [currentUser])

  useEffect(() => {
    if (!currentUser || !userProfile?.handle) return
    const q = query(collection(db, 'tasks'), where('sharedWithUids', 'array-contains', currentUser.uid))
    return onSnapshot(q, snap => {
      const loaded = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      loaded.sort((a, b) => {
        if (a.status === 'touchdown' && b.status !== 'touchdown') return 1
        if (b.status === 'touchdown' && a.status !== 'touchdown') return -1
        return (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)
      })
      setSharedTasks(loaded)
    })
  }, [currentUser, userProfile?.handle])

  // ── Load streak + check today's rest day ──────────────────────────────────
  useEffect(() => {
    if (!currentUser) return
    getDoc(doc(db, 'userSettings', currentUser.uid)).then(snap => {
      if (snap.exists()) {
        setStreak(snap.data().streak || 0)
        peakShownRef.current = snap.data().peakModalShownDate || null
      }
    })
    // Check if today is a rest day
    getDoc(doc(db, 'restDays', `${currentUser.uid}_${today}`)).then(snap => {
      setTodayIsRest(snap.exists())
    })
  }, [currentUser, today])

  // ── Auto-freeze expired Worker tasks (only own tasks) ──────────────────────
  useEffect(() => {
    if (!ownTasks.length || frozenRef.current) return
    const toFreeze = ownTasks.filter(t =>
      t.mode === 'worker' &&
      t.dateStr && t.dateStr < today &&
      (t.status === 'locked' || t.status === 'progress') &&
      t.userId === currentUser.uid
    )
    if (toFreeze.length === 0) return
    frozenRef.current = true
    Promise.all(toFreeze.map(t => updateDoc(doc(db, 'tasks', t.id), { status: 'ice' })))
      .finally(() => setTimeout(() => { frozenRef.current = false }, 5000))
  }, [ownTasks, today, currentUser?.uid])

  // ── Merge own + shared tasks (own take precedence) ─────────────────────────
  const tasks = useMemo(() => {
    const map = {}
    // Add shared tasks first
    sharedTasks.forEach(t => { map[t.id] = t })
    // Own tasks override shared
    ownTasks.forEach(t => { map[t.id] = t })
    return Object.values(map)
  }, [ownTasks, sharedTasks])

  // ── Derived ────────────────────────────────────────────────────────────────
  const workerTasks       = tasks.filter(t => t.mode === 'worker' && t.status !== 'ice')
  const lifeTasks         = tasks.filter(t => t.mode === 'life'   && t.status !== 'ice')
  const workerIceTasks    = tasks.filter(t => t.mode === 'worker' && t.status === 'ice')
  const lifeIceTasks      = tasks.filter(t => t.mode === 'life'   && t.status === 'ice')

  // Future tasks (dateStr > today, not ice)
  const futureTasks = tasks.filter(t => t.dateStr > today && t.status !== 'ice' && t.status !== 'touchdown')

  const todayWorker       = tasks.filter(t => t.mode === 'worker' && t.dateStr === today)
  const activeWorkerCount = todayWorker.filter(t => t.status !== 'ice' && t.userId === currentUser?.uid).length
  const completedWorker   = todayWorker.filter(t => t.status === 'touchdown')
  const todayPoints       = calcPoints(completedWorker)

  const todayLife = tasks.filter(t => t.mode === 'life' && t.dateStr === today && t.status === 'touchdown')
  const zone      = getZone(activeWorkerCount)

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
    const ref  = doc(db, 'userSettings', currentUser.uid)
    const snap = await getDoc(ref)
    const data = snap.exists() ? snap.data() : {}
    const last = data.lastPeakDay || null
    const yest = yesterdayStr()

    // Check if yesterday was a rest day (doesn't break streak)
    const restSnap = await getDoc(doc(db, 'restDays', `${currentUser.uid}_${yest}`))
    const yesterdayWasRest = restSnap.exists()

    const newStreak = last === today          ? (data.streak || 1)
                    : last === yest           ? (data.streak || 0) + 1
                    : yesterdayWasRest        ? (data.streak || 0) + 1  // rest day preserved streak
                    :                          1

    await setDoc(ref, {
      streak: newStreak,
      lastPeakDay: today,
      peakModalShownDate: today,
      updatedAt: serverTimestamp(),
    }, { merge: true })

    setStreak(newStreak)
  }

  // ── Burnout tracking ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser || zone === 'empty' || zone === 'green') return
    const docId = `${currentUser.uid}_${today}`
    setDoc(doc(db, 'burnoutTracking', docId), {
      userId: currentUser.uid, date: today,
      tasksCount: activeWorkerCount, zone,
    }, { merge: true })

    if (zone !== 'red') return
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

  // ── Schedule future task ───────────────────────────────────────────────────
  const handleSchedule = useCallback(async ({ text, mode, difficulty, tags, date }) => {
    const scheduledDate = new Date(date + 'T00:00:00')
    await addDoc(collection(db, 'tasks'), {
      userId:      currentUser.uid,
      text,
      mode,
      status:      'locked',
      difficulty:  Number(difficulty) || 1,
      tags:        tags || [],
      createdAt:   serverTimestamp(),
      completedAt: null,
      dateStr:     date,
      weekNumber:  getWeekNumber(scheduledDate),
      year:        scheduledDate.getFullYear(),
    })
  }, [currentUser])

  // ── Move task ──────────────────────────────────────────────────────────────
  const handleMove = useCallback(async (id, newStatus) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    const updates = { status: newStatus }
    if (newStatus === 'touchdown') {
      updates.completedAt = serverTimestamp()
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

  // ── Rest day handlers ──────────────────────────────────────────────────────
  async function markTodayAsRest() {
    if (!currentUser) return
    setSavingRest(true)
    try {
      await setDoc(doc(db, 'restDays', `${currentUser.uid}_${today}`), {
        userId:    currentUser.uid,
        date:      today,
        reason:    restReason || null,
        createdAt: serverTimestamp(),
      })
      setTodayIsRest(true)
      setShowRestModal(false)
    } finally {
      setSavingRest(false)
    }
  }

  async function removeTodayRest() {
    if (!currentUser) return
    await deleteDoc(doc(db, 'restDays', `${currentUser.uid}_${today}`))
    setTodayIsRest(false)
  }

  // ── Share task callback ───────────────────────────────────────────────────
  const handleShare = useCallback((taskId) => {
    const task = tasks.find(t => t.id === taskId)
    if (task) setShareModalTask(task)
  }, [tasks])

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const h = e => {
      if (e.key === 'Escape') {
        setShowPeakModal(false)
        setShowSettings(false)
        setShowRestModal(false)
        setScheduleOpen(false)
        setShareModalTask(null)
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  const ice = themeData.ice || { name: 'Ice Bucket', sub: 'Frozen', icon: '🧊' }

  const showWorker  = viewMode === 'split' || viewMode === 'worker'
  const showLife    = viewMode === 'split' || viewMode === 'life'
  const showDivider = viewMode === 'split'

  return (
    <div className="app-layout">
      <Navbar
        todayPoints={todayPoints}
        streak={streak}
        zone={zone}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* ── Daily motivation ── */}
      <DailyMotivation />

      {/* ── View selector + day controls (desktop) ── */}
      <div className="dashboard-controls">
        <ViewSelector viewMode={viewMode} onChange={handleViewMode} />
        <div className="day-controls">
          {todayIsRest ? (
            <div className="rest-active-pill">
              🌿 Rest Day
              <button className="rest-remove-btn" onClick={removeTodayRest}>✕</button>
            </div>
          ) : (
            <button className="rest-day-btn" onClick={() => setShowRestModal(true)}>
              🌿 Rest Day
            </button>
          )}
          <button className="schedule-btn" onClick={() => setScheduleOpen(true)}>
            📅 Schedule Task
          </button>
        </div>
      </div>

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

      {/* ── Rest day today banner ── */}
      {todayIsRest && (
        <div className="rest-day-banner">
          🌿 <strong>Rest Day Active</strong> — Focus on recovery and life balance today.
        </div>
      )}

      {/* ── Dual board ── */}
      <div className={`dual-board ${viewMode === 'split' ? 'split-mode' : ''}`}>
        {showWorker && (
          <div className={`worker-panel ${mobileView === 'worker' ? 'mobile-visible' : 'mobile-hidden'}`}>
            <WorkerBoard
              tasks={workerTasks}
              iceTasks={workerIceTasks}
              activeWorkerCount={activeWorkerCount}
              todayPoints={todayPoints}
              streak={streak}
              draggingId={draggingId}
              onMove={handleMove}
              onDelete={handleDelete}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onAddTask={handleAddTask}
              currentUser={currentUser}
              userProfile={userProfile}
              onShare={handleShare}
              splitMode={viewMode === 'split'}
            />
          </div>
        )}

        {showLife && (
          <div className={`life-panel ${mobileView === 'life' ? 'mobile-visible' : 'mobile-hidden'}`}>
            <LifeBoard
              tasks={lifeTasks}
              iceTasks={lifeIceTasks}
              completedToday={todayLife.length}
              draggingId={draggingId}
              onMove={handleMove}
              onDelete={handleDelete}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onAddTask={handleAddTask}
              currentUser={currentUser}
              userProfile={userProfile}
              onShare={handleShare}
              splitMode={viewMode === 'split'}
            />
          </div>
        )}
      </div>

      {/* ── Upcoming scheduled tasks ── */}
      <UpcomingTasksSection
        tasks={futureTasks}
        onOpenSchedule={() => setScheduleOpen(true)}
      />

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

      {/* ── Rest Day modal ── */}
      {showRestModal && (
        <div className="modal-overlay open" onClick={() => setShowRestModal(false)}>
          <div className="modal-box rest-modal" onClick={e => e.stopPropagation()}>
            <span className="modal-trophy">🌿</span>
            <h2 className="modal-title" style={{ color: '#06d6a0' }}>Mark Rest Day</h2>
            <p className="modal-sub">Rest days don't break your streak. Recovery is growth.</p>
            <select
              className="sched-date-input"
              value={restReason}
              onChange={e => setRestReason(e.target.value)}
              style={{ marginBottom: 16 }}
            >
              {REASONS.map(r => <option key={r}>{r}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="msg-cancel-btn" onClick={() => setShowRestModal(false)}>
                Cancel
              </button>
              <button
                className="modal-btn"
                style={{ background: 'linear-gradient(135deg, #06d6a0, #0aab82)' }}
                onClick={markTodayAsRest}
                disabled={savingRest}
              >
                {savingRest ? 'Saving…' : '🌿 Mark as Rest Day'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Schedule Task modal ── */}
      {scheduleOpen && (
        <ScheduleTaskModal
          initialDate={null}
          onSchedule={handleSchedule}
          onClose={() => setScheduleOpen(false)}
        />
      )}

      {/* ── Share Task modal ── */}
      {shareModalTask && (
        <ShareTaskModal
          task={shareModalTask}
          currentUser={currentUser}
          userProfile={userProfile}
          onClose={() => setShareModalTask(null)}
        />
      )}

      <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <Confetti active={showConfetti} />
    </div>
  )
}
