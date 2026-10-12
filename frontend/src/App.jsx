import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Verify from './components/Verify';
import CertificateView from './components/CertificateView';
import About from './components/About';
import NotFound from './components/NotFound';

const LiquidGlobalBackground = () => {
  const blob1 = useRef(null);
  const blob2 = useRef(null);
  const blob3 = useRef(null);

  useEffect(() => {
    let frame = 0;
    let animationFrameId;

    const animate = () => {
      frame += 0.012; 
      
      const dist1 = 18 + Math.sin(frame) * 5; 
      const dist2 = 18 + Math.sin(frame + 2) * 5; 
      const dist3 = 18 + Math.sin(frame + 4) * 5; 

      if (blob1.current) {
        blob1.current.style.transform = `translate(calc(-50% - ${dist1}vw), calc(-50% - ${dist1}vw)) scale(${1 + Math.sin(frame) * 0.05})`;
        blob1.current.style.opacity = 0.11 + Math.sin(frame * 1.5) * 0.03;
      }
      if (blob2.current) {
        blob2.current.style.transform = `translate(calc(-50% + ${dist2}vw), calc(-50% - ${dist2}vw)) scale(${1 + Math.cos(frame) * 0.05})`;
        blob2.current.style.opacity = 0.11 + Math.cos(frame * 1.2) * 0.03;
      }
      if (blob3.current) {
        blob3.current.style.transform = `translate(-50%, calc(-50% + ${dist3}vw)) scale(${1 + Math.sin(frame + 1) * 0.05})`;
        blob3.current.style.opacity = 0.11 + Math.sin(frame * 1.8) * 0.03;
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0 bg-[#08080C]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(79,70,229,0.06)_0%,_transparent_70%)] z-0"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_#08080C_100%)] z-20 opacity-90"></div>
      
      <div 
        ref={blob1} 
        style={{ opacity: 0.11, transform: 'translate(calc(-50% - 18vw), calc(-50% - 18vw)) scale(1)' }} 
        className="absolute top-1/2 left-1/2 w-[45vw] h-[45vw] bg-indigo-500 rounded-full blur-[130px] mix-blend-screen z-10"
      ></div>
      
      <div 
        ref={blob2} 
        style={{ opacity: 0.11, transform: 'translate(calc(-50% + 18vw), calc(-50% - 18vw)) scale(1)' }} 
        className="absolute top-1/2 left-1/2 w-[45vw] h-[45vw] bg-fuchsia-500 rounded-full blur-[130px] mix-blend-screen z-10"
      ></div>
      
      <div 
        ref={blob3} 
        style={{ opacity: 0.11, transform: 'translate(-50%, calc(-50% + 18vw)) scale(1)' }} 
        className="absolute top-1/2 left-1/2 w-[45vw] h-[45vw] bg-blue-500 rounded-full blur-[130px] mix-blend-screen z-10"
      ></div>
    </div>
  );
};

const App = () => {
  const [currentView, setCurrentView] = useState('home');
  const [certId, setCertId] = useState(null);
  const [telemetryData, setTelemetryData] = useState(null);

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

  useEffect(() => {
    const handleNavigation = () => {
      const params = new URLSearchParams(window.location.search);
      const path = window.location.pathname;
      
      const id = params.get('id');
      const status = params.get('status');

      if (id) {
        setCertId(id);
        setCurrentView('certificate');
      } else if (status === 'success' || status === 'error') {
        setCurrentView('verify');
      } else {
        const currentRoute = path.replace(basePath, '').replace(/^\/|\/$/g, '');

        if (['verify', 'about'].includes(currentRoute)) {
          setCurrentView(currentRoute);
        } else if (currentRoute === '') {
          setCurrentView('home');
        } else {
          setCurrentView('404');
        }
      }
    };

    handleNavigation();

    window.addEventListener('popstate', handleNavigation);
    return () => window.removeEventListener('popstate', handleNavigation);
  }, [basePath]);

  const handleSetView = (view) => {
    setCurrentView(view);
    
    const newUrl = view === 'home' ? `${basePath}/` : `${basePath}/${view}`;
    window.history.pushState(null, '', newUrl);
  };

  return (
    <div className="min-h-[100dvh] w-full relative bg-transparent text-white font-sans flex flex-col">
      
      <LiquidGlobalBackground />

      <div className="relative z-10 flex flex-col min-h-[100dvh]">
        <Navbar currentView={currentView} setCurrentView={handleSetView} />
        
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12 flex flex-col overflow-hidden">
          {currentView === 'home' && <Home setCurrentView={handleSetView} />}
          {currentView === 'verify' && <Verify setCurrentView={handleSetView} />}
          {currentView === 'certificate' && <CertificateView certId={certId} setTelemetryData={setTelemetryData} />}
          {currentView === 'about' && <About />}
          {currentView === '404' && <NotFound setCurrentView={handleSetView} />}
        </main>
        
        <footer className="py-6 text-center text-xs text-zinc-500 border-t border-white/[0.05] mt-auto backdrop-blur-md">
          &copy; {new Date().getFullYear()} OWASP Foundation. Open Source Security.
        </footer>
      </div>
    </div>
  );
};

export default App;