import React from 'react';

const SystemGuide = () => {
  return (
    <div className="p-[15px] md:p-[30px] font-['Fira_Code',monospace] text-[12px] md:text-[14px] leading-[1.8] text-slate-400 h-full overflow-y-auto rounded-b-[9px]">
      <h3 className="text-emerald-500 text-lg mb-2.5">
        &gt; WELCOME TO OWASP-CRT Workspace
      </h3>
      <p>
        Authorized workspace. Tools loaded for identity provisioning, verification, and certificate extraction.
      </p>
      
      <h4 className="text-[#9d4edd] mt-6 mb-1 text-[14px]">
        [ SYSTEM WORKFLOW ]
      </h4>
      <ul className="mt-4 text-slate-300 text-[13px] leading-loose [&>li]:before:content-['>'] [&>li]:before:text-[#9d4edd] [&>li]:before:mr-2 [&>li]:before:font-bold">
        <li>Read your initial briefing in <b>Letter_of_Appreciation</b>.</li>
        <li>Execute <b>CRT_Gen.sh</b> to initialize your identity request via terminal.</li>
        <li>Provide your exact First and Last name into the terminal prompt.</li>
        <li>The system will redirect you to GitHub to open an official issue.</li>
        <li>Once approved by the team, you will receive a secure link containing your unique <b>?id=</b> parameter.</li>
        <li className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">Open <b>Export_PDF.exe</b> (Double-click on PC, Tap on mobile) to download a high-resolution A4 copy of your credential.</li>
      </ul>
      <br />
      <p className="text-slate-500 text-xs">
        &gt; Status: System ready. Awaiting user input...
      </p>
    </div>
  );
};

export default SystemGuide;