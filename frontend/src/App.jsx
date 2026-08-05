import React, { useState, useEffect } from 'react';
import Taskbar from './components/Taskbar';
import DesktopIcons from './components/DesktopIcons';
import OSWindow from './components/OSWindow';
import SystemGuide from './components/apps/SystemGuide';
import LetterOfAppreciation from './components/apps/LetterOfAppreciation';
import TerminalEngine from './components/apps/TerminalEngine';
import CertificateViewer from './components/apps/CertificateViewer';
import './index.css';

const App = () => {
  const [highestZ, setHighestZ] = useState(100);
  const [overviewMode, setOverviewMode] = useState(false);
  const [certTargetId, setCertTargetId] = useState(null);
  const [tutorialStep, setTutorialStep] = useState(1);
  const [telemetryData, setTelemetryData] = useState(null);
  const [openedOnce, setOpenedOnce] = useState({ letter: false, tool: false });
  const [windows, setWindows] = useState({
    guide: { isOpen: false, isActive: false, isMaximized: false, zIndex: 100, title: 'cat ~/docs/System_Guide.txt', top: '15%', left: '30%', width: '550px', height: '400px' },
    letter: { isOpen: false, isActive: false, isMaximized: false, zIndex: 100, title: 'vi ~/desktop/Letter_of_Appreciation.txt', top: '25%', left: '20%', width: '550px', height: '350px' },
    tool: { isOpen: false, isActive: false, isMaximized: false, zIndex: 100, title: 'root@owasp-crt: ~', top: '20%', left: '35%', width: '550px', height: '350px' },
    cert: { isOpen: false, isActive: false, isMaximized: false, zIndex: 100, title: 'OWASP_CRT_Certificate.exe', top: '15%', left: '15%', width: '900px', height: '75vh' }
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const status = params.get('status');

    if (id) {
      setCertTargetId(id);
      setTutorialStep(0);
      setWindows(prev => {
        const newState = { ...prev };
        Object.keys(newState).forEach(key => newState[key].isActive = false);
        newState.cert = { ...newState.cert, isOpen: true, isActive: true, isMaximized: true, zIndex: 1000 };
        return newState;
      });
      setHighestZ(1000);
    } else if (status === 'success' || status === 'error') {
      setTimeout(() => { toggleWindow('tool', true); }, 100);
    } else {
      setTimeout(() => { toggleWindow('guide', true); }, 100);
    }
  }, []);

  const focusWindow = (id) => {
    if (overviewMode) setOverviewMode(false);
    setHighestZ(prev => prev + 1);
    setWindows(prev => {
      const newState = { ...prev };
      Object.keys(newState).forEach(key => newState[key].isActive = false);
      newState[id].isActive = true;
      newState[id].zIndex = highestZ + 1;
      return newState;
    });
  };

  const closeWindow = (id) => {
    setWindows(prev => {
      const newState = { ...prev, [id]: { ...prev[id], isOpen: false, isActive: false } };
      let maxZ = 0; let nextWin = null;
      Object.keys(newState).forEach(key => {
        if (newState[key].isOpen && newState[key].zIndex > maxZ) {
          maxZ = newState[key].zIndex; nextWin = key;
        }
      });
      if (nextWin) newState[nextWin].isActive = true;
      return newState;
    });
  };

  const toggleWindow = (id, forceOpen = false) => {
    if (overviewMode) setOverviewMode(false);
    if (id === 'letter' && !openedOnce.letter) setOpenedOnce(p => ({ ...p, letter: true }));
    if (id === 'tool' && !openedOnce.tool) setOpenedOnce(p => ({ ...p, tool: true }));
    
    setWindows(prev => {
      const isCurrentlyOpen = prev[id].isOpen;
      const shouldOpen = forceOpen || !isCurrentlyOpen || !prev[id].isActive;
      
      if (!shouldOpen && isCurrentlyOpen && prev[id].isActive) {
         const newState = { ...prev, [id]: { ...prev[id], isOpen: false, isActive: false } };
         let maxZ = 0; let nextWin = null;
         Object.keys(newState).forEach(key => {
           if (newState[key].isOpen && newState[key].zIndex > maxZ) {
             maxZ = newState[key].zIndex; nextWin = key;
           }
         });
         if (nextWin) newState[nextWin].isActive = true;
         return newState;
      }
      
      const newZ = highestZ + 1;
      setHighestZ(newZ);
      const newState = { ...prev };
      Object.keys(newState).forEach(key => newState[key].isActive = false);
      newState[id] = { ...prev[id], isOpen: true, isActive: true, zIndex: newZ };
      return newState;
    });
  };

  const toggleMaximize = (id) => {
    setWindows(prev => ({ ...prev, [id]: { ...prev[id], isMaximized: !prev[id].isMaximized } }));
  };

  const advanceTutorial = (step) => {
    if (step === 2 && tutorialStep === 1) {
      setTutorialStep(1.5);
      setTimeout(() => setTutorialStep(2), 2000);
    } else if (step === 3 && tutorialStep === 2) {
      setTutorialStep(3);
    }
  };

  return (
    <div className="w-screen h-screen relative overflow-hidden bg-[#050608]">
      <div className="absolute inset-0 z-0 bg-[#050608] overflow-hidden">
        <div className="absolute top-[-30%] left-[-10%] w-[60vw] h-[60vw] bg-[radial-gradient(circle,rgba(157,78,221,0.12)_0%,transparent_60%)] rounded-full [animation:floatOrb_12s_infinite_alternate_ease-in-out]"></div>
        <div className="absolute bottom-[-30%] right-[-10%] w-[70vw] h-[70vw] bg-[radial-gradient(circle,rgba(74,123,254,0.08)_0%,transparent_60%)] rounded-full [animation:floatOrb_15s_infinite_alternate-reverse_ease-in-out]"></div>
        <div className="absolute inset-0 z-[1] bg-[url('data:image/svg+xml;utf8,%3Csvg_viewBox=%220_0_200_200%22_xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter_id=%22noise%22%3E%3CfeTurbulence_type=%22fractalNoise%22_baseFrequency=%220.8%22_numOctaves=%223%22_stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect_width=%22100%25%22_height=%22100%25%22_filter=%22url(%23noise)%22_opacity=%220.03%22/%3E%3C/svg%3E')] pointer-events-none"></div>
      </div>

      <Taskbar windows={windows} toggleWindow={toggleWindow} overviewMode={overviewMode} toggleOverview={() => setOverviewMode(!overviewMode)} />

      <DesktopIcons 
        toggleWindow={toggleWindow} 
        tutorialStep={tutorialStep} 
        advanceTutorial={advanceTutorial} 
        telemetryData={telemetryData} 
        certId={certTargetId} 
      />

      <div id="window-manager" className={`absolute inset-0 z-[10000] pointer-events-none ${overviewMode ? 'overview-mode' : ''}`} onClick={(e) => { if (e.target.id === 'window-manager') setOverviewMode(false); }}>
        
        <OSWindow id="guide-win" {...windows.guide} onClose={() => closeWindow('guide')} onMinimize={() => toggleWindow('guide')} onMaximize={() => toggleMaximize('guide')} onFocus={() => focusWindow('guide')}>
          <SystemGuide />
        </OSWindow>

        <OSWindow id="letter-win" {...windows.letter} onClose={() => closeWindow('letter')} onMinimize={() => toggleWindow('letter')} onMaximize={() => toggleMaximize('letter')} onFocus={() => focusWindow('letter')}>
          <LetterOfAppreciation startTyping={openedOnce.letter} />
        </OSWindow>

        <OSWindow id="tool-win" {...windows.tool} onClose={() => closeWindow('tool')} onMinimize={() => toggleWindow('tool')} onMaximize={() => toggleMaximize('tool')} onFocus={() => focusWindow('tool')}>
          <TerminalEngine startFlow={openedOnce.tool} />
        </OSWindow>

        <OSWindow id="cert-win" {...windows.cert} onClose={() => closeWindow('cert')} onMinimize={() => toggleWindow('cert')} onMaximize={() => toggleMaximize('cert')} onFocus={() => focusWindow('cert')}>
          <CertificateViewer certId={certTargetId} isMaximized={windows.cert.isMaximized} setTelemetryData={setTelemetryData} />
        </OSWindow>

      </div>
    </div>
  );
};

export default App;