import { useState } from 'react'
import TaskCard from './TaskCard'

const EMPTY = {
  locked:    { icon: '🎯', text: 'Add tasks above to lock in' },
  progress:  { icon: '⚡', text: 'Drag a task here to start' },
  touchdown: { icon: '🏆', text: 'Complete tasks to score points' },
  ice:       { icon: '🧊', text: 'Frozen or paused tasks live here' },
}

export default function KanbanColumn({
  title,
  subtitle,
  icon,
  status,
  colorClass,
  tasks,
  onMove,
  onDelete,
  draggingId,
  onDragStart,
  onDragEnd,
}) {
  const [isDragOver, setIsDragOver] = useState(false)
  const hint = EMPTY[status] || { icon: '📋', text: 'Empty' }

  function handleDragOver(e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
  }
  function handleDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false)
    }
  }
  function handleDrop(e) {
    e.preventDefault()
    setIsDragOver(false)
    const id = e.dataTransfer.getData('text/plain') || draggingId
    if (id) onMove(id, status)
  }

  return (
    <div className={`column ${colorClass} ${isDragOver ? 'drop-target' : ''}`}>
      {/* Header */}
      <div className="col-header">
        <div className="col-title-row">
          <span className="col-icon">{icon}</span>
          <span className="col-name">{title}</span>
          <span className="col-count">{tasks.length}</span>
        </div>
        <span className="col-sub">{subtitle}</span>
      </div>

      {/* Drop zone */}
      <div
        className={`task-list ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {tasks.length === 0 ? (
          <div className="col-empty">
            <span className="col-empty-icon">{hint.icon}</span>
            {hint.text}
          </div>
        ) : (
          tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onMove={onMove}
              onDelete={onDelete}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              isDragging={draggingId === task.id}
            />
          ))
        )}
      </div>
    </div>
  )
}
