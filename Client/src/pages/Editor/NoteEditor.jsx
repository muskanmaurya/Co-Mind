import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Sparkles,
  Copy,
  Globe,
  Lock,
  ArrowLeft,
  CheckSquare,
  Tag,
  Archive,
  ArchiveRestore,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'

const normalizeActionItems = (actionItems = []) => {
  if (!Array.isArray(actionItems)) return []

  return actionItems
    .map((item) => {
      if (typeof item === 'string') {
        const text = item.trim()
        return text ? { text, isCompleted: false } : null
      }

      if (!item || typeof item !== 'object') return null

      const text = typeof item.text === 'string' ? item.text.trim() : ''
      if (!text) return null

      return {
        text,
        isCompleted: Boolean(item.isCompleted),
      }
    })
    .filter(Boolean)
}

const NoteEditor = () => {
  const { id } = useParams()
  const { token } = useAuth()
  const navigate = useNavigate()

  // ✅ STATE: Only for rendering
  const [note, setNote] = useState(null)
  const [saving, setSaving] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  // ✅ REFS: Tracking data for save operations (NOT in closure dependencies)
  const timer = useRef(null)
  const hasLoadedData = useRef(false)
  const pendingChanges = useRef({})  // ← NEW: Track pending changes without causing re-renders
  const noteRef = useRef(null)  // ← Keep latest note data

  // Sync noteRef with state so save function always has current data
  useEffect(() => {
    noteRef.current = note
  }, [note])

  // ✅ ISOLATED INITIAL LOAD: Only fetch once when note ID changes
  useEffect(() => {
    const loadInitialNote = async () => {
      if (!id || hasLoadedData.current) return
      try {
        const res = await api.notes.get(id, token)
        const loadedNote = res.note || res
        const aiMetadata = loadedNote.aiMetadata
          ? {
              ...loadedNote.aiMetadata,
              actionItems: normalizeActionItems(loadedNote.aiMetadata.actionItems || loadedNote.aiMetadata.action_items || []),
            }
          : loadedNote.aiMetadata
        const hydratedNote = aiMetadata ? { ...loadedNote, aiMetadata } : loadedNote
        setNote(hydratedNote)
        noteRef.current = hydratedNote
        pendingChanges.current = {}
        hasLoadedData.current = true
      } catch (err) {
        console.error('❌ Failed to load note:', err)
      } finally {
        setIsInitialLoading(false)
      }
    }
    loadInitialNote()
  }, [id])

  // Cleanup timer on unmount
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  // ✅ SAVE: NO dependencies on note! Uses ref instead
  const save = useCallback(async () => {
    if (!noteRef.current || isInitialLoading) {
      console.log('⏭️ Skipping save: no note or still loading')
      return false
    }

    const currentNote = noteRef.current
    const hasChanges = Object.keys(pendingChanges.current).length > 0

    if (!hasChanges) {
      console.log('⏭️ Skipping save: no changes pending')
      return true
    }

    setSaving(true)
    try {
      const latestNote = noteRef.current
      const payload = {
        title: latestNote.title || 'Untitled Note',
        content: latestNote.content || '',
        tags: latestNote.tags || [],
      }
      console.log('💾 Saving payload:', payload)
      const res = await api.notes.update(currentNote._id, token, payload)

      // Keep the live note text from the latest ref; only refresh server-managed fields.
      const serverNote = res.note || res
      const mergedNote = {
        ...latestNote,
        ...serverNote,
        title: latestNote.title ?? serverNote.title,
        content: latestNote.content ?? serverNote.content,
        tags: latestNote.tags ?? serverNote.tags,
      }
      setNote(mergedNote)
      noteRef.current = mergedNote
      pendingChanges.current = {}
      console.log('✅ Save successful')
      return true
    } catch (err) {
      console.error('❌ Save failed:', err)
      return false
    } finally {
      setSaving(false)
    }
  }, [token, isInitialLoading])

  // ✅ STABLE DEBOUNCE: ZERO dependencies! Always gets latest save function at runtime
  const scheduleSave = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      console.log('⏱️ Debounce timer fired, calling save...')
      save()
    }, 1500)
  }, [save])

  // ✅ CONTROLLED INPUT: Update local state instantly, track changes, queue save
  const handleChange = useCallback((field, value) => {
    console.log(`📝 Local change: ${field} = "${value.substring ? value.substring(0, 30) : value}..."`)
    
    // Update state for immediate UI feedback
    setNote((prev) => {
      if (!prev) return prev
      const updated = { ...prev, [field]: value }
      noteRef.current = updated
      return updated
    })
    
    // Track this change
    pendingChanges.current[field] = true
    
    // Queue save
    scheduleSave()
  }, [scheduleSave])

  const handleManualSave = useCallback(async () => {
    const ok = await save()
    if (ok) navigate('/dashboard')
  }, [save, navigate])

  const onTagEnter = useCallback((e) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    const clean = tagInput.trim()
    if (!clean || !noteRef.current) return
    if ((noteRef.current.tags || []).includes(clean)) {
      setTagInput('')
      return
    }
    handleChange('tags', [...(noteRef.current.tags || []), clean])
    setTagInput('')
  }, [tagInput, handleChange])

  const removeTag = useCallback((tag) => {
    if (!noteRef.current) return
    handleChange('tags', (noteRef.current.tags || []).filter((t) => t !== tag))
  }, [handleChange])

  // ✅ AI INTEGRATION: No note dependency!
  const generateAI = useCallback(async () => {
    if (!noteRef.current || !id) return
    setAiLoading(true)
    try {
      console.log('🤖 Requesting AI summary for note:', id)
      const res = await api.notes.generateSummary(id, token)
      console.log('📡 AI Response:', res)
      
      const metadata = res.aiMetadata || res.note?.aiMetadata || {
        summary: res.summary || '',
        actionItems: normalizeActionItems(res.actionItems || res.action_items || []),
        suggested_title: res.suggestedTitle || res.suggested_title || '',
      }
      
      console.log('✅ AI Metadata extracted:', metadata)
      const normalizedMetadata = {
        summary: metadata.summary || '',
        actionItems: normalizeActionItems(metadata.actionItems || metadata.action_items || []),
        suggestedTitle: metadata.suggestedTitle || metadata.suggested_title || '',
      }
      setNote((prev) => prev ? { ...prev, aiMetadata: normalizedMetadata } : prev)
      if (noteRef.current) {
        noteRef.current.aiMetadata = normalizedMetadata
      }
    } catch (err) {
      console.error('❌ AI generation failed:', err)
    } finally {
      setAiLoading(false)
    }
  }, [id, token])

  const toggleVisibility = useCallback(async () => {
    if (!noteRef.current) return
    const next = !noteRef.current.isPublic
    try {
      console.log('🔄 Toggling visibility to:', next)
      const res = await api.shared.toggleVisibility(noteRef.current._id, token, { isPublic: next })
      setNote((prev) => prev ? { ...prev, isPublic: next, shareId: res.shareId || prev.shareId } : prev)
      if (noteRef.current) {
        noteRef.current.isPublic = next
        noteRef.current.shareId = res.shareId || noteRef.current.shareId
      }
      console.log('✅ Visibility toggled')
    } catch (err) {
      console.error('❌ Visibility toggle failed:', err)
    }
  }, [token])

  const toggleArchive = useCallback(async () => {
    if (!noteRef.current) return
    try {
      console.log('📦 Toggling archive state')
      const res = await api.notes.update(noteRef.current._id, token, { isArchived: !noteRef.current.isArchived })
      const serverNote = res.note || res
      setNote((prev) => prev ? { ...prev, isArchived: serverNote.isArchived } : prev)
      if (noteRef.current) {
        noteRef.current.isArchived = serverNote.isArchived
      }
      console.log('✅ Archive state updated')
    } catch (err) {
      console.error('❌ Archive toggle failed:', err)
    }
  }, [token])

  const copyShareLink = useCallback(async () => {
    if (!noteRef.current?.shareId) return
    const url = `http://localhost:5173/shared/${noteRef.current.shareId}`
    try {
      console.log('📋 Copying share link:', url)
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch (err) {
      console.error('❌ Copy failed:', err)
    }
  }, [])

  const applySuggestedTitle = useCallback(() => {
    if (!noteRef.current) return
    const suggested = noteRef.current?.aiMetadata?.suggested_title || noteRef.current?.aiMetadata?.suggestedTitle
    if (!suggested) return
    console.log('✏️ Applying suggested title:', suggested)
    handleChange('title', suggested)
  }, [handleChange])

  const toggleActionItem = useCallback(async (index) => {
    if (!noteRef.current?.aiMetadata) return

    const currentItems = normalizeActionItems(noteRef.current.aiMetadata.actionItems || noteRef.current.aiMetadata.action_items || [])
    const nextItems = currentItems.map((item, itemIndex) => (
      itemIndex === index ? { ...item, isCompleted: !item.isCompleted } : item
    ))

    const nextMetadata = {
      summary: noteRef.current.aiMetadata.summary || '',
      actionItems: nextItems,
      suggestedTitle: noteRef.current.aiMetadata.suggestedTitle || noteRef.current.aiMetadata.suggested_title || '',
    }

    setNote((prev) => prev ? { ...prev, aiMetadata: nextMetadata } : prev)
    noteRef.current.aiMetadata = nextMetadata

    try {
      const res = await api.notes.update(noteRef.current._id, token, { aiMetadata: nextMetadata })
      const savedNote = res.note || res
      const savedMetadata = savedNote.aiMetadata ? {
        ...savedNote.aiMetadata,
        actionItems: normalizeActionItems(savedNote.aiMetadata.actionItems || savedNote.aiMetadata.action_items || []),
      } : nextMetadata
      setNote((prev) => prev ? { ...prev, aiMetadata: savedMetadata } : prev)
      noteRef.current.aiMetadata = savedMetadata
    } catch (error) {
      console.error('❌ Failed to persist action item state:', error)
    }
  }, [token])

  if (isInitialLoading || !note) {
    return (
      <div className="mx-auto w-full max-w-7xl rounded-3xl border border-white/40 bg-white/70 p-12 text-center text-slate-700 backdrop-blur-md">
        <div className="space-y-3">
          <div className="h-8 w-32 animate-pulse rounded bg-slate-200/70 mx-auto" />
          <div className="h-4 w-24 animate-pulse rounded bg-slate-200/70 mx-auto" />
        </div>
      </div>
    )
  }

  const aiActionItems = normalizeActionItems(note?.aiMetadata?.actionItems || note?.aiMetadata?.action_items || [])

  return (
    <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 xl:grid-cols-[1.75fr_1fr]">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-white/40 bg-white/70 p-6 backdrop-blur-md md:p-8"
      >
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 rounded-xl border border-white/50 bg-white/70 px-3 py-2 text-sm text-slate-700 transition hover:bg-white"
            >
              <ArrowLeft size={16} strokeWidth={1.75} />
              Back
            </button>
            <button
              onClick={toggleArchive}
              className="inline-flex items-center gap-2 rounded-xl border border-white/50 bg-white/70 px-3 py-2 text-sm text-slate-700 transition hover:bg-white"
            >
              {note.isArchived ? <ArchiveRestore size={16} strokeWidth={1.75} /> : <Archive size={16} strokeWidth={1.75} />}
              {note.isArchived ? 'Restore' : 'Archive'}
            </button>
          </div>

          <button
            onClick={handleManualSave}
            disabled={saving || isInitialLoading}
            className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save now'}
          </button>
        </header>

        <div className="space-y-4">
          <input
            className="w-full border-0 bg-transparent text-4xl font-black tracking-tight text-slate-900 outline-none placeholder:text-slate-400"
            value={note.title || ''}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Untitled Note"
          />

          <div className="rounded-2xl border border-white/50 bg-white/70 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              <Tag size={14} strokeWidth={1.75} />
              Tags
            </div>

            <div className="mb-2 flex flex-wrap gap-2">
              {(note.tags || []).map((tag) => (
                <button
                  key={tag}
                  onClick={() => removeTag(tag)}
                  className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700"
                >
                  {tag} ×
                </button>
              ))}
            </div>

            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={onTagEnter}
              placeholder="Type a tag and press Enter"
              className="w-full rounded-xl border border-slate-200/70 bg-slate-50/60 px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-sky-300"
            />
          </div>

          <div className="relative">
            <textarea
              className="min-h-[56vh] w-full resize-y rounded-2xl border border-white/50 bg-white/75 p-5 text-[15px] leading-7 text-slate-700 outline-none focus:ring-2 focus:ring-sky-300"
              value={note.content || ''}
              onChange={(e) => handleChange('content', e.target.value)}
              placeholder="Start writing your thoughts..."
            />

            <div className="absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs text-slate-500">
              <span className={`h-2 w-2 rounded-full ${saving ? 'animate-pulse bg-sky-500' : 'bg-emerald-500'}`} />
              {saving ? 'Auto-saving...' : 'Synced'}
            </div>
          </div>
        </div>
      </motion.section>

      <motion.aside
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        className="h-fit space-y-4 rounded-3xl border border-white/40 bg-white/70 p-5 backdrop-blur-md"
      >
        <section className="rounded-2xl border border-white/50 bg-white/70 p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Visibility Status</h3>

          <button
            onClick={toggleVisibility}
            className="mb-3 flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-700"
          >
            <span className="inline-flex items-center gap-2">
              {note.isPublic ? <Globe size={15} strokeWidth={1.75} className="text-emerald-600" /> : <Lock size={15} strokeWidth={1.75} className="text-slate-500" />}
              {note.isPublic ? 'Public Share Page' : 'Private'}
            </span>
            <span className={`h-5 w-10 rounded-full p-0.5 transition ${note.isPublic ? 'bg-emerald-500' : 'bg-slate-300'}`}>
              <span className={`block h-4 w-4 rounded-full bg-white transition ${note.isPublic ? 'translate-x-5' : 'translate-x-0'}`} />
            </span>
          </button>

          {note.isPublic && (
            <div className="space-y-2">
              <input
                readOnly
                value={`http://localhost:5173/shared/${note.shareId || ''}`}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600"
              />
              <button
                onClick={copyShareLink}
                className="inline-flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-100"
              >
                <Copy size={13} strokeWidth={1.75} />
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-white/50 bg-white/70 p-4">
          <button
            onClick={generateAI}
            disabled={aiLoading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-100 disabled:opacity-70"
          >
            <Sparkles size={15} strokeWidth={1.75} />
            Ask AI Companion to Summarize
          </button>

          {aiLoading && (
            <div className="mt-4 space-y-3">
              <div className="h-6 animate-pulse rounded bg-slate-200/70" />
              <div className="h-4 animate-pulse rounded bg-slate-200/70" />
              <div className="h-4 animate-pulse rounded bg-slate-200/70" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200/70" />
            </div>
          )}
        </section>

        {!aiLoading && note.aiMetadata && (
          <section className="space-y-4">
            <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Suggested Title</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {note.aiMetadata.suggested_title || note.aiMetadata.suggestedTitle || 'No suggestion yet'}
              </p>
              <button
                onClick={applySuggestedTitle}
                className="mt-3 rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-50"
              >
                Use this title
              </button>
            </div>

            <div className="rounded-2xl border border-white/50 bg-white/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Summary</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{note.aiMetadata.summary || 'No summary generated yet.'}</p>
            </div>

            <div className="rounded-2xl border border-white/50 bg-white/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Action Items</p>
              {aiActionItems.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">No extracted action items.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {aiActionItems.map((item, idx) => (
                    <li key={`${idx}-${item.text}`} className="flex items-start gap-2 text-sm text-slate-700">
                      <button
                        onClick={() => toggleActionItem(idx)}
                        className="mt-0.5"
                      >
                        <CheckSquare size={16} strokeWidth={1.75} className={item.isCompleted ? 'text-sky-600' : 'text-slate-400'} />
                      </button>
                      <span className={item.isCompleted ? 'line-through text-slate-400' : ''}>{item.text}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}
      </motion.aside>
    </div>
  )
}

export default NoteEditor
