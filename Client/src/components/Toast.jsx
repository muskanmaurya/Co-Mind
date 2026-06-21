import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, CheckCircle2, X } from 'lucide-react'

export function Toast({ id, type = 'success', message, onClose }) {
  const bgColor = type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-rose-500' : 'bg-sky-500'
  const Icon = type === 'success' ? CheckCircle2 : type === 'error' ? AlertCircle : AlertCircle
  const borderColor = type === 'success' ? 'border-emerald-400' : type === 'error' ? 'border-rose-400' : 'border-sky-400'

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, x: 20 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, y: -20, x: 20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`min-w-80 flex items-start gap-3 rounded-xl border ${borderColor} ${bgColor} px-4 py-3 shadow-lg backdrop-blur-md`}
    >
      <Icon size={18} strokeWidth={2} className="flex-shrink-0 text-white mt-0.5" />
      <p className="flex-1 text-sm font-medium text-white">{message}</p>
      <button
        onClick={() => onClose?.(id)}
        className="flex-shrink-0 text-white/80 hover:text-white transition"
      >
        <X size={16} strokeWidth={2} />
      </button>
    </motion.div>
  )
}

export function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast {...toast} onClose={() => onRemove(toast.id)} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}
