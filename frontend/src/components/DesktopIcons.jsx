import React, { useState, useEffect } from 'react';
import { jsPDF } from "jspdf";

const DesktopIcons = ({ toggleWindow, tutorialStep, advanceTutorial, telemetryData, certId }) => {
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  
  const [tData, setTData] = useState({
    status: 'STANDBY', commits: '--', projects: '--', added: '--', removed: '--', repositories: [],
    bars: { commits: 0, projects: 0, added: 0, removed: 0, tier: '0%' }, 
    tierText: 'System scanning for parameters...', nextTier: 'AWAITING IDENTITY',
    tierColor: '#4a7bfe', nextColor: '#9d4edd', currentTier: 'BRONZE'
  });
  
  const [isTouchMode, setIsTouchMode] = useState(false);

  useEffect(() => {
    const checkMode = () => {
      setIsTouchMode(
        window.innerWidth <= 1200 || 
        window.matchMedia("(pointer: coarse)").matches || 
        'ontouchstart' in window || 
        navigator.maxTouchPoints > 0
      );
    };
    
    checkMode();
    window.addEventListener('resize', checkMode);
    return () => window.removeEventListener('resize', checkMode);
  }, []);

  useEffect(() => {
    if (telemetryData) {
      const { tier, stats } = telemetryData;
      const currentTier = (tier || "BRONZE").toUpperCase();
      
      setTData(p => ({ ...p, status: 'CONNECTED', currentTier }));
      
      let cFill = 0; let pFill = 0; let lFill = 0;
      if (currentTier === 'BRONZE') { cFill = 4; pFill = 3; lFill = 41; }
      else if (currentTier === 'SILVER') { cFill = 7; pFill = 6; lFill = 71; }
      else if (currentTier === 'GOLD') { cFill = 10; pFill = 10; lFill = 100; }

      setTimeout(() => setTData(p => ({ ...p, commits: stats.merged_commits || '0', bars: { ...p.bars, commits: cFill } })), 500);
      setTimeout(() => setTData(p => ({ ...p, projects: stats.project_count || '0', bars: { ...p.bars, projects: pFill } })), 900);
      setTimeout(() => setTData(p => ({ ...p, repositories: stats.repositories || [] })), 1100);
      setTimeout(() => setTData(p => ({ ...p, added: '+' + (stats.lines_added || '0'), bars: { ...p.bars, added: lFill } })), 1300);
      setTimeout(() => setTData(p => ({ ...p, removed: '-' + (stats.lines_removed || '0'), bars: { ...p.bars, removed: lFill } })), 1700);
      
      let nextTier = 'SILVER'; let progressPct = '65%'; let fillPct = '65%';
      let tierColor = '#4a7bfe'; let nextColor = '#9d4edd';
      
      if(currentTier === 'BRONZE') { nextTier = 'SILVER'; progressPct = '68%'; fillPct = '68%'; tierColor = '#4a7bfe'; nextColor = '#9d4edd'; }
      else if(currentTier === 'SILVER') { nextTier = 'GOLD'; progressPct = '82%'; fillPct = '82%'; tierColor = '#9d4edd'; nextColor = '#ff2a5f'; }
      else if(currentTier === 'GOLD') { nextTier = 'MAX LEVEL'; progressPct = '100% Achieved'; fillPct = '100%'; tierColor = '#ff2a5f'; nextColor = '#ff2a5f'; }
      
      setTimeout(() => {
        setTData(p => ({
          ...p, nextTier, tierColor, nextColor, bars: { ...p.bars, tier: fillPct },
          tierText: fillPct === '100%' ? 'Highest tier unlocked!' : `${progressPct} completed to next tier`
        }));
      }, 2100);
    }
  }, [telemetryData]);

  const handleGeneratePDF = () => {
    if (!certId) {
      alert("[!] SYSTEM ERROR: No valid identity parameter (?id=) found. Access Denied.");
      return;
    }

    const canvas = document.getElementById('cert-canvas');
    if (!canvas) {
      alert("[!] SYSTEM ERROR: Certificate matrix is not loaded. Please open Identity Viewer first.");
      return;
    }

    try {
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      pdf.save(`OWASP_CRT_Certificate_${certId}.pdf`);
    } catch (err) {
      console.error(err);
      alert("[!] ERROR: Failed to compile PDF sequence.");
    }
  };

  const handleAddToLinkedIn = () => {
    if (!certId) {
      alert("[!] SYSTEM ERROR: Cannot add to LinkedIn without a valid identity.");
      return;
    }

    const tier = (telemetryData?.tier || "Bronze").toUpperCase();
    let certName = "OWASP Verified Contributor";
    if (tier === 'SILVER') certName = "OWASP Advanced Contributor";
    if (tier === 'GOLD') certName = "OWASP Elite Contributor";

    const organizationName = "OWASP® Foundation";
    
    let issueYear = new Date().getFullYear();
    let issueMonth = new Date().getMonth() + 1;

    if (telemetryData?.stats?.first_commit_date) {
      const dateParts = telemetryData.stats.first_commit_date.split('-');
      if (dateParts.length >= 2) {
        issueYear = parseInt(dateParts[0], 10);
        issueMonth = parseInt(dateParts[1], 10);
      }
    } else if (telemetryData?.stats?.first_commit) { 
      issueYear = parseInt(telemetryData.stats.first_commit, 10);
      issueMonth = 1;
    }

    const certUrl = `https://crt.owasp.org/?id=${certId}`;
    const linkedInUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(certName)}&organizationName=${encodeURIComponent(organizationName)}&issueYear=${issueYear}&issueMonth=${issueMonth}&certUrl=${encodeURIComponent(certUrl)}&certId=${encodeURIComponent(certId)}`;
    
    window.open(linkedInUrl, '_blank');
  };

  const handleIconClick = (action) => {
    if (isTouchMode) action();
  };

  const handleIconDoubleClick = (action) => {
    if (!isTouchMode) action();
  };

  return (
    <div id="desktop" className="absolute top-[85px] left-0 w-full h-[calc(100dvh-85px)] z-10 max-md:top-[60px] max-md:h-[calc(100dvh-60px)] overflow-hidden">
      
      {/* Telemetry Bottom Sheet */}
      <div 
        className={`
          z-[100] bg-[#0b0d13]/95 backdrop-blur-xl border border-[rgba(255,255,255,0.06)] font-['Fira_Code',monospace] 
          shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-[max-height] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] 
          flex flex-col overflow-hidden
          
          /* Desktop */
          md:absolute md:right-[20px] md:top-[20px] md:w-[320px] md:rounded-[14px] md:max-h-[calc(100%-40px)]
          
          /* Mobile */
          max-md:fixed max-md:left-0 max-md:bottom-0 max-md:w-full max-md:rounded-t-[24px] max-md:border-x-0 max-md:border-b-0
          ${isMobileExpanded ? 'max-md:max-h-[85dvh]' : 'max-md:max-h-[105px]'}
        `}
      >
        
        {/* Expandable Header */}
        <div 
          className={`shrink-0 transition-colors md:p-[16px] max-md:p-[15px] max-md:pt-[12px] max-md:h-[105px] ${isTouchMode ? 'cursor-pointer hover:bg-white/[0.02] active:bg-white/[0.04]' : ''}`}
          onClick={() => {
            if (isTouchMode || window.innerWidth <= 768) setIsMobileExpanded(!isMobileExpanded);
          }}
        >
          {/* Chevron Indicator */}
          <svg 
            className={`md:hidden w-[40px] h-[12px] mx-auto mb-3 text-white/30 transition-transform duration-500 ${isMobileExpanded ? 'rotate-180' : 'animate-[bounce_2s_infinite]'}`}
            fill="none" viewBox="0 0 24 8" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
          >
            <polyline points="2,7 12,2 22,7" />
          </svg>

          {/* Title Area */}
          <div className="flex justify-between items-center">
            <div className="text-[10px] text-white tracking-[1.5px] font-bold">
              CONTRIBUTOR_TELEMETRY
            </div>
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[8.5px] tracking-wide border ${tData.status === 'CONNECTED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
              {tData.status}
              <div className={`w-1 h-1 rounded-full ${tData.status === 'CONNECTED' ? 'bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse' : 'bg-red-500 shadow-[0_0_6px_#ef4444]'}`}></div>
            </div>
          </div>

          {/* Collapsed State Summary */}
          <div className={`md:hidden flex justify-between items-center transition-all duration-300 mt-2 ${isMobileExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <div className="flex gap-6">
              <div>
                <div className="text-[8px] text-slate-400 mb-0.5">COMMITS</div>
                <div className="text-[14px] text-white font-bold leading-none">{tData.commits}</div>
              </div>
              <div>
                <div className="text-[8px] text-slate-400 mb-0.5">CURRENT TIER</div>
                <div className="text-[14px] font-bold leading-none drop-shadow-md" style={{color: tData.tierColor}}>{tData.currentTier}</div>
              </div>
            </div>
            <div className="text-[9px] text-purple-400 font-bold uppercase tracking-wide pr-1">
              Tap to Expand
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 flex flex-col custom-scrollbar overflow-y-auto px-[16px] pb-[16px] max-md:px-[15px] max-md:pb-[env(safe-area-inset-bottom,15px)]">
          
          <div className="flex gap-2.5 mb-2.5 shrink-0">
            <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-[8px] p-2.5 relative overflow-hidden group hover:bg-white/[0.04] transition-colors">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-[5px] border border-purple-500/30 flex items-center justify-center bg-purple-500/10 shrink-0">
                  <svg className="w-3.5 h-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <div className="text-[7.5px] text-slate-400 mb-0.5 whitespace-nowrap">VERIFIED COMMITS</div>
                  <div className="text-[15px] text-white font-semibold leading-tight">{tData.commits}</div>
                </div>
              </div>
              <div className="flex gap-[2px] h-[3px] mt-2.5 opacity-90">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className={`flex-1 rounded-[1px] transition-colors duration-500 ${i < tData.bars.commits ? 'bg-purple-500 shadow-[0_0_4px_rgba(168,85,247,0.5)]' : 'bg-purple-500/10'}`}></div>
                ))}
              </div>
            </div>

            <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-[8px] p-2.5 relative overflow-hidden group hover:bg-white/[0.04] transition-colors">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-[5px] border border-blue-500/30 flex items-center justify-center bg-blue-500/10 shrink-0">
                  <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                </div>
                <div>
                  <div className="text-[7.5px] text-slate-400 mb-0.5 whitespace-nowrap">PROJECTS INVOLVED</div>
                  <div className="text-[15px] text-white font-semibold leading-tight">{tData.projects}</div>
                </div>
              </div>
              <div className="flex gap-[2px] h-[3px] mt-2.5 opacity-90">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className={`flex-1 rounded-[1px] transition-colors duration-500 ${i < tData.bars.projects ? 'bg-blue-500 shadow-[0_0_4px_rgba(59,130,246,0.5)]' : 'bg-blue-500/10'}`}></div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-[8px] p-2.5 mb-2.5 relative overflow-hidden shrink-0 group hover:bg-white/[0.04] transition-colors">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-[6px] border border-emerald-500/30 flex items-center justify-center bg-emerald-500/10 shrink-0">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                </div>
                <div>
                  <div className="text-[8px] text-emerald-400/80 mb-0.5 font-semibold tracking-wide">LINES ADDED</div>
                  <div className="text-[18px] text-white font-semibold leading-none">{tData.added}</div>
                </div>
              </div>
              <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-[4px] text-emerald-400 text-[8.5px] font-bold">
                {tData.added}
              </div>
            </div>
            <div className="flex items-end gap-[2px] h-[20px] mt-2 px-0.5">
              {[4, 5, 6, 8, 11, 15, 20, 26, 33, 41, 50, 60, 71, 83, 96, 100].map((h, i) => (
                <div 
                  key={i}
                  className="flex-1 bg-emerald-400 rounded-t-[1px] transition-all duration-700 ease-out"
                  style={{ height: h <= tData.bars.added ? `${h}%` : '10%', opacity: h <= tData.bars.added ? (h > 40 ? 1 : 0.3) : 0.1 }}
                ></div>
              ))}
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-[8px] p-2.5 mb-2.5 relative overflow-hidden shrink-0 group hover:bg-white/[0.04] transition-colors">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-[6px] border border-rose-500/30 flex items-center justify-center bg-rose-500/10 shrink-0">
                  <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" /></svg>
                </div>
                <div>
                  <div className="text-[8px] text-rose-400/80 mb-0.5 font-semibold tracking-wide">LINES REMOVED</div>
                  <div className="text-[18px] text-white font-semibold leading-none">{tData.removed}</div>
                </div>
              </div>
              <div className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded-[4px] text-rose-400 text-[8.5px] font-bold">
                {tData.removed}
              </div>
            </div>
            <div className="flex items-start gap-[2px] h-[20px] mt-2 px-0.5">
              {[4, 5, 6, 8, 11, 15, 20, 26, 33, 41, 50, 60, 71, 83, 96, 100].map((h, i) => (
                <div 
                  key={i}
                  className="flex-1 bg-rose-400 rounded-b-[1px] transition-all duration-700 ease-out"
                  style={{ height: h <= tData.bars.removed ? `${h}%` : '10%', opacity: h <= tData.bars.removed ? (h > 40 ? 1 : 0.3) : 0.1 }}
                ></div>
              ))}
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-[8px] p-2.5 mb-4 relative overflow-hidden shrink-0 group hover:bg-white/[0.04] transition-colors">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-6 h-6 rounded-[5px] border border-cyan-500/30 flex items-center justify-center bg-cyan-500/10 shrink-0">
                <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
              </div>
              <div className="text-[8px] text-cyan-400/80 font-semibold tracking-wide">REPOSITORIES</div>
            </div>
            <div className="max-h-[72px] overflow-y-auto pr-1 flex flex-col gap-1 custom-scrollbar" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
              {tData.repositories && tData.repositories.length > 0 ? (
                tData.repositories.map((repo, idx) => (
                  <div key={idx} className="shrink-0 text-[10.5px] text-slate-300 bg-white/[0.03] px-2 py-1.5 rounded-[4px] border border-white/5 truncate hover:text-white hover:bg-white/[0.08] transition-colors cursor-default">
                    {repo}
                  </div>
                ))
              ) : (
                <div className="text-[10px] text-slate-500 italic px-2 py-1">Awaiting data stream...</div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-dashed border-white/10 px-1 shrink-0">
            <div className="flex justify-between items-center mb-3.5">
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-8 h-8 rounded-[6px] border flex items-center justify-center shrink-0 transition-all duration-1000"
                  style={{ borderColor: `${tData.nextColor}40`, backgroundColor: `${tData.nextColor}10`, color: tData.nextColor }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v8l9-11h-7z" /></svg>
                </div>
                <div>
                  <div className="text-[7.5px] text-slate-400 mb-0.5 tracking-wider">NEXT TIER TARGET</div>
                  <div className="text-[16px] font-bold tracking-wide transition-colors duration-1000" style={{color: tData.nextColor}}>
                    {tData.nextTier}
                  </div>
                </div>
              </div>
              <div className="text-[20px] text-white font-bold">
                {tData.bars.tier.replace('%', '')}<span className="text-[11px] text-slate-400 font-medium">%</span>
              </div>
            </div>
            
            <div className="w-full h-[8px] bg-black/60 rounded-full overflow-hidden border border-white/5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]">
              <div 
                className="h-full rounded-full transition-all duration-[2000ms] ease-[cubic-bezier(0.1,0.5,0.2,1)] relative"
                style={{ background: `linear-gradient(90deg, ${tData.tierColor}, ${tData.nextColor})`, width: tData.bars.tier, boxShadow: `0 0 8px ${tData.nextColor}40` }}
              ></div>
            </div>
            
            <div className="text-center text-[9px] text-slate-500 mt-3 font-medium">
              {tData.tierText}
            </div>
          </div>

          {/* Close Panel Button */}
          <button 
            className="md:hidden mt-5 w-full py-3 bg-white/[0.03] border border-white/10 rounded-[8px] text-slate-400 hover:text-white text-[10px] font-bold tracking-widest active:bg-white/10 shrink-0 transition-colors flex items-center justify-center gap-2"
            onClick={(e) => { e.stopPropagation(); setIsMobileExpanded(false); }}
          >
            <span>CLOSE PANEL</span>
          </button>
        </div>
      </div>

      {/* Desktop Icons Container */}
      <div className="flex flex-col gap-[30px] p-[30px] max-md:p-[15px] max-md:pb-[130px] max-md:gap-[15px] max-md:flex-row max-md:flex-wrap">
        
        <div className="relative w-[90px] inline-block">
          <div 
            className="w-full text-center cursor-pointer p-3 rounded-[8px] transition-all duration-200 border border-transparent relative z-10 hover:bg-[rgba(157,78,221,0.15)] hover:border-[rgba(157,78,221,0.3)] group"
            onClick={() => handleIconClick(() => toggleWindow('guide'))}
            onDoubleClick={() => handleIconDoubleClick(() => toggleWindow('guide'))}
          >
            <svg className="w-[42px] h-[42px] mx-auto mb-2.5 stroke-[#9d4edd] stroke-[1.5] fill-none drop-shadow-[0_0_8px_rgba(157,78,221,0.5)] transition-all duration-300 group-hover:stroke-[#ff2a5f] group-hover:drop-shadow-[0_0_12px_rgba(255,42,95,0.7)]" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <span className="text-[11px] text-slate-200 drop-shadow-[0_2px_4px_#000] font-['Fira_Code',monospace] block leading-[1.4]">System_Guide<br />.txt</span>
          </div>
        </div>

        <div className="relative w-[90px] inline-block">
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full p-[15px] rounded-[12px] opacity-0 pointer-events-none z-[1] border-2 border-[#ff2a5f] ${tutorialStep === 1 ? 'animate-[pingRing_1.5s_cubic-bezier(0,0,0.2,1)_infinite] opacity-100' : ''}`}></div>
          <div 
            className="w-full text-center cursor-pointer p-3 rounded-[8px] transition-all duration-200 border border-transparent relative z-10 hover:bg-[rgba(157,78,221,0.15)] hover:border-[rgba(157,78,221,0.3)] group"
            onClick={() => handleIconClick(() => { toggleWindow('letter'); advanceTutorial(2); })}
            onDoubleClick={() => handleIconDoubleClick(() => { toggleWindow('letter'); advanceTutorial(2); })}
          >
            <svg className="w-[42px] h-[42px] mx-auto mb-2.5 stroke-[#9d4edd] stroke-[1.2] fill-none drop-shadow-[0_0_8px_rgba(157,78,221,0.5)] transition-all duration-300 group-hover:stroke-[#ff2a5f] group-hover:drop-shadow-[0_0_12px_rgba(255,42,95,0.7)]" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            <span className="text-[11px] text-slate-200 drop-shadow-[0_2px_4px_#000] font-['Fira_Code',monospace] block leading-[1.4]">Letter_of_<br />Appreciation</span>
          </div>
        </div>

        <div className="relative w-[90px] inline-block">
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full p-[15px] rounded-[12px] opacity-0 pointer-events-none z-[1] border-2 border-[#9d4edd] ${tutorialStep === 2 ? 'animate-[pingRing_1.5s_cubic-bezier(0,0,0.2,1)_infinite] opacity-100' : ''}`}></div>
          <div 
            className="w-full text-center cursor-pointer p-3 rounded-[8px] transition-all duration-200 border border-transparent relative z-10 hover:bg-[rgba(157,78,221,0.15)] hover:border-[rgba(157,78,221,0.3)] group"
            onClick={() => handleIconClick(() => { toggleWindow('tool'); advanceTutorial(3); })}
            onDoubleClick={() => handleIconDoubleClick(() => { toggleWindow('tool'); advanceTutorial(3); })}
          >
            <svg className="w-[42px] h-[42px] mx-auto mb-2.5 stroke-[#9d4edd] stroke-[1.2] fill-none drop-shadow-[0_0_8px_rgba(157,78,221,0.5)] transition-all duration-300 group-hover:stroke-[#ff2a5f] group-hover:drop-shadow-[0_0_12px_rgba(255,42,95,0.7)]" viewBox="0 0 24 24"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
            <span className="text-[11px] text-slate-200 drop-shadow-[0_2px_4px_#000] font-['Fira_Code',monospace] block leading-[1.4]">CRT_Gen.sh</span>
          </div>
        </div>

        <div className="relative w-[90px] inline-block">
          <div 
            className={`w-full text-center cursor-pointer p-3 rounded-[8px] transition-all duration-200 border border-transparent relative z-10 hover:bg-[rgba(157,78,221,0.15)] hover:border-[rgba(157,78,221,0.3)] group ${!certId ? 'opacity-50 grayscale' : ''}`}
            onClick={() => handleIconClick(handleGeneratePDF)}
            onDoubleClick={() => handleIconDoubleClick(handleGeneratePDF)}
            title={!certId ? "Requires valid ?id= parameter" : "Export Certificate to PDF"}
          >
            <svg className={`w-[42px] h-[42px] mx-auto mb-2.5 stroke-[1.2] fill-none transition-all duration-300 ${!certId ? 'stroke-slate-600' : 'stroke-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)] group-hover:stroke-[#ff2a5f] group-hover:drop-shadow-[0_0_12px_rgba(255,42,95,0.7)]'}`} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="12" y1="18" x2="12" y2="12"></line>
              <polyline points="9 15 12 18 15 15"></polyline>
            </svg>
            <span className="text-[11px] text-slate-200 drop-shadow-[0_2px_4px_#000] font-['Fira_Code',monospace] block leading-[1.4]">
              Export_PDF<br />.exe
            </span>
          </div>
        </div>

        <div className="relative w-[90px] inline-block">
          <div 
            className={`w-full text-center cursor-pointer p-3 rounded-[8px] transition-all duration-200 border border-transparent relative z-10 hover:bg-[#0077b5]/15 hover:border-[#0077b5]/30 group ${!certId ? 'opacity-50 grayscale' : ''}`}
            onClick={() => handleIconClick(handleAddToLinkedIn)}
            onDoubleClick={() => handleIconDoubleClick(handleAddToLinkedIn)}
            title={!certId ? "Requires valid ?id= parameter" : "Add this certificate to your LinkedIn profile"}
          >
            <svg className={`w-[42px] h-[42px] mx-auto mb-2.5 stroke-[1.2] fill-none transition-all duration-300 ${!certId ? 'stroke-slate-600' : 'stroke-[#0077b5] drop-shadow-[0_0_8px_rgba(0,119,181,0.5)] group-hover:stroke-[#00a0dc] group-hover:drop-shadow-[0_0_12px_rgba(0,160,220,0.7)]'}`} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
              <rect x="2" y="9" width="4" height="12"></rect>
              <circle cx="4" cy="4" r="2"></circle>
            </svg>
            <span className="text-[11px] text-slate-200 drop-shadow-[0_2px_4px_#000] font-['Fira_Code',monospace] block leading-[1.4]">
              Add_to_<br />LinkedIn
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DesktopIcons;