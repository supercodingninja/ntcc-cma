# NTCC CMA - Complete Application Documentation

## 📋 Application Overview

**The NTCC Music App** is a comprehensive church music management application designed for the NTCC CMA (Church Music Administration) church community. It helps manage songs, track practice sessions, coordinate musicians, and provides AI-powered assistance for music education and administration.

**Live Website:** https://praises.team
**GitHub Repository:** https://github.com/supercodingninja/ntcc-cma
**Deployment Platform:** Netlify (auto-deploys from main branch)

---

## 🎯 Core Features

### 1. **Song Management**
- Browse and search through the church's song library
- Add new songs with details (title, artist, key, tempo, notes)
- Edit existing songs (Editors and Admins only)
- Upload and attach files (sheet music PDFs, audio files, chord charts)
- View detailed song information including attachments

### 2. **Practice Tracking**
- Log practice sessions for individual songs
- Track duration, quality rating, and notes for each session
- View practice history with filtering and search
- Generate reports on practice statistics

### 3. **User Management** (Admin only)
- View all registered users
- Manage user roles (Viewer, Editor, Admin)
- Track user activity and permissions

### 4. **Memorial Page**
- Dedicated memorial page for John Orkin Smith (December 17, 1969 - November 8, 2022)
- Tribute to church music ministry members
- Beautiful animated musical staff design

### 5. **Leadership Board**
- Display church leadership and music team members
- Photo gallery of team members
- Contact information and roles

---

## 🤖 AI Assistant Tools

The app features **three specialized AI assistants** accessible from the Dashboard:

### 1. **JP - Task Management AI** 🎯
**Purpose:** Project management and task organization
**Who It's For:** Admins and Editors managing church music projects
**Features:**
- Break down projects into tasks
- Generate action items
- Provide productivity advice
- Help with scheduling and planning
**Access:** Click "JP Tasks" button on Dashboard
**Technology:** Custom AI service (mock implementation using pattern matching)
**File:** `src/components/AI/JPPromptWindow.jsx`, `src/services/jp-ai-service.js`

### 2. **Tanya - Design Assistant AI** 🎨
**Purpose:** UI/UX design and visual guidance
**Who It's For:** Anyone needing help with app navigation or design questions
**Features:**
- Answer questions about the app interface
- Provide design suggestions
- Explain how to use features
- Offer visual guidance
**Access:** Click "Tanya Design" button on Dashboard
**Technology:** Custom AI service (mock implementation using pattern matching)
**File:** `src/components/AI/TanyaDesignTool.jsx`, `src/services/tanya-ai-service.js`

### 3. **Vickie - Music Education AI** 🎵
**Purpose:** Music theory and education assistance
**Who It's For:** All users learning music theory, reading sheet music, or understanding the app
**Features:**
- Answer music theory questions
- Explain how to read sheet music
- Teach musical concepts
- Provide app usage help
- Voice recognition for hands-free interaction
**Access:** Click "Vickie Music" button on Dashboard
**Technology:** Custom AI service with voice recognition
**File:** `src/components/AI/VickieMusicAssistant.jsx`, `src/services/vickie-ai-service.js`

**AI Implementation Note:** All AI assistants currently use **mock implementations** with pattern matching. They do NOT use external APIs (OpenAI, Claude, etc.) to keep the app **100% FREE**. They provide intelligent responses based on keyword detection and predefined answer templates.

---

## 👥 Demo Accounts & User Roles

### User Roles

#### 1. **Viewer** (Default)
- Can browse songs
- Can view song details
- Can log practice sessions
- Can view their own practice history
- **Cannot:** Add/edit songs, manage users

#### 2. **Editor**
- All Viewer permissions PLUS:
- Can add new songs
- Can edit existing songs
- Can upload files to songs
- **Cannot:** Manage users or change roles

#### 3. **Admin**
- All Editor permissions PLUS:
- Can manage users
- Can change user roles
- Can access admin reports
- Full system access

### Demo Account Credentials

**Note:** Demo accounts are created via database migration. Here's how to create a test account:

**Creating New Account:**
1. Go to https://praises.team/signup
2. Enter any email (e.g., test@example.com)
3. Enter a password (minimum 6 characters)
4. Click "Sign Up"

