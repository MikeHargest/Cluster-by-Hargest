import React, { useState } from 'react'
import { Project, TaskItem } from '../types'
import TaskTree from './sidebar/subcomponents/TaskTree'
import { Folder, Filter, Archive, Trash2 } from 'lucide-react'

interface GlobalTasksViewProps {
  projects: Project[]
  onUpdateTask: (projectId: string, taskId: string, updates: Partial<TaskItem>) => void
  onTaskAdded: (projectId: string, name: string, parentId?: string) => void
  onTaskDeleted: (projectId: string, taskId: string) => void
  onClearArchive?: () => void
  showTaskCounts: boolean
  hideEmptyProjects?: boolean
}

const GlobalTasksView: React.FC<GlobalTasksViewProps> = ({
  projects,
  onUpdateTask,
  onTaskAdded,
  onTaskDeleted,
  onClearArchive,
  showTaskCounts,
  hideEmptyProjects
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [showArchive, setShowArchive] = useState(false)

  const filteredProjects = projects.filter(p => {
    if (!hideEmptyProjects) return true
    
    const hasActiveTasks = (proj: Project): boolean => {
      if (proj.tasks && proj.tasks.length > 0) return true
      if (proj.subprojects && proj.subprojects.some(hasActiveTasks)) return true
      return false
    }
    
    const hasArchivedTasks = (proj: Project): boolean => {
      if (proj.archivedTasks && proj.archivedTasks.length > 0) return true
      if (proj.subprojects && proj.subprojects.some(hasArchivedTasks)) return true
      return false
    }

    return showArchive ? hasArchivedTasks(p) : hasActiveTasks(p)
  })

  const displayedProjects = filteredProjects.filter(p => 
    selectedProjectId ? p.id === selectedProjectId : true
  )

  return (
    <div className="global-tasks-view" style={{
      flex: 1,
      height: '100%',
      overflowY: 'auto',
      padding: '32px'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
        
        {/* Filters Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          background: 'var(--card-bg)',
          padding: '16px 20px',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginRight: '8px' }}>
            <Filter size={16} />
            <span style={{ fontSize: '13px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Filter</span>
          </div>
          <button
            onClick={() => setSelectedProjectId(null)}
            style={{
              background: selectedProjectId === null ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
              color: selectedProjectId === null ? '#fff' : 'var(--text-secondary)',
              border: 'none',
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            All Projects
          </button>
          {projects.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedProjectId(p.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: selectedProjectId === p.id ? (p.color || 'var(--accent)') : 'rgba(255,255,255,0.05)',
                color: selectedProjectId === p.id ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Folder size={14} style={{ color: selectedProjectId === p.id ? '#fff' : (p.color || 'var(--accent)') }} />
              {p.name}
            </button>
          ))}
          
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {showArchive && onClearArchive && (
              <button
                onClick={onClearArchive}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255, 50, 50, 0.1)',
                  color: '#ff4444',
                  border: '1px solid rgba(255, 50, 50, 0.2)',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 50, 50, 0.2)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 50, 50, 0.1)' }}
              >
                <Trash2 size={14} />
                Clear All
              </button>
            )}
            <button
              onClick={() => setShowArchive(!showArchive)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: showArchive ? 'var(--accent)' : 'transparent',
                color: showArchive ? '#fff' : 'var(--text-secondary)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Archive size={14} />
              {showArchive ? 'Active Tasks' : 'Archive'}
            </button>
          </div>
        </div>

        {/* Tasks List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {displayedProjects.map(project => (
            <div
              key={project.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                paddingBottom: '8px',
                borderBottom: '1px solid rgba(255,255,255,0.08)'
              }}>
                <Folder size={18} style={{ color: project.color || 'var(--accent)' }} />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.5px' }}>{project.name}</h3>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingLeft: '8px' }}>
                <TaskTree
                  project={project}
                  isRoot={true}
                  isArchiveView={showArchive}
                  toggleTask={(pid, tid) => {
                    const findTask = (list: TaskItem[]): TaskItem | undefined => {
                      for (const t of list) {
                        if (t.id === tid) return t
                        if (t.subtasks) {
                          const found = findTask(t.subtasks)
                          if (found) return found
                        }
                      }
                      return undefined
                    }
                    const taskList = showArchive ? (project.archivedTasks || []) : (project.tasks || [])
                    const task = findTask(taskList)
                    if (task) onUpdateTask(pid, tid, { completed: !task.completed })
                  }}
                  toggleTaskExpansion={(pid, tid) => {
                    const findTask = (list: TaskItem[]): TaskItem | undefined => {
                      for (const t of list) {
                        if (t.id === tid) return t
                        if (t.subtasks) {
                          const found = findTask(t.subtasks)
                          if (found) return found
                        }
                      }
                      return undefined
                    }
                    const taskList = showArchive ? (project.archivedTasks || []) : (project.tasks || [])
                    const task = findTask(taskList)
                    if (task) onUpdateTask(pid, tid, { isExpanded: !task.isExpanded })
                  }}
                  editingId={null}
                  editingValue=""
                  setEditingValue={() => {}}
                  saveTaskName={() => {}}
                  cancelEditing={() => {}}
                  startEditing={() => {}}
                  deleteTask={onTaskDeleted}
                  getTaskTimelineDate={() => null}
                  onTaskAdded={onTaskAdded}
                  isDragging={null}
                  dropIndicator={null}
                  startMouseDrag={() => {}}
                  showTaskCounts={showTaskCounts}
                />
              </div>
            </div>
          ))}
          {displayedProjects.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px', opacity: 0.5 }}>
              <p>{showArchive ? 'No archived tasks found.' : 'No tasks found.'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default GlobalTasksView
