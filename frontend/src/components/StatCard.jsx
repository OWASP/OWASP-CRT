import React from 'react';

const StatCard = ({ title, value, icon: Icon, color, bg, border }) => (
  <div className={`bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.3)] rounded-xl sm:rounded-2xl p-4 sm:p-5 flex flex-col gap-2 sm:gap-3 transition-colors duration-300`}>
    <div className="flex justify-between items-start">
      <span className="text-zinc-400 text-[10px] sm:text-[11px] font-bold tracking-widest uppercase">{title}</span>
      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center ${bg} ${border} border shadow-inner`}>
        <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${color}`} />
      </div>
    </div>
    <div className="text-2xl sm:text-3xl font-bold text-white drop-shadow-sm">{value}</div>
  </div>
);

export default StatCard;