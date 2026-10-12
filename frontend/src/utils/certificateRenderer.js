import qrcode from 'qrcode-generator';
import { APP_CONFIG } from '../config';

export const renderCertificateToCanvas = (canvas, certUser, setPreviewImage) => {
  if (!canvas || !certUser) return;
  const ctx = canvas.getContext("2d");
  
  const images = {
    logo: new Image(), sign: new Image(), pattern: new Image()
  };

  images.logo.src = `${APP_CONFIG.assetsPath}/owasp-logo.svg`;
  images.sign.src = `${APP_CONFIG.assetsPath}/sign.svg`;
  
  const currentTier = certUser.tier || "Bronze";
  switch (currentTier) {
    case "Bronze": images.pattern.src = `${APP_CONFIG.assetsPath}/stage-1.svg`; break;
    case "Silver": images.pattern.src = `${APP_CONFIG.assetsPath}/stage-2.svg`; break;
    case "Gold": images.pattern.src = `${APP_CONFIG.assetsPath}/stage-3.svg`; break;
    default: images.pattern.src = `${APP_CONFIG.assetsPath}/stage-1.svg`; break;
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
    const words = text.split(' '); let currentWidth = 0; let lines = 1;
    for (let i = 0; i < words.length; i++) {
      const wordWidth = ctx.measureText(words[i] + ' ').width;
      if (currentWidth + wordWidth <= maxWidth) { currentWidth += wordWidth; } 
      else { lines++; currentWidth = ctx.measureText(words[i] + ' ').width; }
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
    const startX = 190, startY = 3000;

    const isFinder = (row, col) => {
      if (row < 7 && col < 7) return true;
      if (row < 7 && col >= cells - 7) return true;
      if (row >= cells - 7 && col < 7) return true;
      return false;
    };

    for (let row = 0; row < cells; row++) {
      for (let col = 0; col < cells; col++) {
        if (qr.isDark(row, col) && !isFinder(row, col)) {
          const x = startX + col * cs; const y = startY + row * cs;
          ctx.fillStyle = color; ctx.beginPath();
          ctx.arc(x + cs / 2, y + cs / 2, (cs-1) / 2.2, 0, Math.PI * 2); ctx.fill();
        }
      }
    }

    const drawFinder = (offsetX, offsetY, type) => {
      const x = startX + offsetX * cs; const y = startY + offsetY * cs;
      let rOut = 2.5 * cs; let rMid = 1.5 * cs; let rIn = 0.8 * cs; let sh = 0.3 * cs;
      let radiiOut, radiiMid, radiiIn;
      
      if (type === 'TL') { radiiOut = [rOut, rOut, sh, rOut]; radiiMid = [rMid, rMid, sh, rMid]; radiiIn  = [rIn, rIn, sh, rIn]; } 
      else if (type === 'TR') { radiiOut = [rOut, rOut, rOut, sh]; radiiMid = [rMid, rMid, rMid, sh]; radiiIn  = [rIn, rIn, rIn, sh]; } 
      else if (type === 'BL') { radiiOut = [rOut, sh, rOut, rOut]; radiiMid = [rMid, sh, rMid, rMid]; radiiIn  = [rIn, sh, rIn, rIn]; }
      
      const drawPoly = (rArray, sizeCells, inset) => {
         const px = x + inset * cs; const py = y + inset * cs; const w = sizeCells * cs;
         ctx.beginPath();
         if (ctx.roundRect) { ctx.roundRect(px, py, w, w, rArray); } else { ctx.rect(px, py, w, w); }
         ctx.fill();
      };
      ctx.fillStyle = color; drawPoly(radiiOut, 7, 0);
      ctx.fillStyle = "#171c24"; drawPoly(radiiMid, 5, 1);
      ctx.fillStyle = color; drawPoly(radiiIn, 3, 2);
    };

    drawFinder(0, 0, 'TL'); drawFinder(cells - 7, 0, 'TR'); drawFinder(0, cells - 7, 'BL');

    const centerX = startX + size / 2; const centerY = startY + size / 2; const bgRadius = size * 0.16; 
    ctx.fillStyle = "#171c24"; ctx.beginPath(); ctx.arc(centerX, centerY, bgRadius, 0, Math.PI * 2); ctx.fill();

    const svgPath = "M2.11,226.22c-.58.97-2.06.61-2.09-.52-.2-8.25.95-26.52,15.68-29.88,13.27-3.03,9.12-13.47,15.42-28.67,6.72-16.2,25.56-24.83,35.64-25.72,24-2.12,30.62,22.37,30.61,29.15-.02,24.04-14.65,43.29-28.98,34.48-7.79-4.79,1.21-13.16,6.44-21.33,6.05-9.45-1.42-22.02-11.64-21.12-14.99,1.32-17.76,18.01-18.36,28.71-.73,13.16-10.97,22.99-24.82,21.03-7.96-1.12-12.64,5.04-17.91,13.87ZM6.59,237.36s18.28,14.66,32,4.81c5.37-3.85,11.95-6.17,18.04-3.63,8.81,3.67,28.62,9.27,43.93.56,36.62-20.83,14.18-58.22,30.47-62.78,4.28-1.2,9.83-6.12,8.5-12.39-1.62-7.7-12.33-11.08-21.67-3.94-17.33,13.25,1.89,28.81-16.72,52.96-6.11,7.93-18.28,20.12-37.78,8.84-15.46-8.94-27.26-2.71-31.41,4.33-7.52,12.76-20.51,9.8-24.26,9.3-3.75-.5-1.12,1.94-1.12,1.94ZM121.09,24.31c-8.62,11.02-5.23,24.8,5.8,32.01,8.97,5.87,20.95,16.15,15.68,30.25-4.4,11.78-17.66,12.39-22.82,2.42-4.46-8.61-8.5-23.49-16.54-19.14-14.79,8-5.43,30.29,15.38,42.34,5.87,3.4,30.38,9.9,40.55-11.94,4.27-9.17,6.21-29.8-4.46-43.72-10.01-13.06-21.13-14.69-17.12-27.69,4.45-14.43-10.79-24.56-18.04-28.52-.99-.54-2.05.56-1.5,1.55,5.01,8.98,8.01,16.12,3.06,22.44ZM106.14.18s-21.83,8.5-20.17,25.31c.65,6.57-.63,13.43-5.88,17.44-7.58,5.79-22.34,20.15-22.45,37.77-.27,42.13,43.33,41.39,39.13,57.78-1.1,4.3.39,11.57,6.48,13.56,7.48,2.44,15.75-5.14,14.24-16.79-2.81-21.63-25.89-12.77-37.5-40.96-3.81-9.26-8.28-25.89,11.23-37.14,15.47-8.92,15.98-22.26,11.96-29.37-7.29-12.9,1.76-22.66,4.08-25.66,2.31-3-1.13-1.94-1.13-1.94ZM234.18,207.3c-5.23-12.98-18.86-16.93-30.62-10.98-9.57,4.83-24.95,10.45-34.04-1.54-6.04-7.97-.44-20.51,10.78-20,9.69.44,23.13,3.41,23.39-5.73.46-16.81-23.52-19.85-44.35-7.85-5.87,3.38-23.77,21.36-9.94,41.09,5.81,8.28,22.71,20.28,40.09,18,16.32-2.14,23.28-10.96,32.54-.98,10.27,11.07,26.67,2.94,33.72-1.36.97-.59.54-2.05-.59-2.07-10.28-.15-17.96-1.12-20.97-8.57ZM262.56,206.42s3.55-23.16-11.84-30.12c-6.02-2.72-11.32-7.26-12.16-13.81-1.23-9.47-6.29-29.42-21.48-38.33-36.35-21.3-57.51,16.83-69.6,5-3.17-3.1-10.21-5.45-14.98-1.17-5.86,5.26-3.43,16.21,7.42,20.73,20.14,8.39,24-16.04,54.22-12,9.92,1.33,26.56,5.77,26.55,28.3,0,17.86,11.28,24.97,19.45,25.04,14.81.14,18.74,12.86,20.18,16.36s2.24,0,2.24,0Z";
    const svgWidth = 262.91, svgHeight = 245.57; const targetLogoSize = bgRadius * 1.4; 
    const scale = targetLogoSize / Math.max(svgWidth, svgHeight);
    const offsetX = 0.01 * size, offsetY = -0.02 * size;
    const translateX = centerX - (svgWidth * scale) / 2 + offsetX; const translateY = centerY - (svgHeight * scale) / 2 + offsetY;
    
    const basePath = new Path2D(svgPath);
    const m = new DOMMatrix().translate(translateX, translateY).scale(scale, scale);
    const transformedPath = new Path2D(); transformedPath.addPath(basePath, m);
    ctx.fillStyle = color; ctx.fill(transformedPath);
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
      case "Silver": certText = "Awarded for your relentless execution and profound expertise. Your sustained contributions stand as a vital pillar of OWASP projects. This certificate recognizes an outstanding professional who actively architects the future of security standards."; break;
      case "Gold": certText = "The pinnacle of recognition for a true visionary. Your elite contributions have forged an indelible legacy within the OWASP ecosystem, shielding millions worldwide. This certificate honors your ultimate standing as a pioneer at the absolute forefront of global cybersecurity."; break;
      case "Bronze": default: certText = "This certificate marks your official entry into the OWASP global ecosystem. Your initiative strengthens our collective defenses against relentless threats. We honor your commitment and welcome you to the frontline of cybersecurity."; break;
    }
    
    ctx.font = "200 62px 'Inter'";
    const textLines = calculateLines(ctx, certText, 2100);
    const startY = 1840, lineHeight = 95, paddingBottom = 10;
    const dynamicRepoY = startY + (textLines * lineHeight) + paddingBottom;
    
    ctx.globalAlpha = 0.45;
    if (images.pattern.complete && images.pattern.naturalWidth !== 0) ctx.drawImage(images.pattern, 0, 0, 2480, 3508);
    
    ctx.globalAlpha = 1;
    if (images.sign.complete) ctx.drawImage(images.sign, 300, 2460, 440, 290);
    
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillStyle = g; ctx.fillRect(0, 0, 2480, 3508);
    
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = "#171c24"; ctx.fillRect(0, 0, 2480, 3508);
    
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = g; ctx.strokeStyle = g; ctx.lineWidth = 4;
    
    ctx.beginPath();
    const radius = 60, bx = 460, by = 1000, bw = 1070, bh = 120;
    ctx.moveTo(bx + radius, by); ctx.lineTo(bx + bw - radius, by); ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + radius);
    ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - radius, by + bh); ctx.lineTo(bx + radius, by + bh);
    ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - radius); ctx.quadraticCurveTo(bx, by, bx + radius, by); ctx.closePath();
    
    ctx.stroke(); ctx.globalAlpha = 0.1; ctx.fill(); ctx.globalAlpha = 1;
    
    ctx.font = "400 65px 'Inter'";
    let certYear = new Date().getFullYear();
    if (certUser.stats?.first_commit_date) certYear = certUser.stats.first_commit_date.split('-')[0];
    else if (certUser.first_commit) certYear = certUser.first_commit;
    const certIdText = `CRT-OWASP-${certUser.id || "000"} : ${certYear}`;
    const idWidth = ctx.measureText(certIdText).width;
    ctx.fillText(certIdText, bx + (bw - idWidth) / 2, 1082);
    
    const displayName = certUser.real_name ? capitalizeRegex(certUser.real_name) : (certUser.user || "UNKNOWN");
    const nameFontSize = getResponsiveFontSize(ctx, displayName, "Anton", 260, 2100);
    ctx.font = `400 ${nameFontSize}px 'Anton'`; ctx.fillText(displayName, 190, 1680);
    
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
    
    let tierTitleLeft = "", tierTitleRight = "// OFFICIALLY RECOGNIZED";
    switch (currentTier) {
      case "Silver": tierTitleLeft = "// ADVANCED CONTRIBUTOR"; break;
      case "Gold": tierTitleLeft = "// ELITE CONTRIBUTOR"; break;
      case "Bronze": default: tierTitleLeft = "// VERIFIED CONTRIBUTOR"; break;
    }
    
    ctx.fillStyle = g; ctx.font = "400 62px 'Inter'"; ctx.fillText(`${tierTitleLeft}      ${tierTitleRight}`, 190, 1250);
    
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)"; ctx.font = "200 62px 'Inter'";
    drawJustifiedText(ctx, certText, 190, startY, 2100, lineHeight);
    
    if (images.logo.complete) {
      const tempCanvas = document.createElement('canvas');
      const tWidth = images.logo.naturalWidth || 483; const tHeight = images.logo.naturalHeight || 145;
      tempCanvas.width = tWidth; tempCanvas.height = tHeight;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(images.logo, 0, 0, tWidth, tHeight);
      tempCtx.globalCompositeOperation = 'source-in'; tempCtx.fillStyle = '#FFFFFF'; tempCtx.fillRect(0, 0, tWidth, tHeight);
      ctx.drawImage(tempCanvas, 330, 415, 483, 145);
    }
    
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        setPreviewImage(url);
      }
    }, 'image/jpeg', 0.85); 
  };

  let loadedImages = 0; const totalImages = 3;
  const checkReady = () => {
    loadedImages++;
    if (loadedImages === totalImages) {
      Promise.all([
        document.fonts.load('400 260px "Anton"'), document.fonts.load('200 62px "Inter"'),
        document.fonts.load('300 70px "Inter"'), document.fonts.load('italic 400 60px "Inter"'),
        document.fonts.load('400 65px "Inter"'), document.fonts.load('bold 90px "Montserrat"'),
        document.fonts.load('400 50px "Inter"'), document.fonts.load('bold 200px "Cascadia Mono"'),
        document.fonts.load('400 100px "Cascadia Code"')
      ]).then(() => {
        document.fonts.ready.then(() => { setTimeout(() => { renderCertificate(); }, 250); });
      }).catch((e) => { setTimeout(() => renderCertificate(), 250); });
    }
  };

  if (images.logo.complete) checkReady(); else images.logo.onload = checkReady;
  if (images.sign.complete) checkReady(); else images.sign.onload = checkReady;
  if (images.pattern.complete) checkReady(); else images.pattern.onload = checkReady;
};