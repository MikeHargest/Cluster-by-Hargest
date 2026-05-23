import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  Search,
  FolderOpen,
  FileText,
  Image,
  Film,
  Music,
  Archive,
  Code,
  FileJson,
  FileSpreadsheet,
  File,
  ChevronUp,
  ChevronDown,
  RefreshCcw,
  ExternalLink,
  FolderSearch,
  LayoutGrid,
  List,
  X,
  Folder
} from 'lucide-react'
import { AppFile } from '../types'

interface FilesViewProps {
  workspacePath: string
  allProjects: { id: string; name: string; path?: string }[]
  onNavigateToProject?: (projectId: string) => void // kept for future use
}

type SortKey = 'name' | 'source' | 'lastModified' | 'size' | 'extension'
type SortDir = 'asc' | 'desc'
type ViewMode = 'list' | 'grid'

const EXT_CATEGORIES: Record<string, string[]> = {
  image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico', 'bmp', 'tiff', 'avif'],
  video: ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv'],
  audio: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'],
  document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods'],
  text: ['md', 'txt', 'rtf', 'csv'],
  code: ['ts', 'tsx', 'js', 'jsx', 'py', 'rb', 'go', 'rs', 'cpp', 'c', 'h', 'java', 'cs', 'php', 'html', 'css', 'scss', 'less', 'sh', 'bash', 'zsh', 'yaml', 'yml', 'toml'],
  data: ['json', 'xml', 'sql'],
  archive: ['zip', 'tar', 'gz', 'rar', '7z', 'bz2'],
  board: ['board', 'ibo'],
}

function getFileCategory(ext: string): string {
  const clean = ext.replace('.', '').toLowerCase()
  for (const [cat, exts] of Object.entries(EXT_CATEGORIES)) {
    if (exts.includes(clean)) return cat
  }
  return 'other'
}

