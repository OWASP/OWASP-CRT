import React, { useEffect, useState, useRef } from 'react';

const LetterOfAppreciation = ({ startTyping }) => {
  const [content, setContent] = useState('');
  const hasTyped = useRef(false);

  useEffect(() => {
    if (!startTyping || hasTyped.current) return;
    hasTyped.current = true;

    const letterLines = [
        "<span class='text-[#4a7bfe] font-bold tracking-widest'>&gt;_ OWASP-CRT // CONTRIBUTOR_RECOGNITION</span><br>",
        "Security in the open-source ecosystem is no accident;",
        "it is the result of the skill and precision of <span class='text-[#9d4edd] font-bold drop-shadow-[0_0_10px_rgba(157,78,221,0.3)]'>professionals</span> who resolve vulnerabilities and elevate standards.",
        "Your contributions to OWASP projects have directly fortified the stability of this ecosystem.",
        "We value your expertise and real impact, and we officially recognize it.",
        "<br><span class='text-slate-500'>-- OWASP-CRT Project Leader</span>",
        "<br>&gt; Execute CRT_Gen.sh to issue your verified credential."
    ];

    let currentLine = 0; let currentChar = 0; let isTag = false; let tagBuffer = '';
    let currentHTML = '';
    let timer;

    const type = () => {
      if (currentLine < letterLines.length) {
        let lineStr = letterLines[currentLine];
        if (currentChar < lineStr.length) {
          let char = lineStr.charAt(currentChar);
          if (char === '<') isTag = true;
          if (isTag) {
            tagBuffer += char;
            if (char === '>') {
              isTag = false; currentHTML += tagBuffer; setContent(currentHTML); tagBuffer = '';
            }
            currentChar++; timer = setTimeout(type, 0); 
          } else {
            currentHTML += char; setContent(currentHTML); currentChar++; timer = setTimeout(type, 30);
          }
        } else {
          currentHTML += '<br>'; setContent(currentHTML); currentLine++; currentChar = 0; timer = setTimeout(type, 500);
        }
      }
    };
    
    timer = setTimeout(type, 500);
    return () => clearTimeout(timer);
  }, [startTyping]);

  return (
    <div className="p-[15px] md:p-[30px] font-['Fira_Code',monospace] text-[12px] md:text-[14px] leading-[1.8] text-slate-400 h-full overflow-y-auto rounded-b-[9px]">
      <span dangerouslySetInnerHTML={{ __html: content }}></span>
      {startTyping && <span className="inline-block w-2 h-4 bg-[#9d4edd] align-middle ml-1 animate-pulse"></span>}
    </div>
  );
};

export default LetterOfAppreciation;