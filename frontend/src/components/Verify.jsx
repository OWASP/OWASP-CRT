import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Github, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { APP_CONFIG } from '../config';

const Verify = ({ setCurrentView }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [pollStatus, setPollStatus] = useState('');
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const user = params.get('user');
    const userId = params.get('userid');
    const urlErrorMsg = params.get('message');

    if (status) {
      hasStarted.current = true;
      const isValidUser = user && /^[a-zA-Z0-9-]{1,39}$/.test(user);
      if (status === 'success' && isValidUser && userId) {
        setStep(3);
        pollForCertificate(user, userId);
      } else {
        setStep(1);
        setErrorMsg(urlErrorMsg || "Authentication failed or malformed identity detected.");
      }
    }
  }, []);

  const pollForCertificate = async (username, userId) => {
    if (!/^\d+$/.test(String(userId))) {
      setErrorMsg("Invalid certificate identity.");
      setStep(1);
      return;
    }
    setPollStatus(`Resolving GitHub Identity for @${username}...`);
    const apiCertUrl = `https://api.github.com/repos/${APP_CONFIG.github.owner}/${APP_CONFIG.github.repo}/contents/certs/${userId}.json?ref=${APP_CONFIG.github.branch}`;
    const apiAttemptUrl = `https://api.github.com/repos/${APP_CONFIG.github.owner}/${APP_CONFIG.github.repo}/contents/attempts/${userId}.json?ref=${APP_CONFIG.github.branch}`;
    
    let initialSha = null;
    let initialAttemptSha = null;
    try {
      const [preCert, preAttempt] = await Promise.all([
        fetch(`${apiCertUrl}&t=${Date.now()}`),
        fetch(`${apiAttemptUrl}&t=${Date.now()}`)
      ]);
      if (preCert.ok) initialSha = (await preCert.json()).sha;
      if (preAttempt.ok) initialAttemptSha = (await preAttempt.json()).sha;
    } catch (e) {}

    let attempts = 0;
    const maxAttempts = 23;
    const checkCert = setInterval(async () => {
      attempts++;
      setPollStatus(`Awaiting GitHub Actions background compilation... (Attempt ${attempts}/${maxAttempts})`);
      try {
        const attemptRes = await fetch(`${apiAttemptUrl}&t=${Date.now()}`);
        if (attemptRes.ok) {
          const attemptJson = await attemptRes.json();
          if (!initialAttemptSha || attemptJson.sha !== initialAttemptSha) {
            const decodedContent = decodeURIComponent(escape(atob(attemptJson.content)));
            const attemptData = JSON.parse(decodedContent);
            const nowSeconds = Math.floor(Date.now() / 1000);
            if (attemptData.status === 'error' && attemptData.last_attempt && (nowSeconds - attemptData.last_attempt < 300)) {
              clearInterval(checkCert);
              setErrorMsg(`${attemptData.message}`);
              setStep(1);
              return;
            }
          }
        }
        
        const res = await fetch(`${apiCertUrl}&t=${Date.now()}`);
        let isUpdated = false;
        if (res.ok) {
          const data = await res.json();
          if (!initialSha || data.sha !== initialSha) isUpdated = true;
          else if (attempts >= maxAttempts) isUpdated = true;
        } else if (res.status === 404 && attempts >= maxAttempts) {
          clearInterval(checkCert);
          setErrorMsg("TIMEOUT: Certificate generation took too long or failed silently.");
          setStep(1);
          return;
        }
        
        if (isUpdated) {
          clearInterval(checkCert);
          setPollStatus("Matrix Generated Successfully!");
          setStep(4);
          setTimeout(() => {
            window.location.href = `?id=${userId}&fresh=true`;
          }, 2000);
        }
      } catch (err) {
        console.error(err);
      }
    }, 8000);
  };

  const handleNext = () => {
    const cleanName = name.trim().replace(/\s+/g, ' ');
    if (!cleanName) return;
    if (cleanName.length < 2 || cleanName.length > 20) {
      setErrorMsg(`Name must be between 2 and 20 characters (${cleanName.length}/20).`);
      return;
    }
    setErrorMsg('');
    setName(cleanName);
    setStep(2);
  };

  const handleConnect = () => {
    setIsProcessing(true);
    const oauthUrl = `${APP_CONFIG.worker.baseUrl}/start?name=${encodeURIComponent(name)}`;
    window.location.href = oauthUrl;
  };

  return (
    <div className="flex-1 flex items-center justify-center animate-fade-in w-full h-full min-h-[60vh] relative z-10">
      <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-3xl w-full max-w-xl p-8 md:p-12 relative overflow-hidden transition-all">
        
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${step >= s ? 'bg-indigo-500 shadow-[0_0_12px_#6366f1]' : 'bg-white/10'}`}></div>
              {s < 4 && <div className={`w-8 h-[1px] transition-all duration-500 ${step > s ? 'bg-indigo-500/50' : 'bg-white/10'}`}></div>}
            </div>
          ))}
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-sm shadow-inner">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col animate-[slideUp_0.4s_ease-out_forwards]">
            <h2 className="text-3xl font-bold mb-3 text-white">Who is claiming this?</h2>
            <p className="text-zinc-400 mb-8 text-sm md:text-base">Enter your full name exactly as you want it to appear on your official certificate.</p>
            
            <div className="mb-8 relative">
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setErrorMsg(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                placeholder="e.g. Meysam Bal-afkan"
                className="w-full bg-white/[0.03] border border-white/[0.1] rounded-xl px-5 py-4 text-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 focus:bg-white/[0.05] focus:shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-all duration-300"
                autoFocus
              />
            </div>
            
            <button
              onClick={handleNext}
              disabled={!name.trim()}
              className="w-full py-4 rounded-xl bg-white/90 text-black font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all"
            >
              Continue <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col items-center text-center animate-[slideUp_0.4s_ease-out_forwards]">
            <div className="w-20 h-20 rounded-2xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center mb-6 shadow-xl shadow-black/50">
              <Github className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-3 text-white">Connect Identity</h2>
            <p className="text-zinc-400 mb-8 max-w-md mx-auto text-sm md:text-base">
              We need to verify your contributions. Securely authenticate with GitHub to analyze your repository data.
            </p>
            
            <button
              onClick={handleConnect}
              disabled={isProcessing}
              className="w-full py-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/[0.1] hover:border-white/[0.2] font-bold flex items-center justify-center gap-3 transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
            >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Github className="w-5 h-5" />}
              {isProcessing ? "Redirecting..." : "Continue with GitHub"}
            </button>
            
            <button
              onClick={() => setStep(1)}
              disabled={isProcessing}
              className="mt-6 text-sm text-zinc-500 hover:text-white transition-colors"
            >
              Back to name entry
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col items-center text-center animate-[slideUp_0.4s_ease-out_forwards]">
            <div className="relative mb-8 mt-4">
              <div className="absolute inset-0 bg-indigo-500/20 blur-[30px] rounded-full"></div>
              <Loader2 className="w-16 h-16 text-indigo-400 animate-spin relative z-10 drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
            </div>
            <h2 className="text-3xl font-bold mb-3 text-white">Processing Data</h2>
            <p className="text-zinc-400 mb-4 max-w-md mx-auto text-sm md:text-base">{pollStatus || 'Connecting to GitHub Actions...'}</p>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col items-center text-center animate-[slideUp_0.4s_ease-out_forwards]">
            <div className="relative mb-8 mt-4">
              <div className="absolute inset-0 bg-emerald-500/20 blur-[30px] rounded-full"></div>
              <div className="w-20 h-20 rounded-full bg-white/[0.05] border border-emerald-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)] relative z-10">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-3 text-white">Verification Complete</h2>
            <p className="text-zinc-400 mb-4 text-sm md:text-base">Successfully validated your contributor status. Redirecting...</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default Verify;