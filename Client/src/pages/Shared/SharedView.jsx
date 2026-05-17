import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Globe } from 'lucide-react'
import api from '../../services/api'

const SharedView = ()=>{
  const { shareId } = useParams()
  const [note, setNote] = useState(null)

  useEffect(()=>{
    const load = async ()=>{
      try{ const res = await api.shared.get(shareId); setNote(res.note || res) }catch(e){console.error(e)}
    }
    load()
  },[shareId])

  if (!note) return <div className="mx-auto mt-10 max-w-3xl rounded-3xl border border-white/40 bg-white/70 p-10 text-center text-slate-700 backdrop-blur-md">Loading public note...</div>

  return (
    <div className="mx-auto max-w-4xl">
      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-white/40 bg-white/75 p-6 shadow-xl backdrop-blur-md md:p-10"
      >
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
          <Globe size={14} strokeWidth={1.75} />
          Public Shared Note
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">{note.title}</h1>
        <p className="mt-2 whitespace-pre-wrap text-[15px] leading-7 text-slate-700">{note.content}</p>

        <section className="mt-8 rounded-2xl border border-white/50 bg-white/80 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Summary</h3>
          <p className="mt-2 text-sm text-slate-700">{note.aiMetadata?.summary || 'No summary available.'}</p>
        </section>
      </motion.article>
    </div>
  )
}

export default SharedView
