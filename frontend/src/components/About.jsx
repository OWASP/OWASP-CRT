import React, { useState, useEffect } from 'react';
import { Shield, Github, Heart, Users, ExternalLink, Code2, PenTool, Trophy, Star, Loader2 } from 'lucide-react';
import { APP_CONFIG } from '../config';

const PROJECT_LEADERS_DATA = [
  {
    id: 1,
    name: "Meysam Bal-afkan",
    role: "Project Leader",
    github: "Galaxy-sc",
    icon: Users,
    theme: {
      gradient: "from-indigo-500 to-blue-600",
      iconColor: "text-indigo-400",
      hoverText: "group-hover:text-indigo-300",
      barBg: "bg-indigo-500/50",
      hoverShadow: "hover:shadow-[0_8px_32px_rgba(99,102,241,0.15)]",
      avatarFallbackColor: "818cf8"
    }
  },
  {
    id: 2,
    name: "Fatemeh Zahedi",
    role: "Project Leader",
    github: "dylanzahedi", 
    icon: Users,
    theme: {
      gradient: "from-fuchsia-500 to-pink-600",
      iconColor: "text-fuchsia-400",
      hoverText: "group-hover:text-fuchsia-300",
      barBg: "bg-fuchsia-500/50",
      hoverShadow: "hover:shadow-[0_8px_32px_rgba(217,70,239,0.15)]",
      avatarFallbackColor: "e879f9"
    }
  },
  {
    id: 3,
    name: "Hamidreza Abedi Nasab",
    role: "Design Lead",
    github: "Ham1dRz", 
    icon: PenTool,
    theme: {
      gradient: "from-emerald-400 to-teal-600",
      iconColor: "text-emerald-400",
      hoverText: "group-hover:text-emerald-300",
      barBg: "bg-emerald-500/50",
      hoverShadow: "hover:shadow-[0_8px_32px_rgba(16,185,129,0.15)]",
      avatarFallbackColor: "34d399"
    }
  }
];

