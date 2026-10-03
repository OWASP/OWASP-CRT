import React, { useEffect, useRef, useState } from 'react';
import { Download, Share2, Linkedin, AlertCircle, Loader2, GitCommit, FolderGit2, FilePlus, FileMinus, Award, CheckCircle2, X, Maximize, Target, Github, ShieldAlert } from 'lucide-react';
import { jsPDF } from "jspdf";
import qrcode from 'qrcode-generator';

import { APP_CONFIG } from '../config';

const CertificateView = ({ certId, setTelemetryData }) => {
  const canvasRef = useRef(null);
  const [certUser, setCertUser] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);
  
  const [isEnlarged, setIsEnlarged] = useState(false);
  
  const images = useRef({
    logo: new Image(), sign: new Image(), pattern: new Image()
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!certId || !/^\d+$/.test(String(certId))) {
        setIsLoading(false);
        setError("NO_ID_PROVIDED");
        return;
      }
      setIsLoading(true);
      setError(null);
      setCertUser(null);
      setPreviewImage(null);

      try {
        const urlParams = new URLSearchParams(window.location.search);
        const isFresh = urlParams.get('fresh') === 'true';
        let data = null;
        
        if (isFresh) {
          try {
            const apiUrl = `https://api.github.com/repos/${APP_CONFIG.github.owner}/${APP_CONFIG.github.repo}/contents/certs/${certId}.json?ref=${APP_CONFIG.github.branch}&t=${Date.now()}`;
            const apiResponse = await fetch(apiUrl);
            if (apiResponse.ok) {
              const apiJson = await apiResponse.json();
              const decodedContent = decodeURIComponent(escape(atob(apiJson.content)));
              data = JSON.parse(decodedContent);
              if (data && String(data.id) === String(certId)) {
                window.history.replaceState(null, '', `?id=${certId}`);
              }
            }
          } catch (e) {}
        }
        
        if (!data) {
          const rawUrl = `https://raw.githubusercontent.com/${APP_CONFIG.github.owner}/${APP_CONFIG.github.repo}/${APP_CONFIG.github.branch}/certs/${certId}.json?t=${Date.now()}`;
          const rawResponse = await fetch(rawUrl);
          if (!rawResponse.ok) throw new Error(rawResponse.status === 404 ? "IDENTITY_NOT_FOUND" : "SERVER_ERROR");
          data = await rawResponse.json();
          if (!data || String(data.id) !== String(certId)) throw new Error("IDENTITY_MISMATCH");
        }
        
        setCertUser(data);
        if(setTelemetryData) setTelemetryData({ tier: data.tier, stats: data.stats || {} });
      } catch (e) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [certId, setTelemetryData]);

  useEffect(() => {
    if (!certUser || !canvasRef.current || error) return;
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
      const { size = 320, color = '#1a1a2e' } = options;
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
        let rOut = 2.5 * cs; let rMid = 1.5 * cs; let rIn = 0.8 * cs; let sh = 0.3 * cs;
        let radiiOut, radiiMid, radiiIn;
        
        if (type === 'TL') { radiiOut = [rOut, rOut, sh, rOut]; radiiMid = [rMid, rMid, sh, rMid]; radiiIn  = [rIn, rIn, sh, rIn]; } 
        else if (type === 'TR') { radiiOut = [rOut, rOut, rOut, sh]; radiiMid = [rMid, rMid, rMid, sh]; radiiIn  = [rIn, rIn, rIn, sh]; } 
        else if (type === 'BL') { radiiOut = [rOut, sh, rOut, rOut]; radiiMid = [rMid, sh, rMid, rMid]; radiiIn  = [rIn, sh, rIn, rIn]; }
        
        const drawPoly = (rArray, sizeCells, inset) => {
           const px = x + inset * cs; const py = y + inset * cs; const w = sizeCells * cs;
           ctx.beginPath();
           if (ctx.roundRect) { ctx.roundRect(px, py, w, w, rArray); } 
           else { ctx.rect(px, py, w, w); }
           ctx.fill();
        };
        ctx.fillStyle = color; drawPoly(radiiOut, 7, 0);
        ctx.fillStyle = "#171c24"; drawPoly(radiiMid, 5, 1);
        ctx.fillStyle = color; drawPoly(radiiIn, 3, 2);
      };

      drawFinder(0, 0, 'TL');
      drawFinder(cells - 7, 0, 'TR');
      drawFinder(0, cells - 7, 'BL');

      const centerX = startX + size / 2;
      const centerY = startY + size / 2;
      const bgRadius = size * 0.16; 
      ctx.fillStyle = "#171c24";
      ctx.beginPath();
      ctx.arc(centerX, centerY, bgRadius, 0, Math.PI * 2);
      ctx.fill();

      const svgPath = "M2.11,226.22c-.58.97-2.06.61-2.09-.52-.2-8.25.95-26.52,15.68-29.88,13.27-3.03,9.12-13.47,15.42-28.67,6.72-16.2,25.56-24.83,35.64-25.72,24-2.12,30.62,22.37,30.61,29.15-.02,24.04-14.65,43.29-28.98,34.48-7.79-4.79,1.21-13.16,6.44-21.33,6.05-9.45-1.42-22.02-11.64-21.12-14.99,1.32-17.76,18.01-18.36,28.71-.73,13.16-10.97,22.99-24.82,21.03-7.96-1.12-12.64,5.04-17.91,13.87ZM6.59,237.36s18.28,14.66,32,4.81c5.37-3.85,11.95-6.17,18.04-3.63,8.81,3.67,28.62,9.27,43.93.56,36.62-20.83,14.18-58.22,30.47-62.78,4.28-1.2,9.83-6.12,8.5-12.39-1.62-7.7-12.33-11.08-21.67-3.94-17.33,13.25,1.89,28.81-16.72,52.96-6.11,7.93-18.28,20.12-37.78,8.84-15.46-8.94-27.26-2.71-31.41,4.33-7.52,12.76-20.51,9.8-24.26,9.3-3.75-.5-1.12,1.94-1.12,1.94ZM121.09,24.31c-8.62,11.02-5.23,24.8,5.8,32.01,8.97,5.87,20.95,16.15,15.68,30.25-4.4,11.78-17.66,12.39-22.82,2.42-4.46-8.61-8.5-23.49-16.54-19.14-14.79,8-5.43,30.29,15.38,42.34,5.87,3.4,30.38,9.9,40.55-11.94,4.27-9.17,6.21-29.8-4.46-43.72-10.01-13.06-21.13-14.69-17.12-27.69,4.45-14.43-10.79-24.56-18.04-28.52-.99-.54-2.05.56-1.5,1.55,5.01,8.98,8.01,16.12,3.06,22.44ZM106.14.18s-21.83,8.5-20.17,25.31c.65,6.57-.63,13.43-5.88,17.44-7.58,5.79-22.34,20.15-22.45,37.77-.27,42.13,43.33,41.39,39.13,57.78-1.1,4.3.39,11.57,6.48,13.56,7.48,2.44,15.75-5.14,14.24-16.79-2.81-21.63-25.89-12.77-37.5-40.96-3.81-9.26-8.28-25.89,11.23-37.14,15.47-8.92,15.98-22.26,11.96-29.37-7.29-12.9,1.76-22.66,4.08-25.66,2.31-3-1.13-1.94-1.13-1.94ZM234.18,207.3c-5.23-12.98-18.86-16.93-30.62-10.98-9.57,4.83-24.95,10.45-34.04-1.54-6.04-7.97-.44-20.51,10.78-20,9.69.44,23.13,3.41,23.39-5.73.46-16.81-23.52-19.85-44.35-7.85-5.87,3.38-23.77,21.36-9.94,41.09,5.81,8.28,22.71,20.28,40.09,18,16.32-2.14,23.28-10.96,32.54-.98,10.27,11.07,26.67,2.94,33.72-1.36.97-.59.54-2.05-.59-2.07-10.28-.15-17.96-1.12-20.97-8.57ZM262.56,206.42s3.55-23.16-11.84-30.12c-6.02-2.72-11.32-7.26-12.16-13.81-1.23-9.47-6.29-29.42-21.48-38.33-36.35-21.3-57.51,16.83-69.6,5-3.17-3.1-10.21-5.45-14.98-1.17-5.86,5.26-3.43,16.21,7.42,20.73,20.14,8.39,24-16.04,54.22-12,9.92,1.33,26.56,5.77,26.55,28.3,0,17.86,11.28,24.97,19.45,25.04,14.81.14,18.74,12.86,20.18,16.36s2.24,0,2.24,0Z";
      
      const svgWidth = 262.91;
      const svgHeight = 245.57;
      const targetLogoSize = bgRadius * 1.4; 
      const scale = targetLogoSize / Math.max(svgWidth, svgHeight);
      
      const offsetX = 0.01 * size;
      const offsetY = -0.02 * size;

      const translateX = centerX - (svgWidth * scale) / 2 + offsetX;
      const translateY = centerY - (svgHeight * scale) / 2 + offsetY;
      
      const basePath = new Path2D(svgPath);
      const m = new DOMMatrix().translate(translateX, translateY).scale(scale, scale);
      const transformedPath = new Path2D();
      transformedPath.addPath(basePath, m);
      
      ctx.fillStyle = color;
      ctx.fill(transformedPath);
    };

    const getResponsiveFontSize = (ctx, text, fontFamily, maxFontSize, maxWidth, minFontSize = 120) => {
      ctx.font = `400 ${maxFontSize}px '${fontFamily}'`;
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
      
      ctx.font = "200 62px 'Inter'";
      const textLines = calculateLines(ctx, certText, 2100);
      const startY = 1840;
      const lineHeight = 95;
      const paddingBottom = 10;
      const dynamicRepoY = startY + (textLines * lineHeight) + paddingBottom;
      
      ctx.globalAlpha = 0.45;
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
      const radius = 60;
      const bx = 460, by = 1000, bw = 1070, bh = 120;
      ctx.moveTo(bx + radius, by);
      ctx.lineTo(bx + bw - radius, by);
      ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + radius);
      ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - radius, by + bh);
      ctx.lineTo(bx + radius, by + bh);
      ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - radius);
      ctx.quadraticCurveTo(bx, by, bx + radius, by);
      ctx.closePath();
      
      ctx.stroke();
      ctx.globalAlpha = 0.1; ctx.fill(); ctx.globalAlpha = 1;
      
      ctx.font = "400 65px 'Inter'";
      let certYear = new Date().getFullYear();
      if (certUser.stats?.first_commit_date) certYear = certUser.stats.first_commit_date.split('-')[0];
      else if (certUser.first_commit) certYear = certUser.first_commit;
      const certIdText = `CRT-OWASP-${certUser.id || "000"} : ${certYear}`;
      const idWidth = ctx.measureText(certIdText).width;
      ctx.fillText(certIdText, bx + (bw - idWidth) / 2, 1082);
      
      const displayName = certUser.real_name ? capitalizeRegex(certUser.real_name) : (certUser.user || "UNKNOWN");
      const nameMaxWidth = 2100;
      const nameFontSize = getResponsiveFontSize(ctx, displayName, "Anton", 260, nameMaxWidth);
      ctx.font = `400 ${nameFontSize}px 'Anton'`;
      ctx.fillText(displayName, 190, 1680);
      
      ctx.font = "italic 400 60px 'Inter'";
      const projectCount = certUser.stats?.project_count || 1;
      ctx.fillText(`${projectCount} ${Number(projectCount) === 1 ? 'Repository' : 'Repositories'}`, 190, dynamicRepoY);
      
      ctx.font = "bold 90px 'Montserrat'"; ctx.fillText("Meysam Bal-afkan", 190, 2850); ctx.fillText("Fatemeh Zahedi", 1510, 2850);
      ctx.font = "400 50px 'Inter'"; ctx.fillText("OWASP-CRT Project Leader", 190, 2930); ctx.fillText("OWASP-CRT Project Co-Leader", 1510, 2930);
      
      generateQRCodeAdvanced({ color: g });
      
      ctx.fillStyle = "white";
      ctx.font = "bold 200px 'Cascadia Mono', monospace"; ctx.fillText("CERTIFICATE", 330, 800);
      ctx.font = "400 100px 'Cascadia Code', monospace"; ctx.fillText("OF CONTRIBUTION", 550, 900);
      ctx.font = "300 70px 'Inter'"; ctx.fillText("PRESENTED TO", 640, 1400);
      
      let tierTitleLeft = "";
      let tierTitleRight = "";
      switch (currentTier) {
        case "Silver": tierTitleLeft = "// ADVANCED CONTRIBUTOR"; tierTitleRight = "// OFFICIALLY RECOGNIZED"; break;
        case "Gold": tierTitleLeft = "// ELITE CONTRIBUTOR"; tierTitleRight = "// OFFICIALLY RECOGNIZED"; break;
        case "Bronze":
        default: tierTitleLeft = "// VERIFIED CONTRIBUTOR"; tierTitleRight = "// OFFICIALLY RECOGNIZED"; break;
      }
      
      ctx.fillStyle = g;
      ctx.font = "400 62px 'Inter'";
      ctx.fillText(`${tierTitleLeft}      ${tierTitleRight}`, 190, 1250);
      
      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.font = "200 62px 'Inter'";
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
      
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setPreviewImage(url);
        }
      }, 'image/jpeg', 0.85); 
    };

    let loadedImages = 0;
    const totalImages = 3;
    const checkReady = () => {
      loadedImages++;
      if (loadedImages === totalImages) {
        Promise.all([
          document.fonts.load('400 260px "Anton"'),
          document.fonts.load('200 62px "Inter"'),
          document.fonts.load('300 70px "Inter"'),
          document.fonts.load('italic 400 60px "Inter"'),
          document.fonts.load('400 65px "Inter"'),
          document.fonts.load('bold 90px "Montserrat"'),
          document.fonts.load('400 50px "Inter"'),
          document.fonts.load('bold 200px "Cascadia Mono"'),
          document.fonts.load('400 100px "Cascadia Code"')
        ]).then(() => {
          document.fonts.ready.then(() => { setTimeout(() => { renderCertificate(); }, 250); });
        }).catch((e) => {
          setTimeout(() => renderCertificate(), 250);
        });
      }
    };

    if (images.current.logo.complete) checkReady(); else images.current.logo.onload = checkReady;
    if (images.current.sign.complete) checkReady(); else images.current.sign.onload = checkReady;
    if (images.current.pattern.complete) checkReady(); else images.current.pattern.onload = checkReady;
    
  }, [certUser, error]);

  const handleGeneratePDF = () => {
    if (!canvasRef.current) return;
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      pdf.addImage(canvasRef.current, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      pdf.save(`OWASP_CRT_Certificate_${certId}.pdf`);
    } catch (err) {
      alert("Failed to export PDF.");
    }
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
    
    const certUrl = `https://crt.owasp.org/?id=${certId}`;
    const linkedInUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(certName)}&organizationName=OWASP%20Foundation&issueYear=${issueYear}&issueMonth=${issueMonth}&certUrl=${encodeURIComponent(certUrl)}&certId=${encodeURIComponent(certId)}`;
    window.open(linkedInUrl, "_blank");
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 bg-red-500/10 border border-red-500/20 rounded-3xl max-w-lg mx-auto mt-20 backdrop-blur-md">
        <ShieldAlert className="w-16 h-16 text-rose-400 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Certificate Not Found</h2>
        <p className="text-zinc-400 leading-relaxed text-sm">
          We couldn't verify a record for this URL. The link appears to be incomplete or invalid. 
          If you are reviewing a credential, please request the exact link from the candidate.
        </p>
      </div>
    );
  }

  const stats = certUser?.stats || {};
  const currentTier = (certUser?.tier || "BRONZE").toUpperCase();
  let tierColor = "text-indigo-400";
  let tierBg = "bg-indigo-500/10";
  let tierBorder = "border-indigo-500/20";
  
  if (currentTier === "SILVER") { tierColor = "text-blue-400"; tierBg = "bg-blue-500/10"; tierBorder = "border-blue-500/20"; }
  else if (currentTier === "GOLD") { tierColor = "text-pink-400"; tierBg = "bg-pink-500/10"; tierBorder = "border-pink-500/20"; }

  const commits = parseInt(stats.merged_commits || '0', 10);
  let progress = 0;
  let progressText = '';
  let nextTierColor = '';

  if (currentTier === "BRONZE") {
    const target = 10;
    progress = Math.min((commits / target) * 100, 100);
    progressText = commits >= target ? "Ready for Silver!" : `${target - commits} commits to Silver`;
    nextTierColor = "text-blue-400";
  } else if (currentTier === "SILVER") {
    const target = 50;
    progress = Math.min((commits / target) * 100, 100);
    progressText = commits >= target ? "Ready for Gold!" : `${target - commits} commits to Gold`;
    nextTierColor = "text-pink-400";
  } else {
    progress = 100;
    progressText = "Highest Tier Achieved";
    nextTierColor = "text-yellow-400"; 
  }

  return (
    <div className="w-full max-w-7xl mx-auto my-auto animate-fade-in py-8 md:py-12 relative">
      
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

      <div className="w-full flex flex-col-reverse lg:flex-row gap-12 lg:gap-16 items-center relative">
        
        {/* LEFT COLUMN */}
        <div className="w-full lg:w-5/12 flex flex-col gap-6 lg:gap-8 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] sm:text-xs font-semibold mb-4 lg:mb-6 tracking-wide shadow-sm">
              <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Identity Verified
            </div>
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
                      <span key={repo} className="px-3 py-1.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-xs font-semibold text-white/80 shadow-[0_4px_12px_rgba(0,0,0,0.1)] flex items-center gap-1.5 hover:bg-white/[0.06] transition-colors cursor-default">
                        <Github className="w-3.5 h-3.5 text-zinc-400" /> {repo}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.3)] rounded-2xl p-5 animate-[slideUp_0.5s_ease-out_0.4s_forwards] opacity-0 mt-1">
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <span className="text-zinc-400 text-[11px] font-bold tracking-widest uppercase block mb-1 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5" /> Level Progress
                    </span>
                  </div>
                  <span className={`text-xl font-bold drop-shadow-md`}>{Math.round(progress)}%</span>
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

          <div className="flex flex-col sm:flex-row gap-3 animate-[slideUp_0.5s_ease-out_0.5s_forwards] opacity-0 mt-4">
            <button onClick={handleGeneratePDF} className="flex-1 py-3.5 px-5 rounded-xl bg-white/90 text-black text-xs sm:text-sm font-bold hover:bg-white transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] hover:-translate-y-0.5">
              <Download className="w-4 h-4 sm:w-5 sm:h-5" /> Export PDF
            </button>
            <button onClick={handleAddToLinkedIn} className="flex-1 py-3.5 px-5 rounded-xl bg-[#0077b5]/20 hover:bg-[#0077b5]/30 border border-[#0077b5]/40 text-[#00a0dc] text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 shadow-sm">
              <Linkedin className="w-4 h-4 sm:w-5 sm:h-5" /> LinkedIn
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="w-full lg:w-7/12 flex items-center justify-center relative z-10 animate-[slideUp_0.5s_ease-out_0.1s_forwards] opacity-0">
          <canvas ref={canvasRef} id="cert-canvas" className="hidden" width="2480" height="3508" />
          
          {previewImage ? (
            <div 
              className="relative mx-auto rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.8)] border border-white/10 group transition-transform duration-500 hover:scale-[1.02] cursor-pointer w-full max-w-[340px] sm:max-w-[400px] lg:max-w-none lg:w-auto lg:h-[72vh] aspect-[1/1.414]"
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
            <div className="w-full max-w-[340px] sm:max-w-[400px] lg:max-w-none lg:w-auto lg:h-[72vh] aspect-[1/1.414] rounded-xl sm:rounded-2xl border border-white/[0.05] bg-white/[0.02] backdrop-blur-md flex flex-col items-center justify-center text-indigo-400 gap-3 sm:gap-4 shadow-2xl mx-auto">
               <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin opacity-80" />
               <p className="text-xs sm:text-sm tracking-widest uppercase font-bold text-indigo-300/80 drop-shadow-sm px-4 text-center">Rendering Matrix Canvas...</p>
            </div>
          )}
        </div>
      </div>

      {/* Deep Glass Modal Viewer */}
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
              className="absolute -top-12 right-0 md:-top-16 md:-right-12 text-white/50 hover:text-white bg-white/[0.05] hover:bg-white/[0.15] border border-white/10 rounded-full p-2.5 md:p-3 backdrop-blur-xl transition-all duration-300 hover:scale-110 hover:rotate-90 shadow-xl"
              onClick={() => setIsEnlarged(false)}
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

const StatCard = ({ title, value, icon: Icon, color, bg, border }) => (
  <div className={`bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.3)] rounded-xl sm:rounded-2xl p-4 sm:p-5 flex flex-col gap-2 sm:gap-3 transition-colors duration-300`}>
    <div className="flex justify-between items-start">
      <span className="text-zinc-400 text-[10px] sm:text-[11px] font-bold tracking-widest uppercase">{title}</span>
      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center ${bg} ${border} border shadow-inner`}>
        <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${color}`} />
      </div>
    </div>
    <div className="text-2xl sm:text-3xl font-bold text-white drop-shadow-sm">{value}</div>
  </div>
);

export default CertificateView;