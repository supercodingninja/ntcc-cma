# NTCC Music App

<!--
  THIS AREA OF CODE IS: Project README Documentation
  
  EXPLANATION: This file serves as the primary documentation for the NTCC Music App
  repository. It explains what the app is, who built it, how to set it up locally,
  the technology stack, deployment instructions, and project structure. GitHub
  renders this file automatically when viewing the repository homepage.
  
  IN OTHER WORDS: This is the instruction manual and introduction that people
  see when they first look at the code on GitHub.
-->

## 🎵 About

**NTCC Music App** is a Worship Platform & Church Music Management System — a personal gift from **Reverend Frederick D. Thomas, Jr.** to **New Testament Christian Churches of America, INC. (NTCCA)**.

Built to serve worship teams, musicians, and church leadership with modern tools for song management, service planning, chord charts, lyrics projection, and multilingual worship support.

---

## 👤 Gifted By

**Reverend Frederick D. Thomas, Jr.**  
NTCC Graham, WA | Class of 2011  
Commissioned 𝒞ℎ𝑎𝑛𝑔𝑒 𝐘𝐨𝐮𝐫 𝒲ℴ𝑟𝑙𝑑

---

## 🚀 Live Deployment

- **Production:** [praises.team](https://praises.team) (Netlify)
- **Repository:** [github.com/supercodingninja/ntcc-cma](https://github.com/supercodingninja/ntcc-cma)

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + Vite |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Backend | Supabase (PostgreSQL + Storage + Auth) |
| Deployment | Netlify |
| PWA | Service Worker + Web App Manifest |

---

## 📦 Getting Started

### Prerequisites
- Node.js 20+
- npm or yarn

### Local Development
```bash
# Clone the repository
git clone https://github.com/supercodingninja/ntcc-cma.git
cd ntcc-cma

# Install dependencies
npm install

# Start development server
npm run dev
The app will be available at http://localhost:5173
￼
📁 Repository Structure
/ntcc-cma/
├── 📄 index.html              # HTML entry point
├── 📜 src/
│   ├── 🎨 App.tsx             # Root React component
│   ├── ⚛️ main.tsx            # React DOM mount
│   ├── 🎨 index.css           # Global styles
│   ├── 📁 components/         # Reusable UI components
│   ├── 📁 contexts/           # React context providers
│   ├── 📁 hooks/              # Custom React hooks
│   ├── 📁 lib/                # Utility libraries (Supabase client)
│   ├── 📁 pages/              # Route-level page components
│   ├── 📁 services/           # API and business logic services
│   └── 📁 types/              # Shared TypeScript types
├── 📁 public/                 # Static assets (icons, manifest)
├── 📁 supabase/               # Database migrations
├── ⚙️ vite.config.ts          # Vite build configuration
├── 🎨 tailwind.config.js      # Tailwind CSS theme
├── 📋 tsconfig.json           # TypeScript configuration
├── 🌐 netlify.toml            # Netlify deployment config
└── 📖 README.md               # This file
Manifest |

---

🎯 Feature Modules
I. Core Worship
 • Multi-Language Worship (47+ languages)
 • AI-Powered Worship Planning
 • Auto-Dubbing across languages
 • Global Worship Platform connectivity
 • Song Database (multilingual hymn/song library)
 • Chord Charts (dynamic generation and transposition)
 • Lyrics Projection (live display for worship services)
 • Set List Builder (drag-and-drop worship set creation)
II. Music & Audio
 • Audio Streaming (high-quality worship audio)
 • Background Tracks (instrumental/minus-one playback)
 • Key Transposition (real-time key change)
 • Tempo Control (adjustable BPM)
 • Loop Sections (repeat specific song sections for practice)
III. Administrative (NTCC-specific)
 • CCLI Reporting (automated copyright licensing)
 • Service Planning (schedule and plan worship services)
 • Team Management (worship team roster and scheduling)
 • Resource Library (sermon notes, media, document storage)
IV. CCLI & Copyright
 • CCLI Number Tracking
 • Usage Reporting
 • Copyright Compliance
 • License Management
V. Mobile-First Design
 • iPad-Optimized (designed for iPad Pro performance)
 • Offline Mode (access songs without internet)
 • Quick Search (fast song lookup by title/artist/lyrics)
 • Favorites (personal song collections per user)
 • Recent History (recently viewed songs)

￼
⚠️ Important Notes
 • SCN Technologies™ and SCN Holdings have NO connection to this application.
 • This app is a personal gift from Reverend Frederick D. Thomas, Jr. to NTCCA.
 • No corporate branding appears anywhere in the app.
 • Supabase credentials are configured via netlify.toml environment variables.
 • Video/audio files are stored in Supabase Storage (not GitHub Releases or Firebase).
￼
📜 License & Copyright
© 2026 NTCC Music App™ | Gifted to New Testament Christian Churches of America, INC.
by 𝑅𝑒𝑣𝑒𝑟𝑒𝑛𝑑 𝐹𝑟𝑒𝑑𝑒𝑟𝑖𝑐𝑘 𝐷. 𝑇ℎ𝑜𝑚𝑎𝑠, 𝐽𝑟., 𝑁𝑇𝐶𝐶 𝐺𝑟𝑎ℎ𝑎𝑚, 𝑊𝐴
Class of 2011, Commissioned 𝒞ℎ𝑎𝑛𝑔𝑒 𝐘𝐨𝐮𝐫 𝒲ℴ𝑟𝑙𝑑

🫱🏿‍🫲🏻 Contributing
This project is a dedicated gift to NTCCA. For questions or suggestions, contact Reverend Frederick D. Thomas, Jr. through NTCC Graham, WA.

---

All three files are above. Copy each one, create the file in your GitHub repo, paste, commit. Done.
