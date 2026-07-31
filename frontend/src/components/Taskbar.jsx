import React, { useState, useEffect } from 'react';

const Taskbar = ({ windows, toggleWindow, overviewMode, toggleOverview }) => {
  const [time, setTime] = useState('00:00');
  const [date, setDate] = useState('JAN 01, 2026');

  useEffect(() => {
    const updateClock = () => {
      const d = new Date();
      setTime(d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0'));
      setDate(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase());
    };
    
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute z-[9998] flex justify-between items-center bg-[rgba(15,17,26,0.7)] backdrop-blur-[25px] shadow-[0_20px_40px_rgba(0,0,0,0.5)] top-0 left-0 w-full h-[60px] px-3 border-b border-[rgba(255,255,255,0.08)] md:top-[15px] md:left-1/2 md:-translate-x-1/2 md:w-[96%] md:max-w-[1200px] md:rounded-[20px] md:border md:border-[rgba(255,255,255,0.08)] md:px-[15px]">
      
      <div className="flex items-center gap-2 relative">
        <div 
          className={`w-[40px] h-[40px] md:w-[44px] md:h-[44px] rounded-[10px] md:rounded-[12px] flex justify-center items-center cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] hover:bg-[rgba(157,78,221,0.2)] hover:border-[rgba(157,78,221,0.5)] hover:shadow-[0_0_15px_rgba(157,78,221,0.3)] hover:scale-105 active:scale-90 ${overviewMode ? 'bg-[rgba(157,78,221,0.2)] border-[rgba(157,78,221,0.5)] shadow-[0_0_15px_rgba(157,78,221,0.3)] scale-105' : ''}`}
          onClick={toggleOverview}
          title="Task View (Overview)"
        >
          <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] md:w-[22px] md:h-[22px] fill-[#9d4edd] stroke-none transition-transform duration-300"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
        </div>
        <div className="w-[1px] h-[24px] bg-[rgba(255,255,255,0.1)] mx-[2px] md:mx-[5px]"></div>
      </div>

      <div className="flex gap-1 md:gap-2 items-center absolute left-1/2 -translate-x-1/2">
        {windows?.guide?.isOpen && (
          <div 
            className="w-[40px] h-[40px] md:w-[44px] md:h-[44px] rounded-[10px] md:rounded-[12px] flex justify-center items-center bg-transparent transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] relative cursor-pointer hover:bg-[rgba(255,255,255,0.08)] hover:-translate-y-1 group"
            onClick={() => toggleWindow('guide')}
          >
            <div className="absolute top-[60px] left-1/2 -translate-x-1/2 -translate-y-2.5 bg-[rgba(0,0,0,0.8)] text-white px-2.5 py-1 rounded-[6px] text-[11px] font-['Inter',sans-serif] pointer-events-none opacity-0 transition-opacity duration-200 whitespace-nowrap border border-[rgba(255,255,255,0.1)] z-[10000] group-hover:opacity-100 group-hover:translate-y-0 hidden md:block">System Guide</div>
            <svg viewBox="0 0 24 24" className={`w-[20px] h-[20px] md:w-[22px] md:h-[22px] stroke-[1.5] fill-none transition-all duration-300 group-hover:stroke-[#9d4edd] ${windows.guide.isActive ? 'stroke-[#9d4edd] drop-shadow-[0_0_8px_rgba(157,78,221,0.4)]' : 'stroke-slate-400'}`}><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            <div className={`absolute bottom-[3px] left-1/2 -translate-x-1/2 h-[4px] rounded-[2px] transition-all duration-300 ${windows.guide.isActive ? 'bg-[#9d4edd] w-[14px] shadow-[0_0_8px_rgba(157,78,221,0.6)] opacity-100' : 'bg-slate-500 w-[4px] opacity-100'}`}></div>
          </div>
        )}
        
        {windows?.letter?.isOpen && (
          <div 
            className="w-[40px] h-[40px] md:w-[44px] md:h-[44px] rounded-[10px] md:rounded-[12px] flex justify-center items-center bg-transparent transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] relative cursor-pointer hover:bg-[rgba(255,255,255,0.08)] hover:-translate-y-1 group"
            onClick={() => toggleWindow('letter')}
          >
            <div className="absolute top-[60px] left-1/2 -translate-x-1/2 -translate-y-2.5 bg-[rgba(0,0,0,0.8)] text-white px-2.5 py-1 rounded-[6px] text-[11px] font-['Inter',sans-serif] pointer-events-none opacity-0 transition-opacity duration-200 whitespace-nowrap border border-[rgba(255,255,255,0.1)] z-[10000] group-hover:opacity-100 group-hover:translate-y-0 hidden md:block">Briefing Letter</div>
            <svg viewBox="0 0 24 24" className={`w-[20px] h-[20px] md:w-[22px] md:h-[22px] stroke-[1.5] fill-none transition-all duration-300 group-hover:stroke-[#9d4edd] ${windows.letter.isActive ? 'stroke-[#9d4edd] drop-shadow-[0_0_8px_rgba(157,78,221,0.4)]' : 'stroke-slate-400'}`}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            <div className={`absolute bottom-[3px] left-1/2 -translate-x-1/2 h-[4px] rounded-[2px] transition-all duration-300 ${windows.letter.isActive ? 'bg-[#9d4edd] w-[14px] shadow-[0_0_8px_rgba(157,78,221,0.6)] opacity-100' : 'bg-slate-500 w-[4px] opacity-100'}`}></div>
          </div>
        )}
        
        {windows?.tool?.isOpen && (
          <div 
            className="w-[40px] h-[40px] md:w-[44px] md:h-[44px] rounded-[10px] md:rounded-[12px] flex justify-center items-center bg-transparent transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] relative cursor-pointer hover:bg-[rgba(255,255,255,0.08)] hover:-translate-y-1 group"
            onClick={() => toggleWindow('tool')}
          >
            <div className="absolute top-[60px] left-1/2 -translate-x-1/2 -translate-y-2.5 bg-[rgba(0,0,0,0.8)] text-white px-2.5 py-1 rounded-[6px] text-[11px] font-['Inter',sans-serif] pointer-events-none opacity-0 transition-opacity duration-200 whitespace-nowrap border border-[rgba(255,255,255,0.1)] z-[10000] group-hover:opacity-100 group-hover:translate-y-0 hidden md:block">Terminal Engine</div>
            <svg viewBox="0 0 24 24" className={`w-[20px] h-[20px] md:w-[22px] md:h-[22px] stroke-[1.5] fill-none transition-all duration-300 group-hover:stroke-[#9d4edd] ${windows.tool.isActive ? 'stroke-[#9d4edd] drop-shadow-[0_0_8px_rgba(157,78,221,0.4)]' : 'stroke-slate-400'}`}><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
            <div className={`absolute bottom-[3px] left-1/2 -translate-x-1/2 h-[4px] rounded-[2px] transition-all duration-300 ${windows.tool.isActive ? 'bg-[#9d4edd] w-[14px] shadow-[0_0_8px_rgba(157,78,221,0.6)] opacity-100' : 'bg-slate-500 w-[4px] opacity-100'}`}></div>
          </div>
        )}
        
        {windows?.cert?.isOpen && (
          <div 
            className="w-[40px] h-[40px] md:w-[44px] md:h-[44px] rounded-[10px] md:rounded-[12px] flex justify-center items-center bg-transparent transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] relative cursor-pointer hover:bg-[rgba(255,255,255,0.08)] hover:-translate-y-1 group"
            onClick={() => toggleWindow('cert')}
          >
            <div className="absolute top-[60px] left-1/2 -translate-x-1/2 -translate-y-2.5 bg-[rgba(0,0,0,0.8)] text-white px-2.5 py-1 rounded-[6px] text-[11px] font-['Inter',sans-serif] pointer-events-none opacity-0 transition-opacity duration-200 whitespace-nowrap border border-[rgba(255,255,255,0.1)] z-[10000] group-hover:opacity-100 group-hover:translate-y-0 hidden md:block">Identity Viewer</div>
            <svg viewBox="0 0 24 24" className={`w-[20px] h-[20px] md:w-[22px] md:h-[22px] stroke-[1.5] fill-none transition-all duration-300 group-hover:stroke-[#9d4edd] ${windows.cert.isActive ? 'stroke-[#9d4edd] drop-shadow-[0_0_8px_rgba(157,78,221,0.4)]' : 'stroke-slate-400'}`}><path d="M12 15l-2 5l9-5l-2-5l-2-5l-9 5l-2-5l-2 5l9 5z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <div className={`absolute bottom-[3px] left-1/2 -translate-x-1/2 h-[4px] rounded-[2px] transition-all duration-300 ${windows.cert.isActive ? 'bg-[#9d4edd] w-[14px] shadow-[0_0_8px_rgba(157,78,221,0.6)] opacity-100' : 'bg-slate-500 w-[4px] opacity-100'}`}></div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <div className="flex gap-2 md:gap-3 px-2 py-1.5 md:px-3.5 md:py-2 bg-[rgba(0,0,0,0.25)] rounded-[10px] md:rounded-[12px] border border-[rgba(255,255,255,0.05)] cursor-default items-center">
          <span className="text-[10px] md:text-[11px] font-bold font-['Inter',sans-serif] block leading-none text-slate-300 transition-colors duration-200 cursor-pointer hover:text-[#9d4edd]" title="Keyboard Layout: English">EN</span>
          <svg viewBox="0 0 24 24" className="w-[14px] h-[14px] md:w-4 md:h-4 stroke-2 stroke-slate-300 fill-none transition-colors duration-200 cursor-pointer hover:stroke-[#9d4edd]" title="Network: Wired Connected"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
          <svg viewBox="0 0 24 24" className="w-[14px] h-[14px] md:w-4 md:h-4 stroke-2 stroke-slate-300 fill-none transition-colors duration-200 cursor-pointer hover:stroke-[#9d4edd] hidden sm:block" title="Volume: 100%"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
          <div className="cursor-pointer" onClick={() => { alert('Session closed.'); window.location.reload(); }} title="Log Out">
            <svg viewBox="0 0 24 24" className="w-[14px] h-[14px] md:w-4 md:h-4 stroke-2 stroke-slate-300 fill-none transition-colors duration-200 hover:stroke-[#9d4edd]"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center px-3.5 py-1 bg-[rgba(0,0,0,0.25)] rounded-[12px] cursor-default border border-[rgba(255,255,255,0.05)] transition-colors duration-200 hover:bg-[rgba(255,255,255,0.05)] hidden md:flex">
          <span className="text-[13px] font-bold text-[#9d4edd] font-['Inter',sans-serif] tracking-[0.5px]">{time}</span>
          <span className="text-[9px] text-slate-400 font-['Inter',sans-serif] uppercase font-semibold">{date}</span>
        </div>
      </div>
    </div>
  );
};

export default Taskbar;