**Default Demo Accounts (if created in database):**
- **Admin Account:**
  - Email: admin@ntcc-cma.com
  - Password: admin123
  - Role: Admin

- **Editor Account:**
  - Email: editor@ntcc-cma.com
  - Password: editor123
  - Role: Editor

- **Viewer Account:**
  - Email: viewer@ntcc-cma.com
  - Password: viewer123
  - Role: Viewer

---

## 🛠️ Technical Stack

### Frontend Framework
- **React 19.2.0** - UI library
- **React Router DOM 7.9.5** - Navigation and routing
- **Vite 7.2.4** - Build tool and dev server

### Styling
- **Tailwind CSS 3.4.18** - Utility-first CSS framework
- **PostCSS** - CSS processing
- **Custom gradients and animations** - Premium design elements

### Backend & Database
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication (email/password)
  - Row Level Security (RLS)
  - Real-time subscriptions
  - File storage
- **Supabase JS Client 2.81.1** - JavaScript SDK

### UI Components
- **Lucide React 0.553.0** - Icon library
- Custom reusable components (Layout, ErrorBoundary, FileUploadManager)

### File Handling
- **react-pdf 10.2.0** - PDF viewer
- **pdfjs-dist 5.4.394** - PDF.js library
- **xlsx 0.18.5** - Excel file handling

### Accessibility
- **Custom Accessibility Context** - Multi-language support (English, Spanish, Korean)
- **Text-to-speech integration** - Screen reader support
- **High contrast modes** - Visual accessibility
- **Voice recognition** - Hands-free interaction

### Deployment
- **Netlify** - Hosting and continuous deployment
- **GitHub** - Version control
- **Custom domain:** praises.team

---

## 📁 Project Structure

```
project/
├── src/
│   ├── components/          # Reusable components
│   │   ├── AI/             # AI assistant components
│   │   │   ├── JPPromptWindow.jsx
│   │   │   ├── TanyaDesignTool.jsx
│   │   │   └── VickieMusicAssistant.jsx
│   │   ├── AccessibilityMenu.jsx
│   │   ├── ErrorBoundary.jsx
│   │   ├── FileUploadManager.jsx
│   │   └── Layout.jsx
│   ├── contexts/           # React contexts
│   │   ├── AccessibilityContext.jsx
│   │   └── AuthContext.jsx
│   ├── hooks/              # Custom React hooks
│   │   └── useVoiceRecognition.js
│   ├── lib/                # Core libraries
│   │   ├── i18n.js         # Internationalization
│   │   └── supabase.js     # Supabase client
│   ├── pages/              # Page components
│   │   ├── AddSong.jsx
│   │   ├── Dashboard.jsx
│   │   ├── EditSong.jsx
│   │   ├── Leadership.jsx
│   │   ├── Login.jsx
│   │   ├── Memorial.jsx
│   │   ├── Practice.jsx
│   │   ├── PracticeHistory.jsx
│   │   ├── Profile.jsx
│   │   ├── Reports.jsx
│   │   ├── Signup.jsx
│   │   ├── SongDetail.jsx
│   │   ├── Songs.jsx
│   │   └── Users.jsx
│   ├── services/           # Business logic services
│   │   ├── jp-ai-service.js
│   │   ├── tanya-ai-service.js
│   │   └── vickie-ai-service.js
│   ├── utils/              # Utility functions
│   │   ├── file-upload.js
│   │   └── text-to-speech.js
│   ├── App.jsx             # Main app component
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles
├── supabase/
│   └── migrations/         # Database migrations
├── public/                 # Static assets
├── dist/                   # Build output
├── package.json            # Dependencies
├── vite.config.js         # Vite configuration
├── tailwind.config.js     # Tailwind configuration
└── netlify.toml           # Netlify configuration
```

---

## 🗄️ Database Schema

### Tables

