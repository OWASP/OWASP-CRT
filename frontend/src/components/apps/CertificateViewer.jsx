import React, { useEffect, useRef, useState } from 'react';
import qrcode from 'qrcode-generator';
import { APP_CONFIG } from '../../config';

const CertificateViewer = ({ certId, isMaximized, setTelemetryData }) => {
  const canvasRef = useRef(null);
  const [certUser, setCertUser] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchedId, setFetchedId] = useState(null);
  
  const [showHint, setShowHint] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);
  const images = useRef({
    logo: new Image(), sign: new Image(), pattern: new Image()
  });

  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 7000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      // Clear data immediately on ID change to prevent ghosting
      if (!certId) {
        setIsLoading(false);
        setError("NO_ID_PROVIDED");
        setFetchedId(null);
        setCertUser(null);
        setPreviewImage(null);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      setCertUser(null);
      setPreviewImage(null);
      
      try {
        const rawUrl = `https://raw.githubusercontent.com/${APP_CONFIG.github.owner}/${APP_CONFIG.github.repo}/${APP_CONFIG.github.branch}/certs/${certId}.json`;
        
        const response = await fetch(rawUrl);
        
        if (!response.ok) {
          if(response.status === 404) throw new Error("IDENTITY_NOT_FOUND");
          throw new Error("SERVER_ERROR");
        }
        
        const data = await response.json();
        setCertUser(data);
        if(setTelemetryData) setTelemetryData({ tier: data.tier, stats: data.stats || {} });
      } catch (e) {
        console.error("Fetch Error: ", e);
        setError(e.message);
      } finally {
        setIsLoading(false);
        setFetchedId(certId);
      }
    };
    fetchData();
  }, [certId, setTelemetryData]);

  // Derived state to prevent error flashes during ID transition
  const activeError = (certId && certId !== fetchedId) ? null : error;

  useEffect(() => {
    if (!certUser || !canvasRef.current || activeError) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    images.current.logo.src = `${APP_CONFIG.assetsPath}/owasp-logo.svg`;
    images.current.sign.src = `${APP_CONFIG.assetsPath}/sign.svg`;
    
    const currentTier = certUser.tier || "Bronze";
    switch (currentTier) {
      case "Bronze": images.current.pattern.src = `${APP_CONFIG.assetsPath}/stage-1.svg`; break;
      case "Silver": images.current.pattern.src = `${APP_CONFIG.assetsPath}/stage-2.svg`; break;
      case "Gold": images.current.pattern.src = `${APP_CONFIG.assetsPath}/stage-3.svg`; break;
      default: images.current.pattern.src = `${APP_CONFIG.assetsPath}/stage-1.svg`; break;
    }

    const capitalizeRegex = (str) => str.replace(/(^\w|\s\w)/g, m => m.toUpperCase());

    const getGradient = () => {
      const g = ctx.createLinearGradient(canvas.width, canvas.height, 0, 0);
      switch (currentTier) {
        case "Bronze": g.addColorStop(0, "#ff0044"); g.addColorStop(1, "#ff3396"); break;
        case "Silver": g.addColorStop(0, "#3fbbfe"); g.addColorStop(1, "#4157ff"); break;
        case "Gold": g.addColorStop(0, "#ff46f0"); g.addColorStop(1, "#711bff"); break;
        default: g.addColorStop(0, "#ff0044"); g.addColorStop(1, "#ff3396"); break;
      }
      return g;
    };

    const drawLineJustified = (ctx, words, x, y, maxWidth) => {
      if (words.length === 0) return;
      if (words.length === 1) { ctx.textAlign = 'left'; ctx.fillText(words[0], x, y); return; }
      let totalWordsWidth = 0;
      for (let word of words) totalWordsWidth += ctx.measureText(word).width;
      const totalSpaces = words.length - 1;
      const extraSpace = (maxWidth - totalWordsWidth) / totalSpaces;
      let currentX = x;
      for (let i = 0; i < words.length; i++) {
        ctx.textAlign = 'left'; ctx.fillText(words[i], currentX, y);
        if (i < words.length - 1) currentX += ctx.measureText(words[i]).width + extraSpace;
      }
    };

    const drawJustifiedText = (ctx, text, x, y, maxWidth, lineHeight) => {
      const words = text.split(' '); let currentLine = []; let currentWidth = 0;
      for (let i = 0; i < words.length; i++) {
        const wordWidth = ctx.measureText(words[i] + ' ').width;
        if (currentWidth + wordWidth <= maxWidth) { currentLine.push(words[i]); currentWidth += wordWidth; }
        else { drawLineJustified(ctx, currentLine, x, y, maxWidth); y += lineHeight; currentLine = [words[i]]; currentWidth = ctx.measureText(words[i] + ' ').width; }
      }
      if (currentLine.length > 0) { ctx.textAlign = 'left'; ctx.fillText(currentLine.join(' '), x, y); }
    };

    const calculateLines = (ctx, text, maxWidth) => {
      const words = text.split(' ');
      let currentWidth = 0;
      let lines = 1;
      for (let i = 0; i < words.length; i++) {
        const wordWidth = ctx.measureText(words[i] + ' ').width;
        if (currentWidth + wordWidth <= maxWidth) {
          currentWidth += wordWidth;
        } else {
          lines++;
          currentWidth = ctx.measureText(words[i] + ' ').width;
        }
      }
      return lines;
    };

    const generateQRCodeAdvanced = (options = {}) => {
      const { size = 250, color = '#1a1a2e' } = options;
      const qr = qrcode(0, 'H');
      const qrUrl = window.location.href.includes('?id=') ? window.location.href : `${APP_CONFIG.domain}/?id=${certUser.id || "0"}`;
      qr.addData(qrUrl); qr.make();
      const cells = qr.getModuleCount(); 
      const cs = size / cells;
      
      const startX = 190;
      const startY = 3000;

      const isFinder = (row, col) => {
        if (row < 7 && col < 7) return true; 
        if (row < 7 && col >= cells - 7) return true; 
        if (row >= cells - 7 && col < 7) return true; 
        return false;
      };

      for (let row = 0; row < cells; row++) {
        for (let col = 0; col < cells; col++) {
          if (qr.isDark(row, col) && !isFinder(row, col)) {
            const x = startX + col * cs; 
            const y = startY + row * cs;
            ctx.fillStyle = color;
            ctx.beginPath(); 
            ctx.arc(x + cs / 2, y + cs / 2, (cs-1) / 2.2, 0, Math.PI * 2); 
            ctx.fill();
          }
        }
      }

      const drawFinder = (offsetX, offsetY, type) => {
        const x = startX + offsetX * cs;
        const y = startY + offsetY * cs;
        
        let rOut = 2.5 * cs; 
        let rMid = 1.5 * cs; 
        let rIn = 0.8 * cs;  
        let sh = 0.3 * cs;   
        let radiiOut, radiiMid, radiiIn;

        if (type === 'TL') {
          radiiOut = [rOut, rOut, sh, rOut];
          radiiMid = [rMid, rMid, sh, rMid];
          radiiIn  = [rIn, rIn, sh, rIn];
        } else if (type === 'TR') {
          radiiOut = [rOut, rOut, rOut, sh];
          radiiMid = [rMid, rMid, rMid, sh];
          radiiIn  = [rIn, rIn, rIn, sh];
        } else if (type === 'BL') {
          radiiOut = [rOut, sh, rOut, rOut];
          radiiMid = [rMid, sh, rMid, rMid];
          radiiIn  = [rIn, sh, rIn, rIn];
        }

        const drawPoly = (rArray, sizeCells, inset) => {
           const px = x + inset * cs;
           const py = y + inset * cs;
           const w = sizeCells * cs;
           ctx.beginPath();
           if (ctx.roundRect) {
               ctx.roundRect(px, py, w, w, rArray);
           } else {
               ctx.rect(px, py, w, w); 
           }
           ctx.fill();
        };

        ctx.fillStyle = color;            
        drawPoly(radiiOut, 7, 0);
        ctx.fillStyle = "#171c24";        
        drawPoly(radiiMid, 5, 1);
        ctx.fillStyle = color;            
        drawPoly(radiiIn, 3, 2);
      };

      drawFinder(0, 0, 'TL');          
      drawFinder(cells - 7, 0, 'TR');  
      drawFinder(0, cells - 7, 'BL');  

      const centerX = startX + size / 2;
      const centerY = startY + size / 2;
      const renderSize = size * 0.24; 
      const bgRadius = renderSize / 2 + (size * 0.02); 
      
      ctx.fillStyle = "#171c24";
      ctx.beginPath();
      ctx.arc(centerX, centerY, bgRadius, 0, Math.PI * 2);
      ctx.fill();

      const svgPath = "M15.897 20.503c-0.384 0 -1.782 -2.489 -1.97 -3.198 -0.393 -1.486 -0.308 -2.114 -0.285 -2.314 0.072 -0.613 0.667 -0.92 0.703 -1.748 0.01 -0.256 0.14 -1.535 0.243 -2.534a1.723 1.723 0 0 1 -0.733 -0.343c0.676 0.908 -0.32 1.995 -1.767 3.443 -1.536 1.536 -4.945 2.961 -4.945 2.961s1.425 -3.41 2.961 -4.945c1.13 -1.129 2.04 -1.983 2.816 -1.983 0.22 0 0.427 0.067 0.627 0.216a1.722 1.722 0 0 1 -0.343 -0.733c-0.999 0.103 -2.278 0.232 -2.534 0.244 -0.829 0.036 -1.135 0.63 -1.747 0.702 -0.07 0.008 -0.194 0.024 -0.388 0.024 -0.36 0 -0.963 -0.054 -1.926 -0.31 -0.772 -0.203 -3.648 -1.84 -3.14 -2.045 0.26 -0.105 1.087 -0.176 2.175 -0.176 1.047 0 2.337 0.066 3.596 0.23 1.57 0.205 3.01 0.463 3.992 0.656 0.016 -0.053 0.035 -0.104 0.058 -0.154l-1.004 -0.48s-0.8 -0.92 -0.715 -0.984a0.02 0.02 0 0 1 0.012 -0.003c0.126 0 0.767 0.733 0.829 0.816l0.605 0.202 -0.284 -0.249s-0.388 -1.438 -0.287 -1.472h0.004c0.106 0 0.459 1.25 0.489 1.34 0.07 0.06 0.303 0.152 0.596 0.32l-0.308 -0.79s0.14 -1.305 0.243 -1.305h0.003c0.105 0.021 -0.02 1.089 -0.047 1.221l0.51 0.783a1.31 1.31 0 0 1 0.463 -0.082c0.184 0 0.374 0.036 0.558 0.107 -0.236 -0.502 -0.218 -1.025 0.095 -1.338a0.84 0.84 0 0 1 0.353 -0.209 0.462 0.462 0 0 1 0.457 -0.383c0.127 0 0.254 0.05 0.352 0.148a0.497 0.497 0 0 1 0.147 0.335c0.151 -0.311 0.329 -0.73 0.317 -0.867 -0.03 -0.307 -0.386 -0.852 -0.39 -0.857a0.076 0.076 0 0 1 0.064 -0.119c0.025 0 0.05 0.012 0.064 0.035 0.016 0.023 0.381 0.582 0.414 0.927 0.018 0.198 -0.21 0.696 -0.333 0.95a2.227 2.227 0 0 1 0.873 0.874c0.245 -0.12 0.715 -0.334 0.927 -0.334l0.024 0.001c0.345 0.033 0.904 0.399 0.927 0.414a0.076 0.076 0 0 1 -0.084 0.128c-0.005 -0.004 -0.55 -0.36 -0.857 -0.39h-0.015c-0.15 0 -0.552 0.171 -0.852 0.317 0.12 0.004 0.242 0.053 0.335 0.147a0.482 0.482 0 0 1 0.012 0.681 0.459 0.459 0 0 1 -0.247 0.128 0.845 0.845 0 0 1 -0.21 0.354 0.924 0.924 0 0 1 -0.67 0.255c-0.212 0 -0.441 -0.055 -0.667 -0.16 0.132 0.343 0.142 0.708 0.025 1.02l0.783 0.51c0.095 -0.019 0.666 -0.088 0.993 -0.088 0.13 0 0.222 0.011 0.228 0.04 0.02 0.106 -1.305 0.247 -1.305 0.247l-0.79 -0.308c0.168 0.293 0.26 0.527 0.32 0.596 0.091 0.03 1.374 0.392 1.34 0.493 -0.004 0.012 -0.026 0.017 -0.063 0.017 -0.283 0 -1.41 -0.304 -1.41 -0.304l-0.248 -0.284 0.202 0.605c0.087 0.065 0.876 0.755 0.813 0.841 -0.004 0.005 -0.009 0.007 -0.016 0.007 -0.139 0 -0.967 -0.722 -0.967 -0.722l-0.481 -1.004a1.18 1.18 0 0 1 -0.154 0.058c0.193 0.982 0.451 2.422 0.656 3.992 0.335 2.569 0.26 5.261 0.054 5.77 -0.016 0.041 -0.042 0.06 -0.076 0.06M12 24C5.373 24 0 18.627 0 12S5.373 0 12 0s12 5.373 12 12 -5.373 12 -12 12m0 -22.153C6.393 1.847 1.847 6.393 1.847 12S6.393 22.153 12 22.153 22.153 17.607 22.153 12 17.607 1.847 12 1.847Z";
      const svgViewboxSize = 24; 
      const scale = renderSize / svgViewboxSize;
      const translateX = centerX - renderSize / 2;
      const translateY = centerY - renderSize / 2;
      const basePath = new Path2D(svgPath);
      const m = new DOMMatrix().translate(translateX, translateY).scale(scale, scale);
      const transformedPath = new Path2D();
      transformedPath.addPath(basePath, m);
      ctx.fillStyle = color;
      ctx.fill(transformedPath);
    };

    const getResponsiveFontSize = (ctx, text, fontFamily, maxFontSize, maxWidth, minFontSize = 120) => {
      ctx.font = `${maxFontSize}px ${fontFamily}`;
      const textWidth = ctx.measureText(text).width;
      if (textWidth <= maxWidth) return maxFontSize;
      const scaledSize = Math.floor(maxFontSize * (maxWidth / textWidth));
      return Math.max(minFontSize, scaledSize);
    };

    const renderCertificate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const g = getGradient();
      let certText = "";
      switch (currentTier) {
        case "Silver":
          certText = "Awarded for your relentless execution and profound expertise. Your sustained contributions stand as a vital pillar of OWASP projects. This certificate recognizes an outstanding professional who actively architects the future of security standards.";
          break;
        case "Gold":
          certText = "The pinnacle of recognition for a true visionary. Your elite contributions have forged an indelible legacy within the OWASP ecosystem, shielding millions worldwide. This certificate honors your ultimate standing as a pioneer at the absolute forefront of global cybersecurity.";
          break;
        case "Bronze":
        default:
          certText = "This certificate marks your official entry into the OWASP global ecosystem. Your initiative strengthens our collective defenses against relentless threats. We honor your commitment and welcome you to the frontline of cybersecurity.";
          break;
      }
      
      ctx.font = "300 75px Corbel"; 
      const textLines = calculateLines(ctx, certText, 2100);
      const startY = 1840;
      const lineHeight = 110;
      const paddingBottom = 10;
      const dynamicRepoY = startY + (textLines * lineHeight) + paddingBottom;
      
      ctx.globalAlpha = 0.25; 
      if (images.current.pattern.complete && images.current.pattern.naturalWidth !== 0) {
        ctx.drawImage(images.current.pattern, 0, 0, 2480, 3508);
      }
      
      ctx.globalAlpha = 1;
      if (images.current.sign.complete) {
        ctx.drawImage(images.current.sign, 300, 2460, 440, 290);
      }
      
      ctx.globalCompositeOperation = "source-atop";
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 2480, 3508);
      
      ctx.globalCompositeOperation = "destination-over";
      ctx.fillStyle = "#171c24";
      ctx.fillRect(0, 0, 2480, 3508);
      
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = g;
      ctx.strokeStyle = g;
      ctx.lineWidth = 4;
      ctx.beginPath(); 
      if (ctx.roundRect) {
        ctx.roundRect(460, 1000, 1070, 120, [100]); 
      } else {
        ctx.rect(460, 1000, 1070, 120);
      }
      ctx.stroke();
      ctx.globalAlpha = 0.1; ctx.fill(); ctx.globalAlpha = 1; 
      
      ctx.font = "70px Ebrima";
      let certYear = new Date().getFullYear();
      if (certUser.stats?.first_commit_date) certYear = certUser.stats.first_commit_date.split('-')[0];
      else if (certUser.first_commit) certYear = certUser.first_commit;
      const certIdText = `CRT-OWASP-${certUser.id || "000"} : ${certYear}`;
      ctx.fillText(certIdText, 460 + (1070 - ctx.measureText(certIdText).width) / 2, 1085);
      
      const displayName = certUser.real_name ? capitalizeRegex(certUser.real_name) : (certUser.user || "UNKNOWN");
      const nameMaxWidth = 2100;
      const nameFontSize = getResponsiveFontSize(ctx, displayName, "Impact", 260, nameMaxWidth);
      ctx.font = `${nameFontSize}px Impact`;
      ctx.fillText(displayName, 190, 1680); 
      
      ctx.font = "italic 70px Corbel";
      const projectCount = certUser.stats?.project_count || 1;
      ctx.fillText(`${projectCount} ${projectCount === 1 ? 'Repository' : 'Repositories'}`, 190, dynamicRepoY); 
      
      ctx.font = "Bold 90px Ebrima"; ctx.fillText("Meysam Bal-afkan", 190, 2850); ctx.fillText("Fatemeh Zahedi", 1510, 2850);
      ctx.font = "50px Corbel"; ctx.fillText("OWASP-CRT Project Leader", 190, 2930); ctx.fillText("OWASP-CRT Project Co-Leader", 1510, 2930);
      
      generateQRCodeAdvanced({ color: g });
      
      ctx.fillStyle = "white"; 
      ctx.font = "bold 200px 'Cascadia Mono', monospace"; ctx.fillText("CERTIFICATE", 330, 800);
      ctx.font = "200 100px 'Cascadia Code', monospace"; ctx.fillText("OF CONTRIBUTION", 550, 900);
      ctx.font = "200 70px Corbel"; ctx.fillText("PRESENTED TO", 640, 1400); 

      let tierTitleLeft = "";
      let tierTitleRight = "";
      switch (currentTier) {
        case "Silver":
           tierTitleLeft = "// ADVANCED CONTRIBUTOR";
           tierTitleRight = "// OFFICIALLY RECOGNIZED";
           break;
        case "Gold":
           tierTitleLeft = "// ELITE CONTRIBUTOR";
           tierTitleRight = "// OFFICIALLY RECOGNIZED";
           break;
        case "Bronze":
        default:
           tierTitleLeft = "// VERIFIED CONTRIBUTOR";
           tierTitleRight = "// OFFICIALLY RECOGNIZED";
           break;
      }
      
      ctx.fillStyle = g; 
      ctx.font = "70px Ebrima";
      ctx.fillText(`${tierTitleLeft}   ${tierTitleRight}`, 190, 1250);
      
      ctx.fillStyle = "white";
      ctx.font = "300 75px Corbel"; 
      drawJustifiedText(ctx, certText, 190, startY, 2100, lineHeight);

      if (images.current.logo.complete) {
        const tempCanvas = document.createElement('canvas');
        const tWidth = images.current.logo.naturalWidth || 483;
        const tHeight = images.current.logo.naturalHeight || 145;
        tempCanvas.width = tWidth;
        tempCanvas.height = tHeight;
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCtx.drawImage(images.current.logo, 0, 0, tWidth, tHeight);
        
        tempCtx.globalCompositeOperation = 'source-in';
        tempCtx.fillStyle = '#FFFFFF';
        tempCtx.fillRect(0, 0, tWidth, tHeight);
        
        ctx.drawImage(tempCanvas, 330, 415, 483, 145);
      }
      
      const dataUrl = canvas.toDataURL('image/jpeg', 1.0);
      setPreviewImage(dataUrl);
    };

    let loadedImages = 0;
    const totalImages = 3; 
    const checkReady = () => {
      loadedImages++;
      if (loadedImages === totalImages) {
        renderCertificate();
      }
    };

    if (images.current.logo.complete) checkReady(); else images.current.logo.onload = checkReady;
    if (images.current.sign.complete) checkReady(); else images.current.sign.onload = checkReady;
    if (images.current.pattern.complete) checkReady(); else images.current.pattern.onload = checkReady;
    
  }, [certUser, activeError]);

  const renderErrorState = () => {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-[#0a0b10] font-['Fira_Code',monospace] p-4 text-center">
        <div className="w-20 h-20 mb-6 rounded-full border-2 border-[#ff2a5f] flex items-center justify-center bg-[#ff2a5f]/10 animate-pulse">
          <svg className="w-10 h-10 text-[#ff2a5f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-[#ff2a5f] text-2xl font-bold tracking-widest mb-2">ACCESS_DENIED</h2>
        <p className="text-slate-400 text-sm max-w-[400px] leading-relaxed">
          {activeError === "IDENTITY_NOT_FOUND" 
            ? "The requested certificate identity (?id=...) could not be found in the OWASP matrix. It may be invalid or not yet generated."
            : activeError === "NO_ID_PROVIDED"
            ? "No identity parameter was provided. Please execute CRT_Gen.sh to request a new certificate or provide a valid link."
            : "A systemic error occurred while trying to fetch the matrix data."}
        </p>
      </div>
    );
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      
      {(!activeError && showHint && certUser) && (
        <div
          className={`absolute top-[20px] left-[30px] w-[260px] bg-[rgba(15,17,26,0.95)] backdrop-blur-[10px] py-3 px-4 rounded-[8px] z-[100] shadow-[0_10px_30px_rgba(0,0,0,0.8)] transition-all duration-500 pointer-events-none border border-[#4a7bfe] before:content-[''] before:absolute before:left-[20px] before:top-[-6px] before:-rotate-[225deg] before:w-3 before:h-3 before:bg-[rgba(15,17,26,0.95)] before:border-l-[#4a7bfe] before:border-b-[#4a7bfe] max-md:hidden opacity-100 visible`}
        >
          <div className="font-['Fira_Code',monospace] text-[11px] font-bold mb-1 text-[#4a7bfe]">
            {isMaximized ? "HINT: MINIMIZE" : "HINT: MAXIMIZE"}
          </div>
          <div className="text-[11px] leading-relaxed text-slate-300">
            {isMaximized
              ? "Click the GREEN button to minimize this window."
              : "Click the GREEN button to maximize this window."}
          </div>
        </div>
      )}
      
      <div className="w-full h-full overflow-hidden bg-[#0a0b10] flex justify-center items-center p-[25px] rounded-b-[11px] max-md:p-[20px_10px]">
        {activeError ? (
          renderErrorState()
        ) : (
          <>
            <canvas 
              ref={canvasRef} 
              id="cert-canvas" 
              className="hidden" 
              width="2480" 
              height="3508" 
            />
            
            {previewImage ? (
              <img 
                src={previewImage} 
                alt="OWASP Certificate Preview" 
                className="max-w-full max-h-full w-auto h-auto aspect-[2480/3508] block shadow-[0_15px_40px_rgba(0,0,0,0.8)]"
              />
            ) : (
              <div className="text-[#4a7bfe] font-['Fira_Code',monospace] text-xs animate-pulse">
                [+] RENDERING MATRIX...
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CertificateViewer;