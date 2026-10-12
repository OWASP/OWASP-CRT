import React from 'react';
import { Home } from 'lucide-react';

const NotFound = ({ setCurrentView }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center animate-fade-in w-full min-h-[60vh] relative z-10 px-4">
      <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-3xl max-w-md w-full p-10 md:p-12 flex flex-col items-center text-center">

        <h2 className="text-5xl font-extrabold mb-2 text-white drop-shadow-md">404</h2>
        <h3 className="text-xl font-bold mb-4 text-zinc-300 uppercase tracking-widest text-[13px]">Page Not Found</h3>
        
        <p className="text-zinc-400 mb-8 leading-relaxed text-sm md:text-base">
          The credential or page you are looking for doesn't exist, has been moved, or the URL is incorrect.
        </p>
        
        <button
          onClick={() => setCurrentView('home')}
          className="w-full py-3.5 rounded-xl bg-white/90 text-black font-bold flex items-center justify-center gap-2 hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:-translate-y-0.5 transition-all"
        >
          <Home className="w-5 h-5" /> Back to Homepage
        </button>
        
      </div>
    </div>
  );
};

export default NotFound;