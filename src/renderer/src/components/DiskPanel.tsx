import { useState, useRef, useEffect } from 'react'
import {
  HardDrive,
  Search,
  X as CloseIcon,
  List,
  LayoutGrid,
  RefreshCcw
} from 'lucide-react'
import FilesView, { FilesViewHandle } from './FilesView'

interface DiskPanelProps {
  isOpen: boolean
  onClose: () => void
  workspacePath: string
  allProjects: { id: string; name: string; path?: string }[]
  onNavigateToProject: (id: string) => void
}

export default function DiskPanel({
  isOpen,
  onClose,
  workspacePath,
  allProjects,
  onNavigateToProject
}: DiskPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [selectedSource, setSelectedSource] = useState('all')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [isLoading, setIsLoading] = useState(false)
  const [sources, setSources] = useState<string[]>([])
  const filesRef = useRef<FilesViewHandle | null>(null)

  // Close on Escape key
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
          width: '960px',
          height: '660px',
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
            flexShrink: 0,
            gap: '16px'
          }}
        >
          {/* Left: Title */}
          <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <HardDrive size={18} style={{ opacity: 0.7 }} />
          </div>

          {/* Center: Search + Source */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flex: 1,
              justifyContent: 'center'
            }}
          >
            <div className="fv-search-wrap" style={{ maxWidth: '280px', flex: 1 }}>
              <Search
                size={13}
                style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}
              />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="fv-search-clear"
                  onClick={() => setSearchQuery('')}
                >
                  <CloseIcon size={12} />
                </button>
              )}
            </div>

            <select
              className="fv-source-select"
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              title="Filter by project"
            >
              <option value="all">All sources</option>
              {sources.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Right: View mode + Refresh + Close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <button
              className={`view-icon-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List view"
              style={{ padding: '5px 7px' }}
            >
              <List size={15} />
            </button>
            <button
              className={`view-icon-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid view"
              style={{ padding: '5px 7px' }}
            >
              <LayoutGrid size={15} />
            </button>

            <div
              style={{
                width: '1px',
                height: '18px',
                background: 'rgba(255,255,255,0.08)',
                margin: '0 4px'
              }}
            />

            <button
              className="view-icon-btn"
              onClick={() => filesRef.current?.loadFiles()}
              title="Refresh"
              disabled={isLoading}
              style={{ padding: '5px 7px' }}
            >
              <RefreshCcw size={15} className={isLoading ? 'pulse' : ''} />
            </button>

            <div
              style={{
                width: '1px',
                height: '18px',
                background: 'rgba(255,255,255,0.08)',
                margin: '0 6px'
              }}
            />

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
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <FilesView
            workspacePath={workspacePath}
            allProjects={allProjects}
            onNavigateToProject={onNavigateToProject}
            searchQuery={searchQuery}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            selectedSource={selectedSource}
            viewMode={viewMode}
            setIsLoadingParent={setIsLoading}
            setSourcesParent={setSources}
            filesRef={filesRef}
          />
        </div>
      </div>
    </div>
  )
}