#### 1. **profiles**
Stores user profile information
- `id` (uuid, PK) - Links to auth.users
- `email` (text) - User email
- `full_name` (text) - User's full name
- `role` (text) - User role: 'viewer', 'editor', 'admin'
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### 2. **songs**
Stores song information
- `id` (uuid, PK)
- `title` (text) - Song title
- `artist` (text) - Artist/composer
- `key` (text) - Musical key
- `tempo` (text) - Tempo/BPM
- `notes` (text) - Additional notes
- `created_by` (uuid, FK) - References profiles
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### 3. **song_files**
Stores file attachments for songs
- `id` (uuid, PK)
- `song_id` (uuid, FK) - References songs
- `file_name` (text) - Original filename
- `file_path` (text) - Storage path
- `file_type` (text) - MIME type
- `file_size` (integer) - Size in bytes
- `uploaded_by` (uuid, FK) - References profiles
- `created_at` (timestamp)

#### 4. **practice_sessions**
Tracks practice sessions
- `id` (uuid, PK)
- `song_id` (uuid, FK) - References songs
- `user_id` (uuid, FK) - References profiles
- `duration_minutes` (integer) - Practice duration
- `quality_rating` (integer) - 1-5 rating
- `notes` (text) - Session notes
- `practiced_at` (timestamp) - When practiced
- `created_at` (timestamp)

### Row Level Security (RLS)

All tables have RLS enabled with policies:
- **SELECT:** Authenticated users can view all data
- **INSERT:** Authenticated users can create records
- **UPDATE:** Users can update their own records; Editors/Admins can update all
- **DELETE:** Admins only

---

## 🌐 Supported Languages

1. **English** (Default)
2. **Spanish** (Español)
3. **Korean** (한국어)

Users can switch languages from the accessibility menu in the header.

---

## 🎨 Design System

### Color Schemes
- **Default:** Blue and purple gradients
- **High Contrast:** Yellow/black for visibility
- **Colorblind Safe:** Teal and amber tones

### Typography
- **Headings:** System font stack (optimized for performance)
- **Body:** Inter, system-ui fallback
- **Memorial Page:** Georgia serif for elegance

### Animations
- Fade-in animations for page loads
- Scale-in for modals
- Pulse animations for recording indicators
- Smooth transitions (200-300ms)

### Gradients
- Premium gradient buttons with hover effects
- Background gradients for cards
- Musical staff animations on Memorial page

---

## 🔒 Security Features

1. **Authentication:** Supabase Auth with email/password
2. **Row Level Security:** Database-level access control
3. **Role-Based Access Control:** Viewer/Editor/Admin roles
4. **Secure file uploads:** Validated file types and sizes
5. **Protected routes:** Login required for all pages except signup
6. **Environment variables:** Sensitive data in .env file

---

## 💰 Cost Structure

**THIS APP IS 100% FREE TO USE**

- **Frontend Hosting:** Netlify (free tier)
- **Backend/Database:** Supabase (free tier)
- **AI Services:** Mock implementations (no API costs)
- **Domain:** praises.team (cost depends on registrar)

**No external API costs:**
- No OpenAI API
- No Claude API
- No speech recognition APIs (uses browser Web Speech API)
- No payment processing

---

## 🚀 Getting Started

### For Users
1. Visit https://praises.team
2. Click "Sign Up" and create an account
3. Log in and explore the Dashboard
4. Try the AI assistants!

### For Developers
1. Clone repository
2. Copy .env.example to .env
3. Add Supabase credentials
4. Run `npm install`
5. Run `npm run dev`
6. Open http://localhost:5173

---

## 📝 Future Enhancements

1. Real AI integration (optional paid feature)
2. Mobile app (React Native)
3. Calendar integration for practice scheduling
4. Video tutorials embedded in app
5. Advanced analytics dashboard
6. Export/import song lists
7. Collaborative practice mode
8. Live streaming integration

---

## 🐛 Known Issues

1. ~~Vickie AI modal close button requires debugging~~ ✅ Fixed
2. ~~Memorial page image import error~~ ⚠️ Needs fix
3. File upload validation needs enhancement
4. Voice recognition requires HTTPS or localhost

---

## 📞 Support

For issues or questions:
- GitHub Issues: https://github.com/supercodingninja/ntcc-cma/issues
- Email: [Your support email]
- Church Contact: NTCC CMA Music Ministry

---

**Last Updated:** December 2, 2024
**Version:** 1.0.0
**Maintained By:** NTCC CMA Development Team
