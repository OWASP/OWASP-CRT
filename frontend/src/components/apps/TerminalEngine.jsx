import React, { useState, useEffect, useRef } from 'react';
import { APP_CONFIG } from '../../config';

const TerminalEngine = ({ startFlow }) => {
  const [history, setHistory] = useState([]);
  const [termState, setTermState] = useState(0);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const firstNameRef = useRef(null);
  const lastNameRef = useRef(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const user = params.get('user');
    const userId = params.get('userid');
    const errorMsgParam = params.get('message');

    if (status) {
      hasStarted.current = true;
      const isValidUser = user && /^[a-zA-Z0-9-]{1,39}$/.test(user);
      
      if (status === 'success' && isValidUser && userId) {
        setTermState(5);
        pollForCertificate(user, userId);
      } else {
        setHistory([
          <span key="err1" className="text-red-500 block mb-1">[!] ERROR: {errorMsgParam || "Authentication failed or malformed identity detected."}</span>,
          <span key="err2" className="text-slate-400 block mb-4">Please execute CRT_Gen.sh to restart the process.</span>
        ]);
      }
      return;
    }
    
    if (!startFlow) return;
    
    hasStarted.current = true;
    setHistory([
      <span key="init1" className="block mb-1">
        <span className="text-[#ff2a5f] font-bold">root</span><span className="text-white">@</span><span className="text-[#4a7bfe] font-bold">owasp-crt</span>:~$ ./crt_provision.sh
      </span>
    ]);
    
    const t1 = setTimeout(() => setHistory(p => [...p, <span key="init2" className="text-slate-400 block mb-1">[+] Initializing secure identity provisioning...</span>]), 600);
    const t2 = setTimeout(() => setHistory(p => [...p, <span key="init3" className="text-slate-400 block mb-4">[+] Connecting to OWASP verification matrix... OK</span>]), 1200);
    
    const t3 = setTimeout(() => {
       setTermState(1);
       setTimeout(() => firstNameRef.current?.focus(), 50);
    }, 1800);
    
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [startFlow]);

  const pollForCertificate = async (username, userId) => {
    setHistory(p => [
      ...p,
      <span key={`poll1-${Date.now()}`} className="block mb-1">
        <span className="text-[#ff2a5f] font-bold">root</span><span className="text-white">@</span><span className="text-[#4a7bfe] font-bold">owasp-crt</span>:~$ ./crt_provision.sh --resume
      </span>,
      <span key={`poll2-${Date.now()}`} className="text-emerald-500 block mb-1">[ ] GitHub OAuth Authentication Successful.</span>,
      <span key={`poll3-${Date.now()}`} className="text-slate-400 block mb-1">[*] Resolving GitHub Identity for @{username}...</span>,
      <span key={`poll4-${Date.now()}`} className="text-slate-400 block mb-1">[*] Identity resolved (ID securely hashed in background).</span>,
      <span key={`poll5-${Date.now()}`} className="text-slate-400 block mb-1">[*] Awaiting GitHub Actions background compilation... (This may take up to 3 minutes for extensive commit histories)</span>
    ]);
    
    const apiCertUrl = `https://api.github.com/repos/${APP_CONFIG.github.owner}/${APP_CONFIG.github.repo}/contents/certs/${userId}.json?ref=${APP_CONFIG.github.branch}`;
    const apiAttemptUrl = `https://api.github.com/repos/${APP_CONFIG.github.owner}/${APP_CONFIG.github.repo}/contents/attempts/${userId}.json?ref=${APP_CONFIG.github.branch}`;
    
    let initialSha = null;
    let initialAttemptSha = null;
    
    // Fetch initial state to detect file modifications during polling
    try {
      const [preCert, preAttempt] = await Promise.all([
        fetch(`${apiCertUrl}&t=${Date.now()}`),
        fetch(`${apiAttemptUrl}&t=${Date.now()}`)
      ]);
      if (preCert.ok) {
        const data = await preCert.json();
        initialSha = data.sha;
      }
      if (preAttempt.ok) {
        const data = await preAttempt.json();
        initialAttemptSha = data.sha;
      }
    } catch (e) {
      // Ignore initial fetch errors and continue polling
    }
    
    let attempts = 0;
    const maxAttempts = 23; // 23 attempts * 8s interval = 184s (~3 minutes) timeout
    
    const checkCert = setInterval(async () => {
      attempts++;
      try {
        // 1. Check attempts/errors log first
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
                setHistory(p => [
                  ...p,
                  <span key={`gh-err-${Date.now()}`} className="text-red-500 block mt-2 mb-1">[!] SYSTEM ERROR: {attemptData.message}</span>,
                  <span key={`gh-err2-${Date.now()}`} className="text-slate-400 block mb-4">Process aborted. Fix the issue and try again.</span>
                ]);
                return;
              }
            }
          } else if (attemptRes.status === 403 || attemptRes.status === 429) {
              clearInterval(checkCert);
              setHistory(p => [
                  ...p,
                  <span key={`rl-err-${Date.now()}`} className="text-red-500 block mt-2 mb-1">[!] ERROR: GitHub API Rate Limit (60 req/hr) Exceeded.</span>,
                  <span className="text-slate-400 block mb-4">Please wait a few minutes before trying again.</span>
              ]);
              return;
          }
        } catch (e) { /* Ignore transient network errors */ }

        // 2. Check generated certificate file
        const res = await fetch(`${apiCertUrl}&t=${Date.now()}`);
        let isUpdated = false;
        
        if (res.ok) {
          const data = await res.json();
          if (!initialSha || data.sha !== initialSha) {
            isUpdated = true;
          } else if (attempts >= maxAttempts) {
            isUpdated = true; 
            setHistory(p => [...p, <span key={`unchanged-${Date.now()}`} className="text-blue-400 block mb-1">[*] Matrix verified. No statistical changes detected.</span>]);
          }
        } else if (res.status === 404) {
            if (attempts >= maxAttempts) {
                clearInterval(checkCert);
                setHistory(p => [
                  ...p,
                  <span key={`tout1-${Date.now()}`} className="text-red-500 block mt-2 mb-1">[!] TIMEOUT: Certificate generation took too long or failed silently.</span>
                ]);
                return;
            }
        } else if (res.status === 403 || res.status === 429) {
            clearInterval(checkCert);
            setHistory(p => [
                ...p,
                <span key={`rl2-err-${Date.now()}`} className="text-red-500 block mt-2 mb-1">[!] ERROR: GitHub API Rate Limit Exceeded.</span>,
                <span className="text-slate-400 block mb-4">Cannot verify status due to API limits. Please wait 5 minutes.</span>
            ]);
            return;
        }
        
        if (isUpdated) {
          clearInterval(checkCert);
          setHistory(p => [
            ...p,
            <span key={`succ1-${Date.now()}`} className="text-emerald-500 block mt-2 mb-1">[ ] MATRIX GENERATED SUCCESSFULLY!</span>,
            <span key={`succ2-${Date.now()}`} className="text-[#9d4edd] block mb-1">[*] Redirecting to Identity Viewer...</span>
          ]);
          setTimeout(() => {
            window.location.href = `?id=${userId}&fresh=true`;
          }, 2000);
        } else if (attempts % 2 === 0) {
           setHistory(p => [...p, <span key={`wait-${attempts}`} className="text-slate-500 block mb-1">... waiting for action compilation (attempt {attempts}/{maxAttempts})</span>]);
        }
      } catch (err) {
        console.error(err);
      }
    }, 8000);
  };

  const handleFirstNameEnter = (e) => {
    if (e.key === 'Enter') {
      if (!firstName.trim()) return;
      setTermState(2);
      setTimeout(() => lastNameRef.current?.focus(), 50);
    }
  };

  const handleLastNameEnter = (e) => {
    if (e.key === 'Enter') {
      if (!lastName.trim()) return;
      const totalFullName = firstName.trim() + " " + lastName.trim();
      
      if (totalFullName.length > 20) {
        setErrorMsg(`[!] Error: Full name exceeds the 20-character limit (${totalFullName.length}/20).`);
        return;
      }
      setErrorMsg('');
      
      setHistory(p => [
        ...p,
        <span key={`in1-${Date.now()}`} className="block mb-1"><span style={{color: '#9d4edd'}}>Enter First Name: </span>{firstName.trim()}</span>,
        <span key={`in3-${Date.now()}`} className="block mb-4"><span style={{color: '#9d4edd'}}>Enter Last Name: </span>{lastName.trim()}</span>,
        <span key={`ok1-${Date.now()}`} className="text-emerald-500 block mb-1">[ ] Identity syntax verified.</span>,
        <span key={`ok2-${Date.now()}`} className="text-slate-400 block mb-1">[*] Generating authorization link...</span>
      ]);
      setTermState(3);
      
      const oauthUrl = `${APP_CONFIG.worker.baseUrl}/start?name=${encodeURIComponent(totalFullName)}`;
      
      setTimeout(() => {
        setHistory(p => [
          ...p,
          <span key={`auth1-${Date.now()}`} className="text-slate-400 block mb-4">[*] Secure authentication required.</span>,
          <a key={`authLink-${Date.now()}`} href={oauthUrl} className="my-2 inline-flex items-center gap-3 px-4 py-2 bg-white/[0.03] border border-white/[0.05] rounded-[8px] text-slate-300 hover:bg-[rgba(74,123,254,0.1)] hover:border-[rgba(74,123,254,0.3)] hover:text-white transition-all duration-300 font-['Cascadia_Code',monospace] text-[12px] cursor-pointer no-underline shadow-sm group w-fit">
            <svg className="w-4 h-4 fill-current text-slate-500 group-hover:text-[#4a7bfe] transition-colors duration-300" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            <span>[ Click to Authenticate ]</span>
          </a>,
          <span key={`auth2-${Date.now()}`} className="text-slate-500 block mb-1">Waiting for user action...</span>
        ]);
      }, 1500);
    }
  };

  const getCharCountText = () => {
    let currentTotal = firstName.trim().length;
    if (termState === 2) currentTotal += 1 + lastName.trim().length;
    return `[Chars: ${currentTotal}/20]`;
  };

  const handleContainerClick = (e) => {
    if (e.target.tagName !== 'INPUT') {
      if (termState === 1) firstNameRef.current?.focus();
      else if (termState === 2) lastNameRef.current?.focus();
    }
  };

  return (
    <div className="bg-transparent p-[15px] md:p-[20px] font-['Cascadia_Code',monospace] text-[12px] md:text-[13px] text-slate-200 h-full overflow-y-auto rounded-b-[9px] cursor-text flex flex-col leading-[1.6]" onClick={handleContainerClick}>
      <div id="term-output">
        {history.map((LineElement) => LineElement)}
      </div>
      
      {termState >= 1 && termState < 3 && (
        <div className="flex flex-col gap-1.5 mt-1.5 w-full">
          
          <div className="flex items-center flex-wrap w-full">
            <span className="text-[#9d4edd] whitespace-nowrap">Enter First Name: </span>
            <input
              type="text"
              ref={firstNameRef}
              className="bg-transparent border-none outline-none text-white font-['Cascadia_Code',monospace] text-[12px] md:text-[13px] flex-grow ml-2 caret-[#4a7bfe]"
              value={firstName}
              onChange={(e) => {
                if (/^[a-zA-Z\s\-]*$/.test(e.target.value)) {
                  setFirstName(e.target.value);
                  setErrorMsg('');
                }
              }}
              onKeyDown={handleFirstNameEnter}
              autoComplete="off"
              spellCheck="false"
            />
            {termState === 1 && (
              <span className="text-slate-500 text-[11px] ml-2 font-mono whitespace-nowrap">
                {getCharCountText()}
              </span>
            )}
          </div>
          
          {termState === 2 && (
            <div className="flex items-center flex-wrap w-full animate-[fadeIn_0.3s_ease-out]">
              <span className="text-[#9d4edd] whitespace-nowrap">Enter Last Name: </span>
              <input
                type="text"
                ref={lastNameRef}
                className="bg-transparent border-none outline-none text-white font-['Cascadia_Code',monospace] text-[12px] md:text-[13px] flex-grow ml-2 caret-[#4a7bfe]"
                value={lastName}
                onChange={(e) => {
                  if (/^[a-zA-Z\s\-]*$/.test(e.target.value)) {
                    setLastName(e.target.value);
                    setErrorMsg('');
                  }
                }}
                onKeyDown={handleLastNameEnter}
                autoComplete="off"
                spellCheck="false"
              />
              <span className="text-slate-500 text-[11px] ml-2 font-mono whitespace-nowrap">
                {getCharCountText()}
              </span>
            </div>
          )}
          {errorMsg && (
            <span className="text-red-500 block mt-2 animate-[fadeIn_0.3s_ease-out]">{errorMsg}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default TerminalEngine;