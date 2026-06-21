import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Plus, ChevronDown, UserCircle2, Lock, Globe, LayoutDashboard, LogOut } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'

const NotesList = () => {
  const { token, logout, user } = useAuth()
  const [notes, setNotes] = useState([])
  const [insights, setInsights] = useState(null)
  const [q, setQ] = useState('')
  const [activeTag, setActiveTag] = useState('All')
  const [loading, setLoading] = useState(true)
  const [insightsLoading, setInsightsLoading] = useState(true)
  const navigate = useNavigate()

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.notes.list(token)
      const data = res.notes || res || []
      setNotes([...data].sort((a,b)=>new Date(b.updatedAt||b.createdAt)-new Date(a.updatedAt||a.createdAt)))
    } catch (err) {
      console.error(err)
      if (err.status===401) logout()
    } finally {
      setLoading(false)
    }
  }

  useEffect(()=>{ load() }, [token])

  useEffect(() => {
    const loadInsights = async () => {
      setInsightsLoading(true)
      try {
        const res = await api.dashboard.stats(token)
        setInsights(res.dashboard || null)
      } catch (err) {
        console.error('Failed to load dashboard stats:', err)
      } finally {
        setInsightsLoading(false)
      }
    }

    if (token) loadInsights()
  }, [token])

  const createNew = async () => {
    try {
      const res = await api.notes.create(token, { title: 'Untitled Note', content: '', tags: [] })
      const newId = res?.note?._id || res?._id
      if (newId) navigate(`/workspace/${newId}`)
    } catch (err) { console.error(err) }
  }

  const doSearch = async (e) => {
    e.preventDefault()
    if (!q) return load()
    try{
      const res = await api.notes.search(q, token)
      setNotes(res.results || res.notes || [])
    }catch(err){console.error(err)}
  }

  const tags = useMemo(() => {
    const set = new Set(['All', 'Work', 'Ideas', 'Personal'])
    notes.forEach(n => (n.tags || []).forEach(t => set.add(t)))
    return Array.from(set)
  }, [notes])

  const filteredNotes = useMemo(() => {
    if (activeTag === 'All') return notes
    return notes.filter(n => (n.tags || []).includes(activeTag))
  }, [notes, activeTag])

  const actionCompletion = useMemo(() => {
    const allItems = notes.flatMap((n) => n?.aiMetadata?.actionItems || [])
    const total = allItems.length
    if (!total) return { total: 0, completed: 0, percentage: 0 }

    const completed = allItems.filter((item) => item?.isCompleted).length
    return {
      total,
      completed,
      percentage: Math.round((completed / total) * 100),
    }
  }, [notes])

  const activeNotesCount = insights?.summary?.activeNotes ?? 0
  const aiRequests = insights?.aiUsage?.totalRequests ?? 0

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 rounded-2xl border border-white/40 bg-white/70 p-4 backdrop-blur-md md:flex-row md:items-center md:justify-between"
      >
        <div className="flex items-center gap-2 text-slate-900">
          <LayoutDashboard size={20} strokeWidth={1.75} className="text-sky-600" />
          <h1 className="text-xl font-black tracking-tight">Co-Mind</h1>
        </div>

        <form onSubmit={doSearch} className="flex w-full max-w-xl items-center gap-2 rounded-xl border border-white/40 bg-white/80 px-3 py-2">
          <Search size={16} strokeWidth={1.75} className="text-slate-500" />
          <input
            className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            placeholder="Keyword search..."
            value={q}
            onChange={e=>setQ(e.target.value)}
          />
        </form>

        <div className="flex items-center gap-3 self-end rounded-xl border border-white/50 bg-white/80 px-3 py-2 md:self-auto">
          <UserCircle2 size={18} strokeWidth={1.75} className="text-sky-600" />
          <div className="text-right text-xs leading-tight">
            <p className="font-semibold text-slate-900">{user?.name || 'User'}</p>
            <p className="text-slate-500">{user?.email || 'workspace user'}</p>
          </div>
          <ChevronDown size={14} strokeWidth={1.75} className="text-slate-500" />
          <button
            onClick={()=>{ logout(); navigate('/login') }}
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            title="Logout"
          >
            <LogOut size={16} strokeWidth={1.75} />
          </button>
        </div>
      </motion.header>

      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="no-scrollbar flex max-w-full items-center gap-2 overflow-x-auto">
          {tags.map(tag => (
            <button
              key={tag}
              onClick={()=>setActiveTag(tag)}
              className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                activeTag === tag
                  ? 'border-sky-200 bg-sky-50 text-sky-700'
                  : 'border-white/50 bg-white/60 text-slate-600 hover:bg-white/80'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        <button
          onClick={createNew}
          className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-100"
        >
          <Plus size={16} strokeWidth={1.75} />
          New Note
        </button>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/40 bg-white/70 p-5 backdrop-blur-md">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Velocity</p>
          <p className="mt-3 text-3xl font-black text-slate-900">
            {insightsLoading ? '--' : activeNotesCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">Active notes in motion</p>
        </div>

        <div className="rounded-2xl border border-white/40 bg-white/70 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">AI Engagement</p>
            <span className="text-xs font-semibold text-sky-700">{insightsLoading ? '--' : aiRequests}</span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-slate-200/80">
            <div
              className="h-2 rounded-full bg-sky-500 transition-all duration-500"
              style={{ width: `${Math.min(100, aiRequests * 10)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">Summary generation requests this week</p>
        </div>

        <div className="rounded-2xl border border-white/40 bg-white/70 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Task Completion</p>
            <span className="text-xs font-semibold text-sky-700">{actionCompletion.percentage}%</span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-slate-200/80">
            <div
              className="h-2 rounded-full bg-sky-500 transition-all duration-500"
              style={{ width: `${actionCompletion.percentage}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {actionCompletion.completed} of {actionCompletion.total} extracted action items resolved
          </p>
        </div>
      </section>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="h-48 animate-pulse rounded-2xl border border-white/40 bg-white/60" />
          ))}
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredNotes.map((note, idx) => (
            <motion.article
              key={note._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="group rounded-2xl border border-white/40 bg-white/60 p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:bg-white/80"
            >
              <Link to={`/workspace/${note._id}`} className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="line-clamp-2 text-lg font-bold text-slate-900">{note.title || 'Untitled Note'}</h3>
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    {note.isPublic ? (
                      <><Globe size={12} strokeWidth={1.75} className="text-emerald-600" />Public</>
                    ) : (
                      <><Lock size={12} strokeWidth={1.75} className="text-slate-500" />Private</>
                    )}
                  </span>
                </div>

                <p className="line-clamp-3 text-sm text-slate-700">
                  {note.aiMetadata?.summary || note.content || 'Start writing your note...'}
                </p>

                <div className="flex flex-wrap gap-2">
                  {(note.tags || []).slice(0, 4).map(tag => (
                    <span key={`${note._id}-${tag}`} className="rounded-md bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{tag}</span>
                  ))}
                </div>

                <p className="text-xs text-slate-400">
                  Updated {new Date(note.updatedAt || note.createdAt).toLocaleString()}
                </p>
              </Link>
            </motion.article>
          ))}
        </section>
      )}

      {!loading && filteredNotes.length === 0 && (
        <div className="rounded-2xl border border-white/40 bg-white/70 p-10 text-center text-slate-600 backdrop-blur-md">
          <p className="text-lg font-semibold">No notes found</p>
          <p className="mt-1 text-sm">Try a different keyword or create a new note.</p>
        </div>
      )}
    </div>
  )
}

export default NotesList
