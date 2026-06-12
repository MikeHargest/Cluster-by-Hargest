export interface TaskItem {
  id: string
  text: string
  completed: boolean
  isExpanded?: boolean
  subtasks: TaskItem[]
}

export interface PipelineItem {
  id: string
  text: string
  completed: boolean
}

export interface PipelineStage {
  id: string
  name: string
  items: PipelineItem[]
  color?: string
  colorOpacity?: number
  description?: string
  startDate?: string
  endDate?: string
}

export interface PipelineData {
  id: string
  name: string
  stages: PipelineStage[]
}

export interface ProjectAttachment {
  id: string
  name: string
  path: string
  type: 'file' | 'link' | 'folder'
}

export interface AppEvent {
  id: string
  title: string
  date?: string // YYYY-MM-DD
  time?: string // HH:MM
  location?: string
  description?: string
  color?: string
  projectId?: string
  // Sync metadata
  externalId?: string
  etag?: string
  syncStatus?: 'synced' | 'pending_push' | 'pending_delete' | 'conflict'
  updatedAt?: number
  // Recurrence
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
    interval?: number
    daysOfWeek?: number[]
    endType?: 'never' | 'count' | 'until'
    count?: number
    endDate?: string
  }
  originalEventId?: string // For recurring event exceptions
  originalDate?: string    // The original date of a moved recurring instance
  exceptions?: Record<string, { deleted?: boolean; editedEventId?: string }> // date → exception info
  // Reminder
  reminder?: {
    minutesBefore: number
    isNotified: boolean
  }
}

export interface Project {
  id: string
  name: string
  isExpanded: boolean
  tasks: TaskItem[]
  archivedTasks?: TaskItem[]
  color?: string
  subprojects?: Project[]
  banner?: string
  description?: string
  attachments?: ProjectAttachment[]
  icon?: string
  status?: string
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent'
  startDate?: string
  endDate?: string
  progressMode?: 'tasks' | 'manual' | 'pipeline'
  manualProgress?: number
  depth?: number
  bannerCollapsed?: boolean
  events?: AppEvent[]
  path?: string
  notesPath?: string
  boardsPath?: string
  boardData?: string
  pipeline?: PipelineStage[] // Legacy field
  pipelines?: PipelineData[] // New field
  activePipelineId?: string
  activePipelineStageId?: string
  bannerPosition?: number
}

export interface TimelineTask {
  id: string
  projectId: string
  taskName: string
  date: string // YYYY-MM-DD
  endDate?: string // YYYY-MM-DD for multi-day tasks
  taskId?: string // Link to the sidebar task ID
}

export interface TimerData {
  id: string
  title: string
  taskName: string | null
  hours: number
  minutes: number
  seconds: number
  soundPath: string | null
  soundName: string | null
  isRunning?: boolean
  isStopwatch?: boolean
  isPinned?: boolean
  isHeaderPinned?: boolean
}

export interface AlarmData {
  id: string
  title: string
  taskName: string | null
  date: string // YYYY-MM-DD
  time: string // HH:MM
  isEnabled: boolean
  isNotified: boolean
}

export interface AppNote {
  id: string
  title: string
  content: string
  type?: 'markdown' | 'board'
  projectId?: string
  parentId?: string
  lastModified: number
  createdAt?: number
  path?: string // Absolute path to the .md file
  fileName?: string
  isTrash?: boolean
  order?: number
}

export interface AppFile {
  id: string
  name: string
  path: string
  size: number
  lastModified: number
  extension: string
  source: string
}

export interface AppNotification {
  id: string
  title: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error' | 'reminder' | 'timer' | 'system'
  timestamp: number
  read?: boolean
  isRead?: boolean
  relatedId?: string
}

export interface UITheme {
  bgColor: string
  cardBg: string
  accent: string
  textPrimary: string
  boardAccent: string
  boardBg: string
  calendarTaskBg?: string
  calendarEventBg?: string
  timerBg?: string
}

export const DEFAULT_THEME: UITheme = {
  bgColor: '#1B1B1B',
  cardBg: '#242424',
  accent: '#7C6AFA',
  textPrimary: '#FFFFFF',
  boardAccent: '#7C6AFA',
  boardBg: '#1B1B1B',
  calendarTaskBg: '#2a2a2a',
  calendarEventBg: 'rgba(255,255,255,0.03)',
  timerBg: '#171717'
}

export interface ThemePreset {
  id: string
  name: string
  theme: UITheme
}
