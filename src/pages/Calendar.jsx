import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  collection, query, where, getDocs,
  addDoc, deleteDoc, doc, setDoc, serverTimestamp, updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase/firebaseConfig'
import { useAuth } from '../contexts/AuthContext'
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react'
import Navbar from '../components/Navbar'
import CalendarGrid from '../components/CalendarGrid'
import MonthStats from '../components/MonthStats'
import DayDetailModal from '../components/DayDetailModal'
import ScheduleTaskModal from '../components/ScheduleTaskModal'
import {
  getCalendarGrid, formatMonthYear, monthRange,
  getDayStatus, calcMonthStats, fullDateLabel,
} from '../utils/calendarUtils'
import { calcPoints, getScoreLevel } from '../utils/balanceUtils'
import { todayStr, getWeekNumber } from '../utils/dateUtils'

// ─── Calendar Legend ──────────────────────────────────────────────────────────
const LEGEND = [
  { cls: 'ds-peak',    icon: '🔥', label: 'Peak Day (5+ pts)' },
  { cls: 'ds-solid',   icon: '💪', label: 'Solid (4 pts)'    },
  { cls: 'ds-good',    icon: '👍', label: 'Good (2-3 pts)'     },
  { cls: 'ds-off',     icon: '😴', label: 'Off Day'            },
  { cls: 'ds-rest',    icon: '🌿', label: 'Rest Day'           },
  { cls: 'ds-planned', icon: '📅', label: 'Tasks Scheduled'    },
]

