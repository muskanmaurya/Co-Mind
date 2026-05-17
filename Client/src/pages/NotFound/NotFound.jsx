import { useNavigate } from 'react-router-dom';
import { CloudOff, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      {/* Frosted Glass Floating Card */}
      <div className="w-full max-w-md border border-white/40 bg-white/70 p-8 text-center shadow-2xl backdrop-blur-md rounded-3xl animate-in fade-in zoom-in-95 duration-300">
        
        {/* Aesthetic Animated Floating Cloud Icon */}
        <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-sky-50 text-sky-500 shadow-inner animate-bounce duration-1000">
          <CloudOff size={44} strokeWidth={1.5} />
          <div className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-sky-300/50 blur-sm" />
          <div className="absolute -left-2 bottom-2 h-6 w-6 rounded-full bg-white/60 blur-xs" />
        </div>

        {/* Typographical Display */}
        <h1 className="mt-6 text-7xl font-black tracking-tighter text-transparent bg-gradient-to-b from-slate-900 to-slate-700 bg-clip-text">
          404
        </h1>
        
        <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-800">
          Lost in the Clouds
        </h2>
        
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          The note or workspace you are looking for has drifted away, or the link might have expired. Let's get you back to solid ground.
        </p>

        {/* Action Button matching our premium UI theme */}
        <button
          onClick={() => navigate('/dashboard')}
          className="group mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 py-3.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:bg-slate-800 hover:shadow-xl active:scale-98"
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default NotFound;