import { useEffect } from 'react'
import { X as CloseIcon, Clock, PlusCircle, Timer as TimerIcon, Bell } from 'lucide-react'
import TimerCard from './TimerCard'
import AlarmCard from './AlarmCard'
import { TimerData, AlarmData, UITheme } from '../types'

interface TimersModalProps {
  isOpen: boolean
  onClose: () => void
  timers: TimerData[]
  alarms: AlarmData[]
  theme: UITheme
  timerVolume: number
  onAddTimer: () => void
  onAddStopwatch: () => void
  onAddAlarm: () => void
  onUpdateTimer: (id: string, updates: Partial<TimerData>) => void
  onDeleteTimer: (id: string) => void
  onUpdateAlarm: (id: string, updates: Partial<AlarmData>) => void
  onDeleteAlarm: (id: string) => void
}

export default function TimersModal({
  isOpen,
  onClose,
  timers,
  alarms,
  theme,
  timerVolume,
  onAddTimer,
  onAddStopwatch,
  onAddAlarm,
  onUpdateTimer,
  onDeleteTimer,
  onUpdateAlarm,
  onDeleteAlarm
}: TimersModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(4px)',
        cursor: 'pointer'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--card-bg)',
          width: '860px',
          height: '600px',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          cursor: 'default'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Clock size={18} style={{ opacity: 0.7 }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="toolbar-action-btn" onClick={onAddTimer} style={{ background: 'rgba(255,255,255,0.05)' }}>
              <PlusCircle size={14} /> Timer
            </button>
            <button className="toolbar-action-btn" onClick={onAddStopwatch} style={{ background: 'rgba(255,255,255,0.05)' }}>
              <TimerIcon size={14} /> Stopwatch
            </button>
            <button className="toolbar-action-btn" onClick={onAddAlarm} style={{ background: 'rgba(255,255,255,0.05)' }}>
              <Bell size={14} /> Alarm
            </button>

            <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.08)', margin: '0 8px' }} />

            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '5px',
                borderRadius: '6px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)'
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)'
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <CloseIcon size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gridAutoRows: 'min-content',
            gap: '12px',
            alignItems: 'start'
          }}
        >
          {timers.length === 0 && alarms.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '60px 0', textAlign: 'center', opacity: 0.5 }}>
              <TimerIcon size={64} style={{ margin: '0 auto', display: 'block' }} />
              <p style={{ marginTop: '16px' }}>
                No active timers or alarms.<br/>Click the buttons above to add one.
              </p>
            </div>
          ) : (
            <>
              {timers.map((timer) => (
                <TimerCard
                  key={timer.id}
                  data={timer}
                  theme={theme}
                  isActiveView={isOpen}
                  timerVolume={timerVolume}
                  onUpdate={(updates) => onUpdateTimer(timer.id, updates)}
                  onDelete={() => onDeleteTimer(timer.id)}
                />
              ))}
              {alarms.map((alarm) => (
                <AlarmCard
                  key={alarm.id}
                  data={alarm}
                  theme={theme}
                  onUpdate={(updates) => onUpdateAlarm(alarm.id, updates)}
                  onDelete={() => onDeleteAlarm(alarm.id)}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