export default function Calendar() {
  const { currentUser } = useAuth()
  const today    = todayStr()
  const nowDate  = new Date(today + 'T00:00:00')

  const [year,  setYear]  = useState(nowDate.getFullYear())
  const [month, setMonth] = useState(nowDate.getMonth() + 1)  // 1-based

  const [dayDataMap,  setDayDataMap]  = useState({})
  const [monthStats,  setMonthStats]  = useState({
    peakDays: 0, solidDays: 0, restDays: 0, plannedDays: 0, avgScore: 0, longestStreak: 0,
  })
  const [loading, setLoading] = useState(true)

  // Modals
  const [detailDate,   setDetailDate]   = useState(null)   // string
  const [scheduleDate, setScheduleDate] = useState(null)   // string

  // ── Fetch month data ────────────────────────────────────────────────────────
  const loadMonth = useCallback(async (y, m) => {
    if (!currentUser) return
    setLoading(true)

    const { first, last } = monthRange(y, m)

    try {
      // All tasks in range
      const tSnap = await getDocs(query(
        collection(db, 'tasks'),
        where('userId', '==', currentUser.uid),
        where('dateStr', '>=', first),
        where('dateStr', '<=', last),
      ))
      const allTasks = tSnap.docs.map(d => ({ id: d.id, ...d.data() }))

      // Rest days in range
      const rSnap = await getDocs(query(
        collection(db, 'restDays'),
        where('userId', '==', currentUser.uid),
        where('date', '>=', first),
        where('date', '<=', last),
      ))
      const restByDate = {}
      rSnap.docs.forEach(d => {
        const data = d.data()
        restByDate[data.date] = { id: d.id, reason: data.reason }
      })

      // Build per-day map
      const map = {}
      const cells = getCalendarGrid(y, m)
      for (const dateStr of cells) {
        if (!dateStr) continue
        const dayTasks = allTasks.filter(t => t.dateStr === dateStr)
        const isFuture = dateStr > today
        const isToday  = dateStr === today
        const isRestDay = Boolean(restByDate[dateStr])
        const restData  = restByDate[dateStr] || null

        let score = 0
        let hasAnyTasks = dayTasks.length > 0
        let futureTasks = []

        if (isFuture) {
          futureTasks = dayTasks.filter(t => t.status === 'locked' || t.status === 'progress')
        } else {
          const completed = dayTasks.filter(t => t.mode === 'worker' && t.status === 'touchdown')
          score = calcPoints(completed)
        }

        const status = getDayStatus({
          score,
          hasAnyTasks,
          isRestDay,
          isFuture,
          hasFutureTasks: futureTasks.length > 0,
          isToday,
        })

        map[dateStr] = {
          status,
          score,
          hasAnyTasks,
          futureTasks,
          futureTaskCount: futureTasks.length,
          completedTasks: !isFuture ? dayTasks.filter(t => t.status === 'touchdown') : [],
          allDayTasks: dayTasks,
          isRestDay,
          restReason: restData?.reason || null,
          restDocId: restData?.id || null,
        }
      }

      setDayDataMap(map)
      setMonthStats(calcMonthStats(map, today))
    } catch (e) {
      console.error('Calendar loadMonth:', e)
    } finally {
      setLoading(false)
    }
  }, [currentUser, today])

  useEffect(() => {
    loadMonth(year, month)
  }, [year, month, loadMonth])

  // ── Navigation ──────────────────────────────────────────────────────────────
  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }
  function goToToday() {
    setYear(nowDate.getFullYear())
    setMonth(nowDate.getMonth() + 1)
  }

  // ── Rest Day handlers ────────────────────────────────────────────────────────
  async function handleMarkRest(dateStr, reason) {
    await setDoc(doc(db, 'restDays', `${currentUser.uid}_${dateStr}`), {
      userId:    currentUser.uid,
      date:      dateStr,
      reason:    reason || null,
      createdAt: serverTimestamp(),
    })
    loadMonth(year, month)
  }

  async function handleRemoveRest(dateStr) {
    await deleteDoc(doc(db, 'restDays', `${currentUser.uid}_${dateStr}`))
    loadMonth(year, month)
  }

  // ── Schedule task ───────────────────────────────────────────────────────────
  async function handleSchedule({ text, mode, difficulty, tags, date }) {
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
    loadMonth(year, month)
  }

  // ── Delete task (from day detail) ────────────────────────────────────────────
  async function handleDeleteTask(taskId) {
    await deleteDoc(doc(db, 'tasks', taskId))
    loadMonth(year, month)
  }

  // ── Edit task (from day detail) ──────────────────────────────────────────────
  async function handleEditTask(taskId, updates) {
    await updateDoc(doc(db, 'tasks', taskId), updates)
    loadMonth(year, month)
  }

  // ── Day click ───────────────────────────────────────────────────────────────
  function handleDayClick(dateStr) {
    setDetailDate(dateStr)
  }

  const cells = getCalendarGrid(year, month)
  const detailData = detailDate ? (dayDataMap[detailDate] || {}) : null

  return (
    <div className="app-layout">
      <Navbar todayPoints={0} streak={0} zone="empty" onOpenSettings={() => {}} />

      <div className="calendar-page">

        {/* Back nav */}
        <div className="cal-back-nav">
          <Link to="/app" className="history-back">
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
        </div>

        {/* Month header */}
        <div className="cal-header">
          <button className="cal-nav-btn" onClick={prevMonth}>
            <ChevronLeft size={18} />
          </button>
          <div className="cal-month-title">{formatMonthYear(year, month)}</div>
          <button className="cal-nav-btn" onClick={nextMonth}>
            <ChevronRight size={18} />
          </button>
          <button
            className="cal-today-btn"
            onClick={goToToday}
            disabled={year === nowDate.getFullYear() && month === nowDate.getMonth() + 1}
          >
            Today
          </button>
          <button
            className="cal-schedule-btn"
            onClick={() => setScheduleDate(null)}
          >
            📅 Schedule Task
          </button>
        </div>

        {/* Month stats */}
        <MonthStats stats={monthStats} />

        {/* Grid */}
        {loading ? (
          <div className="cal-loading"><div className="spinner" /></div>
        ) : (
          <CalendarGrid
            cells={cells}
            dayDataMap={dayDataMap}
            today={today}
            onDayClick={handleDayClick}
          />
        )}

        {/* Legend */}
        <div className="calendar-legend">
          {LEGEND.map(item => (
            <div key={item.label} className="leg-item">
              <span className={`leg-dot ${item.cls}`} />
              <span className="leg-icon">{item.icon}</span>
              <span className="leg-label">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Day Detail Modal */}
      {detailDate && detailData && (
        <DayDetailModal
          dateStr={detailDate}
          status={detailData.status || 'nodata'}
          score={detailData.score || 0}
          tasks={
            detailDate > today
              ? (detailData.futureTasks || [])
              : (detailData.completedTasks || [])
          }
          isRestDay={detailData.isRestDay || false}
          restReason={detailData.restReason}
          onClose={() => setDetailDate(null)}
          onMarkRest={handleMarkRest}
          onRemoveRest={handleRemoveRest}
          onAddTask={dateStr => { setDetailDate(null); setScheduleDate(dateStr) }}
          onDeleteTask={handleDeleteTask}
          onEditTask={handleEditTask}
        />
      )}

      {/* Schedule Task Modal */}
      {scheduleDate !== undefined && (
        scheduleDate === null
          ? (
            <ScheduleTaskModal
              initialDate={null}
              onSchedule={handleSchedule}
              onClose={() => setScheduleDate(undefined)}
            />
          )
          : scheduleDate && (
            <ScheduleTaskModal
              initialDate={scheduleDate}
              onSchedule={handleSchedule}
              onClose={() => setScheduleDate(undefined)}
            />
          )
      )}
    </div>
  )
}