function FileIcon({ ext, size = 18 }: { ext: string; size?: number }) {
  const cat = getFileCategory(ext)
  const style = { flexShrink: 0 }
  switch (cat) {
    case 'image': return <Image size={size} style={style} className="file-icon-image" />
    case 'video': return <Film size={size} style={style} className="file-icon-video" />
    case 'audio': return <Music size={size} style={style} className="file-icon-audio" />
    case 'document': return <FileSpreadsheet size={size} style={style} className="file-icon-doc" />
    case 'text': return <FileText size={size} style={style} className="file-icon-text" />
    case 'code': return <Code size={size} style={style} className="file-icon-code" />
    case 'data': return <FileJson size={size} style={style} className="file-icon-data" />
    case 'archive': return <Archive size={size} style={style} className="file-icon-archive" />
    case 'board': return <LayoutGrid size={size} style={style} className="file-icon-board" />
    default: return <File size={size} style={style} className="file-icon-other" />
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`
}

function formatDate(ms: number): string {
  const d = new Date(ms)
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

function getSourceLabel(source: string, allProjects: { id: string; name: string }[]): string {
  if (source === 'Workspace Root') return 'Workspace Root'
  const proj = allProjects.find(p => p.name === source)
  return proj?.name || source
}

const CATEGORY_FILTER_OPTIONS = [
  { value: 'all', label: 'All files' },
  { value: 'image', label: 'Images' },
  { value: 'video', label: 'Video' },
  { value: 'audio', label: 'Audio' },
  { value: 'document', label: 'Documents' },
  { value: 'text', label: 'Text & Notes' },
  { value: 'code', label: 'Code' },
  { value: 'data', label: 'Data' },
  { value: 'archive', label: 'Archives' },
  { value: 'board', label: 'Boards' },
  { value: 'other', label: 'Other' },
]

export default function FilesView({ workspacePath, allProjects, onNavigateToProject: _onNavigateToProject }: FilesViewProps) {
  const [files, setFiles] = useState<AppFile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('lastModified')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [selectedSource, setSelectedSource] = useState('all')
  const [activeFile, setActiveFile] = useState<AppFile | null>(null)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [openError, setOpenError] = useState<string | null>(null)
  const filterPanelRef = useRef<HTMLDivElement>(null)

  const loadFiles = useCallback(async () => {
    if (!workspacePath) return
    setIsLoading(true)
    try {
      // @ts-ignore
      const result = await window.api.scanAllFiles(workspacePath)
      setFiles(result || [])
    } catch (e) {
      console.error('FilesView: failed to scan files', e)
    } finally {
      setIsLoading(false)
    }
  }, [workspacePath])

  useEffect(() => {
    loadFiles()
  }, [loadFiles])

  // Close filter panel on outside click
  useEffect(() => {
    if (!showFilterPanel) return
    const handler = (e: MouseEvent) => {
      if (filterPanelRef.current && !filterPanelRef.current.contains(e.target as Node)) {
        setShowFilterPanel(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showFilterPanel])

  // Distinct sources
  const sources = useMemo(() => {
    const s = new Set<string>()
    files.forEach(f => s.add(f.source))
    return Array.from(s).sort()
  }, [files])

  // Filtered + sorted files
  const displayFiles = useMemo(() => {
    let f = files
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      f = f.filter(file =>
        file.name.toLowerCase().includes(q) ||
        file.source.toLowerCase().includes(q) ||
        file.extension.toLowerCase().includes(q)
      )
    }
    if (categoryFilter !== 'all') {
      f = f.filter(file => getFileCategory(file.extension) === categoryFilter)
    }
    if (selectedSource !== 'all') {
      f = f.filter(file => file.source === selectedSource)
    }
    f = [...f].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'name': cmp = a.name.localeCompare(b.name); break
        case 'source': cmp = a.source.localeCompare(b.source); break
        case 'lastModified': cmp = a.lastModified - b.lastModified; break
        case 'size': cmp = a.size - b.size; break
        case 'extension': cmp = a.extension.localeCompare(b.extension); break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return f
  }, [files, searchQuery, sortKey, sortDir, categoryFilter, selectedSource])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const handleOpenFile = async (file: AppFile) => {
    setOpenError(null)
    try {
      // @ts-ignore
      const err = await window.api.openPath(file.path)
      if (err) setOpenError(err)
    } catch (e: any) {
      setOpenError(e?.message || 'Failed to open file')
    }
  }

  const handleShowInFolder = async (file: AppFile) => {
    // @ts-ignore
    await window.api.showItemInFolder(file.path)
  }

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <span style={{ opacity: 0.2, display: 'inline-flex' }}><ChevronDown size={12} /></span>
    return sortDir === 'asc'
      ? <ChevronUp size={12} style={{ opacity: 0.7 }} />
      : <ChevronDown size={12} style={{ opacity: 0.7 }} />
  }

  const totalSize = useMemo(() => displayFiles.reduce((s, f) => s + f.size, 0), [displayFiles])

  return (
    <div className="files-view">
      <style>{`
        .files-view {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
          background: var(--bg-color, #1b1b1b);
          color: var(--text-primary, #eaeaea);
          font-family: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
          user-select: none;
          overflow: hidden;
        }

        /* ── Toolbar ── */
        .fv-toolbar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.02);
          flex-shrink: 0;
        }
        .fv-search-wrap {
          display: flex;
          align-items: center;
          gap: 7px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          padding: 5px 10px;
          flex: 1;
          max-width: 340px;
          transition: border-color 0.15s;
        }
        .fv-search-wrap:focus-within {
          border-color: rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.07);
        }
        .fv-search-wrap input {
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-primary, #eaeaea);
          font-size: 13px;
          width: 100%;
        }
        .fv-search-wrap input::placeholder {
          color: rgba(255,255,255,0.3);
        }
        .fv-search-clear {
          background: none; border: none; cursor: pointer;
          color: rgba(255,255,255,0.35); padding: 0; display: flex; align-items: center;
          transition: color 0.15s;
        }
        .fv-search-clear:hover { color: rgba(255,255,255,0.7); }

        .fv-icon-btn {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 7px;
          color: rgba(255,255,255,0.6);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px 8px;
          transition: all 0.15s;
          font-size: 12px;
          gap: 5px;
        }
        .fv-icon-btn:hover {
          background: rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.9);
        }
        .fv-icon-btn.active {
          background: rgba(255,255,255,0.12);
          border-color: rgba(255,255,255,0.2);
          color: #fff;
        }

        .fv-source-select {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          color: rgba(255,255,255,0.75);
          font-size: 12px;
          padding: 5px 8px;
          outline: none;
          cursor: pointer;
          transition: all 0.15s;
        }
        .fv-source-select:hover { border-color: rgba(255,255,255,0.2); }
        .fv-source-select:focus { border-color: rgba(255,255,255,0.3); }

        /* ── Category filter row ── */
        .fv-filter-row {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 8px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          overflow-x: auto;
          flex-shrink: 0;
          scrollbar-width: none;
        }
        .fv-filter-row::-webkit-scrollbar { display: none; }
        .fv-filter-pill {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          color: rgba(255,255,255,0.5);
          font-size: 11px;
          padding: 3px 11px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .fv-filter-pill:hover {
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.8);
        }
        .fv-filter-pill.active {
          background: rgba(255,255,255,0.12);
          border-color: rgba(255,255,255,0.25);
          color: #fff;
        }

        /* ── Status bar ── */
        .fv-status {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 5px 16px;
          font-size: 11px;
          color: rgba(255,255,255,0.35);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          flex-shrink: 0;
        }
        .fv-status span + span::before {
          content: '·';
          margin-right: 12px;
          opacity: 0.4;
        }

        /* ── Table ── */
        .fv-table-wrap {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          min-height: 0;
        }
        .fv-table-wrap::-webkit-scrollbar { width: 5px; }
        .fv-table-wrap::-webkit-scrollbar-track { background: transparent; }
        .fv-table-wrap::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }

        .fv-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }
        .fv-table thead {
          position: sticky;
          top: 0;
          z-index: 2;
          background: var(--bg-color, #1b1b1b);
        }
        .fv-table thead th {
          text-align: left;
          padding: 8px 12px;
          font-size: 11px;
          font-weight: 500;
          color: rgba(255,255,255,0.35);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          cursor: pointer;
          white-space: nowrap;
          user-select: none;
          letter-spacing: 0.4px;
          text-transform: uppercase;
        }
        .fv-table thead th:hover { color: rgba(255,255,255,0.65); }
        .fv-th-inner {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .fv-table tbody tr {
          border-bottom: 1px solid rgba(255,255,255,0.04);
          cursor: pointer;
          transition: background 0.1s;
        }
        .fv-table tbody tr:hover { background: rgba(255,255,255,0.04); }
        .fv-table tbody tr.selected { background: rgba(255,255,255,0.07); }
        .fv-table tbody td {
          padding: 7px 12px;
          font-size: 13px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          vertical-align: middle;
        }
        .fv-col-name { width: 38%; }
        .fv-col-source { width: 20%; }
        .fv-col-ext { width: 8%; }
        .fv-col-modified { width: 18%; }
        .fv-col-size { width: 10%; }
        .fv-col-actions { width: 6%; }

        .fv-file-name-cell {
          display: flex;
          align-items: center;
          gap: 9px;
          overflow: hidden;
        }
        .fv-file-name-text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: rgba(255,255,255,0.87);
        }
        .fv-file-name-text:hover { color: #fff; }

        .fv-ext-badge {
          font-size: 10px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
          background: rgba(255,255,255,0.07);
          color: rgba(255,255,255,0.45);
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .fv-source-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: rgba(255,255,255,0.45);
        }
        .fv-source-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: rgba(255,255,255,0.2);
          flex-shrink: 0;
        }
        .fv-modified-text { color: rgba(255,255,255,0.4); font-size: 12px; }
        .fv-size-text { color: rgba(255,255,255,0.4); font-size: 12px; }

        .fv-row-actions {
          display: flex;
          align-items: center;
          gap: 3px;
          opacity: 0;
          transition: opacity 0.15s;
        }
        .fv-table tbody tr:hover .fv-row-actions { opacity: 1; }
        .fv-table tbody tr.selected .fv-row-actions { opacity: 1; }
        .fv-row-action-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(255,255,255,0.45);
          padding: 3px;
          border-radius: 5px;
          display: flex;
          align-items: center;
          transition: all 0.15s;
        }
        .fv-row-action-btn:hover {
          background: rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.9);
        }

        /* ── File icon colors ── */
        .file-icon-image { color: #7dd3fc; }
        .file-icon-video { color: #c084fc; }
        .file-icon-audio { color: #86efac; }
        .file-icon-doc { color: #fde68a; }
        .file-icon-text { color: #a5f3fc; }
        .file-icon-code { color: #fb923c; }
        .file-icon-data { color: #6ee7b7; }
        .file-icon-archive { color: #fca5a5; }
        .file-icon-board { color: #a78bfa; }
        .file-icon-other { color: rgba(255,255,255,0.3); }

        /* ── Grid mode ── */
        .fv-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 12px;
          padding: 16px;
        }
        .fv-grid-item {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          padding: 16px 12px 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 9px;
          cursor: pointer;
          transition: all 0.15s;
          position: relative;
        }
        .fv-grid-item:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.14);
          transform: translateY(-1px);
        }
        .fv-grid-item.selected {
          background: rgba(255,255,255,0.09);
          border-color: rgba(255,255,255,0.2);
        }
        .fv-grid-icon { opacity: 0.85; }
        .fv-grid-name {
          font-size: 12px;
          color: rgba(255,255,255,0.8);
          text-align: center;
          word-break: break-word;
          line-height: 1.3;
          max-height: 2.6em;
          overflow: hidden;
        }
        .fv-grid-source {
          font-size: 10px;
          color: rgba(255,255,255,0.3);
          text-align: center;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          width: 100%;
          text-align: center;
        }
        .fv-grid-actions {
          position: absolute;
          top: 6px;
          right: 6px;
          display: flex;
          gap: 3px;
          opacity: 0;
          transition: opacity 0.15s;
        }
        .fv-grid-item:hover .fv-grid-actions,
        .fv-grid-item.selected .fv-grid-actions { opacity: 1; }

        /* ── Empty state ── */
        .fv-empty {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 14px;
          color: rgba(255,255,255,0.2);
          padding: 60px 20px;
        }
        .fv-empty-icon { opacity: 0.15; }
        .fv-empty-title { font-size: 15px; font-weight: 500; color: rgba(255,255,255,0.3); }
        .fv-empty-desc { font-size: 12px; color: rgba(255,255,255,0.2); text-align: center; max-width: 260px; line-height: 1.6; }

        /* ── Loading ── */
        .fv-loading {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: rgba(255,255,255,0.3);
          font-size: 13px;
        }
        @keyframes fv-spin { to { transform: rotate(360deg); } }
        .fv-spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.1);
          border-top-color: rgba(255,255,255,0.5);
          border-radius: 50%;
          animation: fv-spin 0.8s linear infinite;
        }

        /* ── Error toast ── */
        .fv-error-toast {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: 10px;
          padding: 10px 16px;
          font-size: 13px;
          color: #fca5a5;
          display: flex;
          align-items: center;
          gap: 10px;
          z-index: 9999;
          backdrop-filter: blur(8px);
          max-width: 400px;
        }
        .fv-error-dismiss {
          background: none; border: none; cursor: pointer;
          color: rgba(255,255,255,0.4); display: flex; align-items: center;
        }
        .fv-error-dismiss:hover { color: #fff; }
      `}</style>

      {/* Toolbar */}
      <div className="fv-toolbar">
        <div className="fv-search-wrap">
          <Search size={14} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="fv-search-clear" onClick={() => setSearchQuery('')}>
              <X size={12} />
            </button>
          )}
        </div>

        {/* Source selector */}
        <select
          className="fv-source-select"
          value={selectedSource}
          onChange={e => setSelectedSource(e.target.value)}
          title="Filter by project"
        >
          <option value="all">All sources</option>
          {sources.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          <button
            className={`fv-icon-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="List view"
          >
            <List size={15} />
          </button>
          <button
            className={`fv-icon-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid view"
          >
            <LayoutGrid size={15} />
          </button>
          <button
            className="fv-icon-btn"
            onClick={loadFiles}
            title="Refresh"
            disabled={isLoading}
          >
            <RefreshCcw size={15} style={isLoading ? { opacity: 0.4 } : undefined} />
          </button>
        </div>
      </div>

      {/* Category filters */}
      <div className="fv-filter-row">
        {CATEGORY_FILTER_OPTIONS.map(opt => (
          <button
            key={opt.value}
            className={`fv-filter-pill ${categoryFilter === opt.value ? 'active' : ''}`}
            onClick={() => setCategoryFilter(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Status bar */}
      <div className="fv-status">
        <span>{displayFiles.length} file{displayFiles.length !== 1 ? 's' : ''}</span>
        {displayFiles.length > 0 && <span>{formatBytes(totalSize)}</span>}
        {searchQuery && <span>"{searchQuery}"</span>}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="fv-loading">
          <div className="fv-spinner" />
          <span>Scanning files...</span>
        </div>
      ) : displayFiles.length === 0 ? (
        <div className="fv-empty">
          <FolderSearch size={52} className="fv-empty-icon" />
          <div className="fv-empty-title">
            {searchQuery || categoryFilter !== 'all' || selectedSource !== 'all'
              ? 'No matching files'
              : 'No files yet'}
          </div>
          <div className="fv-empty-desc">
            {searchQuery || categoryFilter !== 'all' || selectedSource !== 'all'
              ? 'Try adjusting your search or filters.'
              : 'Add files to the notes, boards, attachments or overview folders of your projects.'}
          </div>
        </div>
      ) : viewMode === 'list' ? (
        <div className="fv-table-wrap">
          <table className="fv-table">
            <colgroup>
              <col className="fv-col-name" />
              <col className="fv-col-source" />
              <col className="fv-col-ext" />
              <col className="fv-col-modified" />
              <col className="fv-col-size" />
              <col className="fv-col-actions" />
            </colgroup>
            <thead>
              <tr>
                <th onClick={() => handleSort('name')}>
                  <span className="fv-th-inner">Name <SortIcon k="name" /></span>
                </th>
                <th onClick={() => handleSort('source')}>
                  <span className="fv-th-inner">Source <SortIcon k="source" /></span>
                </th>
                <th onClick={() => handleSort('extension')}>
                  <span className="fv-th-inner">Type <SortIcon k="extension" /></span>
                </th>
                <th onClick={() => handleSort('lastModified')}>
                  <span className="fv-th-inner">Modified <SortIcon k="lastModified" /></span>
                </th>
                <th onClick={() => handleSort('size')}>
                  <span className="fv-th-inner">Size <SortIcon k="size" /></span>
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {displayFiles.map(file => (
                <tr
                  key={file.id}
                  className={activeFile?.id === file.id ? 'selected' : ''}
                  onClick={() => setActiveFile(file === activeFile ? null : file)}
                  onDoubleClick={() => handleOpenFile(file)}
                >
                  <td>
                    <div className="fv-file-name-cell">
                      <FileIcon ext={file.extension} size={16} />
                      <span className="fv-file-name-text" title={file.name}>{file.name}</span>
                    </div>
                  </td>
                  <td>
                    <div className="fv-source-tag">
                      <span className="fv-source-dot" />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
                        title={getSourceLabel(file.source, allProjects)}>
                        {getSourceLabel(file.source, allProjects)}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="fv-ext-badge">
                      {file.extension.replace('.', '') || '—'}
                    </span>
                  </td>
                  <td>
                    <span className="fv-modified-text">{formatDate(file.lastModified)}</span>
                  </td>
                  <td>
                    <span className="fv-size-text">{formatBytes(file.size)}</span>
                  </td>
                  <td>
                    <div className="fv-row-actions">
                      <button
                        className="fv-row-action-btn"
                        title="Open file"
                        onClick={e => { e.stopPropagation(); handleOpenFile(file) }}
                      >
                        <ExternalLink size={13} />
                      </button>
                      <button
                        className="fv-row-action-btn"
                        title="Show in folder"
                        onClick={e => { e.stopPropagation(); handleShowInFolder(file) }}
                      >
                        <FolderOpen size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Grid view */
        <div className="fv-table-wrap">
          <div className="fv-grid">
            {displayFiles.map(file => (
              <div
                key={file.id}
                className={`fv-grid-item ${activeFile?.id === file.id ? 'selected' : ''}`}
                onClick={() => setActiveFile(file === activeFile ? null : file)}
                onDoubleClick={() => handleOpenFile(file)}
                title={file.name}
              >
                <div className="fv-grid-actions">
                  <button
                    className="fv-row-action-btn"
                    title="Open"
                    onClick={e => { e.stopPropagation(); handleOpenFile(file) }}
                  >
                    <ExternalLink size={11} />
                  </button>
                  <button
                    className="fv-row-action-btn"
                    title="Show in folder"
                    onClick={e => { e.stopPropagation(); handleShowInFolder(file) }}
                  >
                    <FolderOpen size={11} />
                  </button>
                </div>
                <div className="fv-grid-icon">
                  <FileIcon ext={file.extension} size={30} />
                </div>
                <div className="fv-grid-name">{file.name}</div>
                <div className="fv-grid-source">
                  <Folder size={9} style={{ display: 'inline', marginRight: 3, verticalAlign: 'middle' }} />
                  {getSourceLabel(file.source, allProjects)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error toast */}
      {openError && (
        <div className="fv-error-toast">
          <span>{openError}</span>
          <button className="fv-error-dismiss" onClick={() => setOpenError(null)}>
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