const About = () => {
  const [hallOfFameData, setHallOfFameData] = useState([]);
  const [isLoadingHof, setIsLoadingHof] = useState(true);

  useEffect(() => {
    const fetchHallOfFame = async () => {
      try {
        const rawUrl = `https://raw.githubusercontent.com/${APP_CONFIG.github.owner}/${APP_CONFIG.github.repo}/refs/heads/main/hall-of-fame.json?t=${Date.now()}`;
        const response = await fetch(rawUrl);
        
        if (response.ok) {
          const data = await response.json();
          setHallOfFameData(data);
        } else {
          console.warn("Hall of Fame data not found or inaccessible.");
        }
      } catch (error) {
        console.error("Error fetching Hall of Fame data:", error);
      } finally {
        setIsLoadingHof(false);
      }
    };

    fetchHallOfFame();
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto py-12 md:py-20 animate-fade-in relative z-10 px-4">
      
      {/* Header Section */}
      <div className="text-center mb-16 animate-[slideUp_0.5s_ease-out_forwards]">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 text-white drop-shadow-xl">
          About <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-fuchsia-400">OWASP-CRT</span>
        </h1>
        <p className="text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          The Community Recognition Tool (CRT) is an official OWASP project designed to authenticate, quantify, and formally reward open-source security contributions.
        </p>
      </div>

      {/* Mission Glass Card */}
      <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.3)] rounded-3xl p-8 md:p-12 mb-16 animate-[slideUp_0.5s_ease-out_0.2s_forwards] opacity-0 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none group-hover:bg-indigo-500/20 transition-colors duration-700"></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <Heart className="w-6 h-6 text-rose-400" /> Our Mission
          </h2>
          <p className="text-zinc-300 leading-relaxed mb-6">
            Open-source security relies on the relentless effort of thousands of unsung heroes—developers, researchers, and technical writers who architect a safer web. Historically, it has been difficult to officially showcase these vital contributions on professional profiles or resumes.
          </p>
          <p className="text-zinc-300 leading-relaxed">
            <strong>OWASP-CRT</strong> bridges this gap. By utilizing secure GitHub OAuth integration, our system directly verifies your merged pull requests across official OWASP and GenAI security repositories. We then generate a dynamic, tier-based certificate with a unique QR code, providing undeniable proof of your exact impact on the global security ecosystem.
          </p>
        </div>
      </div>

      {/* Project Leaders Section */}
      <div className="text-center mb-10 animate-[slideUp_0.5s_ease-out_0.3s_forwards] opacity-0">
        <h3 className="text-3xl font-bold text-white mb-3">Project Leadership</h3>
        <p className="text-zinc-400 max-w-xl mx-auto">The dedicated team driving the development and design of the OWASP Community Recognition Tool.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24 animate-[slideUp_0.5s_ease-out_0.4s_forwards] opacity-0">
        {PROJECT_LEADERS_DATA.map((leader) => {
          return (
            <div key={leader.id} className={`bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] hover:border-white/[0.15] shadow-xl ${leader.theme.hoverShadow} rounded-3xl p-8 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-2 group`}>
              <a href={`https://github.com/${leader.github}`} target="_blank" rel="noopener noreferrer" className={`w-20 h-20 rounded-full bg-gradient-to-br ${leader.theme.gradient} p-0.5 shadow-lg mb-5 group-hover:scale-110 transition-transform duration-300 block`}>
                <img 
                  src={`https://github.com/${leader.github}.png`} 
                  alt={leader.name} 
                  className="w-full h-full rounded-full object-cover border-[3px] border-[#08080C] bg-[#08080C]"
                  onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(leader.name)}&background=08080C&color=${leader.theme.avatarFallbackColor}`; }}
                />
              </a>
              <h4 className={`text-xl font-bold text-white mb-1 ${leader.theme.hoverText} transition-colors`}>{leader.name}</h4>
              <p className="text-sm text-zinc-400 font-medium mb-4">{leader.role}</p>
              <div className={`w-8 h-1 rounded-full ${leader.theme.barBg} group-hover:w-16 transition-all duration-300`}></div>
            </div>
          );
        })}
      </div>

      {/* Hall of Fame Section */}
      <div className="text-center mb-10 animate-[slideUp_0.5s_ease-out_0.5s_forwards] opacity-0">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/20 mb-6 shadow-[0_0_30px_rgba(234,179,8,0.15)]">
          <Trophy className="w-8 h-8 text-yellow-400" />
        </div>
        <h3 className="text-3xl font-bold text-white mb-3">Hall of Fame</h3>
        <p className="text-zinc-400 max-w-xl mx-auto">Honoring the dedicated developers and security enthusiasts who have contributed to building, improving, and maintaining the OWASP-CRT platform.</p>
      </div>

      {isLoadingHof ? (
        <div className="flex flex-col items-center justify-center py-12 animate-[slideUp_0.5s_ease-out_0.6s_forwards] opacity-0">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-500/70 mb-4" />
          <p className="text-sm text-zinc-500 font-medium tracking-wide uppercase">Syncing Hall of Fame...</p>
        </div>
      ) : hallOfFameData.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16 animate-[slideUp_0.5s_ease-out_0.6s_forwards] opacity-0">
          {hallOfFameData.map((user) => {
            const displayName = (!user.name || user.name.toLowerCase() === 'null') ? user.github : user.name;

            return (
              <div key={user.id} className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] hover:border-white/[0.12] shadow-lg rounded-2xl p-5 flex items-center gap-5 transition-all duration-300 hover:bg-white/[0.04] group">
                <div className="relative">
                  <img 
                    src={`https://github.com/${user.github}.png`} 
                    alt={displayName} 
                    className="w-14 h-14 rounded-full object-cover border border-white/10 bg-[#08080C]"
                    onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=1a1a2e&color=fff`; }}
                  />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#08080C] bg-yellow-500/10 border-yellow-500/30">
                    <Star className="w-3 h-3 text-yellow-400" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-bold text-white truncate group-hover:text-yellow-400/90 transition-colors">{displayName}</h4>
                  <a href={`https://github.com/${user.github}`} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1 mt-0.5">
                    <Github className="w-3 h-3" /> @{user.github}
                  </a>
                </div>
                
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10 mb-16 animate-[slideUp_0.5s_ease-out_0.6s_forwards] opacity-0 bg-white/[0.01] border border-white/[0.05] rounded-2xl">
          <p className="text-zinc-500 text-sm">No Hall of Fame records found at the moment.</p>
        </div>
      )}

      {/* Open Source Call to Action */}
      <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] shadow-lg rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 animate-[slideUp_0.5s_ease-out_0.7s_forwards] opacity-0 hover:border-white/[0.1] transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/[0.05] flex items-center justify-center border border-white/[0.1]">
            <Code2 className="w-6 h-6 text-zinc-300" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Fully Open Source</h3>
            <p className="text-sm text-zinc-400">The entire generation matrix is public and auditable.</p>
          </div>
        </div>
        <a 
          href={`https://github.com/${APP_CONFIG.github.owner}/${APP_CONFIG.github.repo}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all flex items-center gap-2 border border-white/10 hover:border-white/30 whitespace-nowrap shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
        >
          <Github className="w-5 h-5" /> View on GitHub <ExternalLink className="w-4 h-4 ml-1 opacity-70" />
        </a>
      </div>

    </div>
  );
};

export default About;