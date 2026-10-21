import React, { useEffect, useRef, useState } from 'react';
import { Download, Linkedin, Loader2, GitCommit, FolderGit2, FilePlus, Award, CheckCircle2, X, Maximize, Target, Github, ShieldAlert, Copy, Share2, Image as ImageIcon, Home } from 'lucide-react';
import StatCard from './StatCard';
import { useCertificateData } from '../hooks/useCertificateData';
import { renderCertificateToCanvas } from '../utils/certificateRenderer';
import { APP_CONFIG } from '../config';

const CertificateView = ({ certId, setCurrentView }) => {
  const canvasRef = useRef(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isEnlarged, setIsEnlarged] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const { certUser, error } = useCertificateData(certId);

  useEffect(() => {
    setPreviewImage(null);
    if (certUser && !error && canvasRef.current) {
      const cleanup = renderCertificateToCanvas(canvasRef.current, certUser, setPreviewImage);
      return cleanup;
    }
  }, [certUser, error]);

  useEffect(() => {
    if (!isEnlarged) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsEnlarged(false);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEnlarged]);

  const handleGeneratePDF = async () => {
    if (!canvasRef.current || isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
      const imgData = canvasRef.current.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'SLOW');
      pdf.save(`OWASP_CRT_Certificate_${certId}.pdf`);
    } catch (err) {
      console.error("Failed to export PDF:", err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadImage = () => {
    if (!previewImage) return;
    const link = document.createElement('a');
    link.href = previewImage;
    link.download = `OWASP_CRT_Certificate_${certId}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddToLinkedIn = () => {
    if (!certUser) return;
    const tier = (certUser.tier || "Bronze").toUpperCase();
    let certName = "OWASP Verified Contributor";
    if (tier === 'SILVER') certName = "OWASP Advanced Contributor";
    if (tier === 'GOLD') certName = "OWASP Elite Contributor";

    let issueYear = new Date().getFullYear();
    let issueMonth = new Date().getMonth() + 1;

    if (certUser.stats?.first_commit_date) {
      const dateParts = certUser.stats.first_commit_date.split('-');
      if (dateParts.length >= 2) {
        issueYear = parseInt(dateParts[0], 10);
        issueMonth = parseInt(dateParts[1], 10);
      }
    }

    const certUrl = `${APP_CONFIG.domain}/?id=${certId}`;
    const linkedInUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(certName)}&organizationName=OWASP%20Foundation&issueYear=${issueYear}&issueMonth=${issueMonth}&certUrl=${encodeURIComponent(certUrl)}&certId=${encodeURIComponent(`CRT-OWASP-${certId}`)}`;
    window.open(linkedInUrl, "_blank", "noopener,noreferrer");
  };

  const handleShareOnX = () => {
    if (!certUser) return;
    const tier = (certUser.tier || "Bronze").toUpperCase();
    const certUrl = `${APP_CONFIG.domain}/?id=${certId}`;
    const text = `Proud to be recognized as an Official @owasp ${tier} Contributor! Check out my verified open-source security credential:`;
    const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(certUrl)}`;
    window.open(xUrl, "_blank", "noopener,noreferrer");
  };

  const handleCopyLink = async () => {
    const certUrl = `${APP_CONFIG.domain}/?id=${certId}`;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(certUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = certUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 bg-red-500/10 border border-red-500/20 rounded-3xl max-w-lg mx-auto mt-20 backdrop-blur-md animate-fade-in">
        <ShieldAlert className="w-16 h-16 text-rose-400 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Certificate Not Found</h2>
        <p className="text-zinc-400 leading-relaxed text-sm mb-6">
          We couldn't verify a record for this URL. The link appears to be incomplete or invalid. 
          If you are reviewing a credential, please request the exact link from the candidate.
        </p>
        {setCurrentView && (
          <button
            onClick={() => setCurrentView('home')}
            className="px-6 py-3 rounded-xl bg-white/90 hover:bg-white text-black font-bold text-sm flex items-center gap-2 transition-all"
          >
            <Home className="w-4 h-4" /> Return to Overview
          </button>
        )}
      </div>
    );
  }

  const stats = certUser?.stats || {};
  const currentTier = (certUser?.tier || "BRONZE").toUpperCase();
  let tierColor = "text-indigo-400", tierBg = "bg-indigo-500/10", tierBorder = "border-indigo-500/20";
  if (currentTier === "SILVER") { tierColor = "text-blue-400"; tierBg = "bg-blue-500/10"; tierBorder = "border-blue-500/20"; }
  else if (currentTier === "GOLD") { tierColor = "text-pink-400"; tierBg = "bg-pink-500/10"; tierBorder = "border-pink-500/20"; }

  const commits = parseInt(stats.merged_commits || '0', 10);
  let progress = 0;
  if (currentTier === "BRONZE") { progress = Math.min((commits / 10) * 100, 100); } 
  else if (currentTier === "SILVER") { progress = Math.min((commits / 50) * 100, 100); } 
  else { progress = 100; }

  return (
    <div className="w-full max-w-7xl mx-auto animate-fade-in pt-4 pb-8 md:pt-6 md:pb-12 relative">
      
      <div style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', opacity: 0.01, pointerEvents: 'none', zIndex: -1 }}>
        <span style={{ fontFamily: 'Anton', fontWeight: 400 }}>Preload</span>
        <span style={{ fontFamily: 'Inter', fontWeight: 200 }}>Preload</span>
        <span style={{ fontFamily: 'Inter', fontWeight: 300 }}>Preload</span>
        <span style={{ fontFamily: 'Inter', fontWeight: 400 }}>Preload</span>
        <span style={{ fontFamily: 'Inter', fontStyle: 'italic', fontWeight: 400 }}>Preload</span>
        <span style={{ fontFamily: 'Montserrat', fontWeight: 700 }}>Preload</span>
        <span style={{ fontFamily: 'Cascadia Code', fontWeight: 400 }}>Preload</span>
        <span style={{ fontFamily: 'Cascadia Mono', fontWeight: 700 }}>Preload</span>
      </div>

      <div className="w-full flex flex-col-reverse lg:flex-row gap-12 lg:gap-16 items-start relative">
        
        <div className="w-full lg:w-5/12 flex flex-col gap-4 lg:gap-5 relative z-10">
          <div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 sm:mb-3 lg:mb-4 tracking-tight leading-tight drop-shadow-md">Your Official<br className="hidden lg:block"/> Credential</h2>
            <p className="text-zinc-400 text-sm sm:text-base lg:text-lg leading-relaxed max-w-md">Officially recognized across the OWASP global ecosystem.</p>
          </div>

          {certUser && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3 lg:gap-4 animate-[slideUp_0.5s_ease-out_0.2s_forwards] opacity-0">
                <StatCard title="Commits" value={stats.merged_commits || '0'} icon={GitCommit} color="text-purple-400" bg="bg-purple-500/10" border="border-purple-500/20" />
                <StatCard title="Projects" value={stats.project_count || '0'} icon={FolderGit2} color="text-blue-400" bg="bg-blue-500/10" border="border-blue-500/20" />
                <StatCard title="Lines Added" value={`+${stats.lines_added || '0'}`} icon={FilePlus} color="text-emerald-400" bg="bg-emerald-500/10" border="border-emerald-500/20" />
                <StatCard title="Tier" value={currentTier} icon={Award} color={tierColor} bg={tierBg} border={tierBorder} />
              </div>

              {stats.repositories && stats.repositories.length > 0 && (
                <div className="animate-[slideUp_0.5s_ease-out_0.3s_forwards] opacity-0 mt-2">
                  <h3 className="text-zinc-500 text-[11px] font-bold tracking-widest uppercase mb-3 px-1">Contributed Projects</h3>
                  <div className="flex flex-wrap gap-2">
                    {stats.repositories.map(repo => (
                      <a
                        key={repo}
                        href={`https://github.com/OWASP/${repo}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-xs font-semibold text-white/80 shadow-[0_4px_12px_rgba(0,0,0,0.1)] flex items-center gap-1.5 hover:bg-white/[0.08] hover:text-white transition-colors"
                      >
                        <Github className="w-3.5 h-3.5 text-zinc-400" /> {repo}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.3)] rounded-2xl p-5 animate-[slideUp_0.5s_ease-out_0.4s_forwards] opacity-0 mt-1">
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <span className="text-zinc-400 text-[11px] font-bold tracking-widest uppercase mb-1 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5" /> Level Progress
                    </span>
                  </div>
                  <span className="text-xl font-bold drop-shadow-md">{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-2.5 bg-black/50 rounded-full overflow-hidden border border-white/[0.05] shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 rounded-full relative transition-all duration-1000 ease-out" 
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.3)] rounded-2xl p-4 sm:p-5 flex flex-col gap-3 sm:gap-4 animate-[slideUp_0.5s_ease-out_0.5s_forwards] opacity-0 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-[10px] sm:text-[11px] font-bold tracking-widest uppercase flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5" /> Share & Export
              </span>
            </div>

            <div className="flex items-center justify-between p-1 sm:p-1.5 rounded-xl bg-black/40 border border-white/[0.08] shadow-inner w-full">
              <div className="flex-1 min-w-0 truncate px-2 sm:px-3 text-zinc-400 text-xs sm:text-sm font-mono select-all">
                {APP_CONFIG.domain}/?id={certId}
              </div>
              <button 
                onClick={handleCopyLink}
                className={`shrink-0 py-1.5 px-3 sm:py-2 sm:px-4 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isCopied 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/5 shadow-sm hover:shadow-md'
                }`}
              >
                {isCopied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              <button
                onClick={handleGeneratePDF}
                disabled={!previewImage || isExportingPdf}
                className="py-2.5 sm:py-3 px-4 rounded-xl bg-white/90 text-black text-xs sm:text-sm font-bold hover:bg-white transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:-translate-y-0.5 disabled:opacity-50"
              >
                {isExportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>Export PDF</span>
              </button>

              <button
                onClick={handleDownloadImage}
                disabled={!previewImage}
                className="py-2.5 sm:py-3 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-white text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 disabled:opacity-50"
              >
                <ImageIcon className="w-4 h-4" />
                <span>Save Image</span>
              </button>

              <button
                onClick={handleAddToLinkedIn}
                disabled={!certUser}
                className="py-2.5 sm:py-3 px-4 rounded-xl bg-[#0077b5]/20 hover:bg-[#0077b5]/30 border border-[#0077b5]/40 text-[#00a0dc] text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 shadow-sm disabled:opacity-50"
              >
                <Linkedin className="w-4 h-4" /> LinkedIn
              </button>

              <button
                onClick={handleShareOnX}
                disabled={!certUser}
                className="py-2.5 sm:py-3 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-zinc-200 text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 shadow-sm disabled:opacity-50"
              >
                <Share2 className="w-4 h-4" /> Post on X
              </button>
            </div>
          </div>
          
        </div>

        <div className="w-full lg:w-7/12 flex items-start justify-center relative z-10 animate-[slideUp_0.5s_ease-out_0.1s_forwards] opacity-0 lg:pt-2">
          <canvas ref={canvasRef} id="cert-canvas" className="hidden" width="2480" height="3508" />
          
          {previewImage ? (
            <div 
              className="relative mx-auto rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.8)] border border-white/10 group transition-transform duration-500 hover:scale-[1.02] cursor-pointer w-full max-w-[340px] sm:max-w-[400px] lg:max-w-[480px] aspect-[1/1.414]"
              onClick={() => setIsEnlarged(true)} 
            >
              <img 
                src={previewImage} 
                alt="OWASP Certificate" 
                className="w-full h-full object-cover block" 
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
              
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-black/50 hover:bg-black/70 backdrop-blur-md text-white/90 text-xs sm:text-sm font-bold rounded-full border border-white/[0.2] hover:border-white/[0.4] opacity-0 group-hover:opacity-100 transition-all duration-300 delay-75 shadow-2xl tracking-wide uppercase hover:scale-105">
                  <Maximize className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Enlarge
                </span>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-[340px] sm:max-w-[400px] lg:max-w-[480px] aspect-[1/1.414] rounded-xl sm:rounded-2xl border border-white/[0.05] bg-white/[0.02] backdrop-blur-md flex flex-col items-center justify-center text-indigo-400 gap-3 sm:gap-4 shadow-2xl mx-auto">
               <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin opacity-80" />
               <p className="text-xs sm:text-sm tracking-widest uppercase font-bold text-indigo-300/80 drop-shadow-sm px-4 text-center">Rendering Matrix Canvas...</p>
            </div>
          )}
        </div>
      </div>

      {isEnlarged && previewImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#08080C]/90 backdrop-blur-2xl animate-fade-in"
          onClick={() => setIsEnlarged(false)}
        >
          <div 
            className="relative max-w-4xl w-full flex justify-center items-center animate-[slideUp_0.4s_cubic-bezier(0.16,1,0.3,1)_forwards] scale-95 origin-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className="cursor-pointer absolute -top-12 right-0 md:-top-16 md:-right-12 text-white/50 hover:text-white bg-white/[0.05] hover:bg-white/[0.15] border border-white/10 rounded-full p-2.5 md:p-3 backdrop-blur-xl transition-all duration-300 hover:scale-110 hover:rotate-90 shadow-xl"
              onClick={() => setIsEnlarged(false)}
              aria-label="Close enlarged certificate"
            >
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            
            <div className="relative group w-full flex justify-center">
              <div className="absolute inset-0 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none -z-10 group-hover:bg-indigo-500/20 transition-colors duration-1000"></div>
              <img 
                src={previewImage} 
                alt="Certificate High Resolution" 
                className="max-h-[85vh] max-w-[95vw] w-auto object-contain rounded-xl sm:rounded-2xl shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/[0.1]"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CertificateView;