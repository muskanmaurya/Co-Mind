import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Globe, Sparkles, CheckSquare } from 'lucide-react'
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

const PublicSharePage = () => {
  const { shareId } = useParams()
  const [note, setNote] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await api.shared.get(shareId)
        if (!active) return
        setNote(res.note || res)
      } catch (err) {
        if (!active) return
        setError(err?.body?.message || 'Failed to load shared note')
      } finally {
        if (active) setLoading(false)
      }
    }

    if (shareId) load()

    return () => {
      active = false
    }
  }, [shareId])

  const actionItems = normalizeActionItems(note?.aiMetadata?.actionItems || note?.aiMetadata?.action_items || [])

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl rounded-3xl border border-white/40 bg-white/70 p-10 text-center text-slate-700 backdrop-blur-md">
        Loading shared note...
      </div>
    )
  }

  if (error || !note) {
    return (
      <div className="mx-auto max-w-4xl rounded-3xl border border-white/40 bg-white/70 p-10 text-center text-slate-700 backdrop-blur-md">
        <p className="text-lg font-semibold text-slate-900">Shared note unavailable</p>
        <p className="mt-2 text-sm text-slate-500">{error || 'The note could not be found or is no longer public.'}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl">
      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-[2rem] border border-white/50 bg-white/75 shadow-xl backdrop-blur-md"
      >
        <div className="bg-gradient-to-r from-sky-100 to-white px-6 py-5 md:px-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-3 py-1 text-xs font-semibold text-sky-700">
            <Globe size={14} strokeWidth={1.75} />
            Public Shared Note
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">{note.title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Read-only view of the note content and AI metadata. No login required.
          </p>
        </div>

        <div className="grid gap-6 px-6 py-6 md:px-10 xl:grid-cols-[1.6fr_1fr]">
          <section className="rounded-3xl border border-sky-100 bg-white/80 p-5 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Content</h2>
            <p className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-slate-700">{note.content}</p>
          </section>

          <aside className="space-y-4">
            <section className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-sm">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-sky-700">
                <Sparkles size={14} strokeWidth={1.75} />
                AI Summary
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                {note.aiMetadata?.summary || 'No summary available.'}
              </p>
            </section>

            <section className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Suggested Title</h3>
              <p className="mt-3 text-sm font-semibold text-slate-900">
                {note.aiMetadata?.suggestedTitle || note.aiMetadata?.suggested_title || 'No suggestion available.'}
              </p>
            </section>

            <section className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Action Items</h3>
              {actionItems.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No extracted action items.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {actionItems.map((item, index) => (
                    <li key={`${index}-${item.text}`} className="flex items-start gap-2 text-sm text-slate-700">
                      <CheckSquare size={15} strokeWidth={1.75} className="mt-0.5 text-sky-500" />
                      <span className={item.isCompleted ? 'line-through text-slate-400' : ''}>{item.text}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </aside>
        </div>
      </motion.article>
    </div>
  )
}

export default PublicSharePage