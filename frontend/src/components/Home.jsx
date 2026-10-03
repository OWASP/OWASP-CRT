import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Github, ShieldCheck, Zap, X, Maximize } from 'lucide-react';
import { APP_CONFIG } from '../config';

const LiquidBackground = () => {
  const blob1 = useRef(null);
  const blob2 = useRef(null);
  const blob3 = useRef(null);

  useEffect(() => {
    let frame = 0;
    let animationFrameId;

    const animate = () => {
      frame += 0.015; 
      
      const dist1 = 18 + Math.sin(frame) * 5; 
      const dist2 = 18 + Math.sin(frame + 2) * 5; 
      const dist3 = 18 + Math.sin(frame + 4) * 5; 

      if (blob1.current) {
        blob1.current.style.transform = `translate(calc(-50% - ${dist1}vw), calc(-50% - ${dist1}vw)) scale(${1 + Math.sin(frame) * 0.1})`;
      }
      if (blob2.current) {
        blob2.current.style.transform = `translate(calc(-50% + ${dist2}vw), calc(-50% - ${dist2}vw)) scale(${1 + Math.cos(frame) * 0.1})`;
      }
      if (blob3.current) {
        blob3.current.style.transform = `translate(-50%, calc(-50% + ${dist3}vw)) scale(${1 + Math.sin(frame + 1) * 0.1})`;
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none -z-20 bg-[#05050A]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_#05050A_100%)] z-10 opacity-80"></div>
      
      <div ref={blob1} className="absolute top-1/2 left-1/2 w-[45vw] h-[45vw] bg-indigo-500 rounded-full blur-[120px] mix-blend-screen opacity-20"></div>
      <div ref={blob2} className="absolute top-1/2 left-1/2 w-[45vw] h-[45vw] bg-fuchsia-500 rounded-full blur-[120px] mix-blend-screen opacity-20"></div>
      <div ref={blob3} className="absolute top-1/2 left-1/2 w-[45vw] h-[45vw] bg-blue-500 rounded-full blur-[120px] mix-blend-screen opacity-20"></div>
    </div>
  );
};

const Home = ({ setCurrentView }) => {
  const [selectedCert, setSelectedCert] = useState(null);

  return (
    <div className="flex flex-col items-center w-full max-w-6xl mx-auto pb-24 relative">
      
      <LiquidBackground />

      <section className="flex flex-col items-center text-center pt-12 md:pt-20 min-h-[60vh] justify-center relative z-10">

        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 opacity-0 animate-[slideUp_0.5s_ease-out_0.2s_forwards] leading-tight text-white drop-shadow-2xl">
          Recognizing the <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-fuchsia-300">
            Builders of Security
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-12 leading-relaxed opacity-0 animate-[slideUp_0.5s_ease-out_0.3s_forwards]">
          Join the elite network of developers and security researchers securing the open web. Verify your GitHub contributions and claim your officially signed OWASP certificate.
        </p>
        
        <div className="flex flex-wrap justify-center gap-4 opacity-0 animate-[slideUp_0.5s_ease-out_0.4s_forwards]">
          <button 
            onClick={() => setCurrentView('Verify')} 
            className="px-8 py-4 rounded-full bg-white text-black font-bold hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all duration-300 flex items-center gap-2 group shadow-xl"
          >
            Claim Your Certificate 
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      <section className="w-full mt-16 md:mt-24 mb-10 opacity-0 animate-[slideUp_0.5s_ease-out_0.5s_forwards] z-10">
        <div className="text-center mb-24">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight drop-shadow-lg">Contribution Tiers</h2>
          <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
            Your impact on OWASP projects determines your credential tier. Unlock exclusive visual themes and global recognition.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 px-4">
          <LiquidTierCard 
            title="Verified Contributor"
            tierName="BRONZE"
            image="tier-1.webp"
            gradient="from-[#ff0044] to-[#ff3396]"
            description="Awarded for your first merged contributions. Marks your official entry into the global ecosystem."
            onClick={() => setSelectedCert('tier-1.webp')}
          />
          
          <LiquidTierCard 
            title="Advanced Contributor"
            tierName="SILVER"
            image="tier-2.webp"
            gradient="from-[#3fbbfe] to-[#4157ff]"
            description="Recognizes sustained contributions and profound expertise. A vital pillar of our projects."
            delay="delay-100"
            onClick={() => setSelectedCert('tier-2.webp')}
          />

          <LiquidTierCard 
            title="Elite Contributor"
            tierName="GOLD"
            image="tier-3.webp"
            gradient="from-[#ff46f0] to-[#711bff]"
            description="The pinnacle of recognition. Honors your ultimate standing as a pioneer shaping global standards."
            delay="delay-200"
            onClick={() => setSelectedCert('tier-3.webp')}
          />
        </div>
      </section>

      <section className="w-full mt-32 md:mt-40 opacity-0 animate-[slideUp_0.5s_ease-out_0.7s_forwards] z-10 relative">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4 drop-shadow-lg">How It Works</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-y-1/2 -z-10"></div>
          
          <GlassStepCard 
            icon={Github} 
            title="1. Connect GitHub" 
            description="Securely authenticate to let our matrix analyze your public and private contributions."
          />
          <GlassStepCard 
            icon={ShieldCheck} 
            title="2. Verify Identity" 
            description="Our system cross-references your merged PRs against official OWASP repositories."
          />
          <GlassStepCard 
            icon={Zap} 
            title="3. Generate Certificate" 
            description="Instantly receive a cryptographically signed, tiered certificate based on your impact."
          />
        </div>
      </section>

      {selectedCert && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#05050A]/90 backdrop-blur-2xl animate-fade-in"
          onClick={() => setSelectedCert(null)}
        >
          <div 
            className="relative max-w-3xl w-full flex justify-center items-center animate-[slideUp_0.4s_cubic-bezier(0.16,1,0.3,1)_forwards] scale-95 origin-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className="absolute -top-16 right-0 md:-right-12 text-white/50 hover:text-white bg-white/[0.05] hover:bg-white/[0.15] border border-white/10 rounded-full p-3 backdrop-blur-xl transition-all duration-300 hover:scale-110 hover:rotate-90 shadow-xl"
              onClick={() => setSelectedCert(null)}
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="relative group">
              <div className="absolute inset-0 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none -z-10 group-hover:bg-indigo-500/20 transition-colors duration-1000"></div>
              <img 
                src={`${APP_CONFIG.assetsPath}/${selectedCert}`} 
                alt="Certificate High Resolution" 
                className="max-h-[85vh] w-auto object-contain rounded-2xl shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/[0.1]"
              />
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

const LiquidTierCard = ({ title, tierName, image, gradient, description, delay = "", onClick }) => (
  <div className={`relative group flex flex-col items-center ${delay}`}>
    
    <div className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-br ${gradient} blur-[80px] opacity-[0.12] group-hover:opacity-25 transition-opacity duration-1000 rounded-full pointer-events-none`}></div>

    <div 
      className="relative z-10 w-full max-w-[280px] aspect-[1/1.414] mb-8 transition-all duration-700 cubic-bezier(0.175, 0.885, 0.32, 1.275) transform group-hover:-translate-y-8 group-hover:scale-[1.08] group-hover:rotate-[3deg] cursor-pointer"
      onClick={onClick}
    >
      <img 
        src={`${APP_CONFIG.assetsPath}/${image}`} 
        alt={`${tierName} Certificate`} 
        className="w-full h-full object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.8)] rounded-xl border border-white/10 group-hover:border-white/30 transition-colors duration-500"
      />
      
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-xl"></div>
      
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="flex items-center gap-2 px-5 py-2.5 bg-black/50 hover:bg-black/70 backdrop-blur-md text-white/90 text-sm font-bold rounded-full border border-white/[0.2] hover:border-white/[0.4] opacity-0 group-hover:opacity-100 transition-all duration-300 delay-75 shadow-2xl tracking-wide uppercase hover:scale-105">
          <Maximize className="w-4 h-4" /> Enlarge
        </span>
      </div>
    </div>

    <div className="w-full p-6 pt-12 -mt-24 rounded-[2rem] relative z-0 border border-white/[0.08] group-hover:border-white/[0.15] transition-colors text-center flex flex-col items-center shadow-2xl bg-white/[0.02] backdrop-blur-2xl">
      <div className={`inline-block px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-xs font-extrabold tracking-widest uppercase mb-4 text-transparent bg-clip-text bg-gradient-to-r ${gradient}`}>
        {tierName} TIER
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-zinc-400 text-sm leading-relaxed">{description}</p>
    </div>
  </div>
);

const GlassStepCard = ({ icon: Icon, title, description }) => (
  <div className="p-8 rounded-3xl flex flex-col items-center text-center transition-transform hover:-translate-y-2 duration-500 bg-white/[0.02] backdrop-blur-2xl border border-white/[0.05] hover:border-white/[0.12] shadow-2xl">
    <div className="w-14 h-14 rounded-full bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mb-6 shadow-inner shadow-white/5">
      <Icon className="w-6 h-6 text-indigo-400/80" />
    </div>
    <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
    <p className="text-zinc-400 text-sm leading-relaxed">{description}</p>
  </div>
);

export default Home;