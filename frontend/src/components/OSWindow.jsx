import React, { useRef, useState, useEffect } from 'react';
import Draggable from 'react-draggable';

const OSWindow = ({ id, title, isOpen, isActive, isMaximized, zIndex, top, left, width, height, onClose, onMinimize, onMaximize, onFocus, children }) => {
  const nodeRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const currentWidth = isMaximized ? '100vw' : (isMobile ? '92vw' : width);
  const currentHeight = isMaximized ? '100vh' : (isMobile ? '70vh' : height);
  const currentTop = isMaximized ? '0px' : (isMobile ? '12vh' : top);
  const currentLeft = isMaximized ? '0px' : (isMobile ? '4vw' : left);
  
  const disableDrag = isMaximized || isMobile;

  return (
    <Draggable
      nodeRef={nodeRef}
      handle=".title-bar"
      onStart={onFocus}
      disabled={disableDrag}
      position={disableDrag ? { x: 0, y: 0 } : undefined}
    >
      <div
        ref={nodeRef}
        id={id}
        className={`os-window absolute flex-col bg-[rgba(13,15,22,0.85)] backdrop-blur-[20px] border shadow-[0_25px_50px_rgba(0,0,0,0.6)] pointer-events-auto transition-[box-shadow,border-color] duration-300 ${isActive ? 'border-[#9d4edd] shadow-[0_25px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(157,78,221,0.15)]' : 'border-[rgba(157,78,221,0.3)]'} ${isMaximized ? '!rounded-none !border-x-0 !border-b-0' : 'rounded-[10px] resize overflow-hidden'}`}
        style={{
          zIndex,
          display: isOpen ? 'flex' : 'none',
          top: currentTop,
          left: currentLeft,
          width: currentWidth,
          height: currentHeight,
        }}
        onClick={onFocus}
      >
        <div className={`title-bar bg-[rgba(0,0,0,0.5)] h-[38px] flex justify-between items-center px-[15px] ${disableDrag ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'} ${isMaximized ? 'rounded-none' : 'rounded-t-[9px]'} border-b border-[rgba(157,78,221,0.15)]`}>
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full cursor-pointer transition-colors duration-200 bg-red-500" onClick={(e) => { e.stopPropagation(); onClose(); }}></div>
            <div className="w-3 h-3 rounded-full cursor-pointer transition-colors duration-200 bg-yellow-500" onClick={(e) => { e.stopPropagation(); onMinimize(); }}></div>
            <div className="w-3 h-3 rounded-full cursor-pointer transition-colors duration-200 bg-emerald-500" onClick={(e) => { e.stopPropagation(); onMaximize(); }}></div>
          </div>
          <div className="text-[12px] text-slate-400 font-['Fira_Code',monospace] pointer-events-none truncate px-4">{title}</div>
          <div style={{ width: '40px' }}></div>
        </div>
        <div className="h-[calc(100%-38px)] flex flex-col bg-transparent relative">
          {children}
        </div>
        
        {!isMaximized && (
          <svg className="absolute bottom-[4px] right-[4px] w-3.5 h-3.5 pointer-events-none text-slate-500 opacity-60" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none">
             <line x1="21" y1="14" x2="14" y2="21"></line>
             <line x1="21" y1="8" x2="8" y2="21"></line>
          </svg>
        )}
      </div>
    </Draggable>
  );
};

export default OSWindow;