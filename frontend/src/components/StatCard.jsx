import React from 'react';

const StatCard = ({ title, value, icon: Icon, color, bg, border }) => (
  <div className={`bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] shadow-[0_4px_16px_rgba(0,0,0,0.2)] rounded-lg sm:rounded-xl p-2.5 sm:p-3 flex flex-col gap-1 transition-colors duration-300`}>
    <div className="flex justify-between items-center mb-0.5">
      <span className="text-zinc-400 text-[8px] sm:text-[9px] font-bold tracking-widest uppercase truncate pr-2">{title}</span>
      <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md flex items-center justify-center shrink-0 ${bg} ${border} border shadow-inner`}>
        <Icon className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${color}`} />
      </div>
    </div>
    <div className="text-lg sm:text-xl font-bold text-white drop-shadow-sm leading-none">{value}</div>
  </div>
);

export default StatCard;