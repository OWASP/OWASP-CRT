# OWASP-CRT // Frontend Workspace

The official interactive web operating system and certificate viewer interface for the **OWASP Community Recognition Tool (OWASP-CRT)**. 

---

## Architecture & Stack

* **Framework:** React (Vite)
* **Styling:** Tailwind CSS
* **PDF Engine:** jsPDF & HTML5 Canvas
* **QR Generation:** qrcode-generator

---

## Project Structure

```text
front/
├── src/
│   ├── components/
│   │   ├── apps/          # OS Applications (Terminal, CertificateViewer, SystemGuide, etc.)
│   │   ├── DesktopIcons.jsx
│   │   ├── OSWindow.jsx
│   │   └── Taskbar.jsx
│   ├── App.jsx
│   ├── config.js          # Production & Repository Environment Variables
│   ├── index.css
│   └── main.jsx
├── public/                # Static assets, SVG stages, and logos
└── package.json
```

## Local Development

- Install dependencies:

```bash
npm install
```

- Run the development server:

```bash
npm run dev
```

- Build for production:

```bash
npm run build
```
