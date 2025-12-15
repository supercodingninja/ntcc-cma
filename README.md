# The NTCC Music App

A Progressive Web App (PWA) for managing church music, tracking practice sessions, and generating CCLI reports.

## Features

- **User Authentication** - Secure login/signup with email and password
- **Role-Based Access** - Admin, Editor, and Viewer roles with different permissions
- **Song Library** - Track all songs with lyrics, chords, keys, tempo, and more
- **Practice Tracking** - Record when songs are practiced and by whom
- **CCLI Reporting** - Generate monthly reports for copyright compliance
- **Progressive Web App** - Install on any device (mobile, tablet, desktop)
- **Offline Support** - Works with limited connectivity
- **Responsive Design** - Optimized for all screen sizes

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Supabase
Update `.env` with your Supabase credentials:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000`

### 4. Build for Production
```bash
npm run build
```

## Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for complete deployment instructions including:
- Deploying to Netlify (FREE)
- Installing on mobile devices
- WordPress integration options
- Creating admin users

## Technology Stack

- **Frontend**: React 19 + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Routing**: React Router v6
- **Icons**: Lucide React
- **PWA**: Vite PWA Plugin

## Project Structure

```
src/
├── components/     # Reusable components
│   └── Layout.jsx  # Main layout with navigation
├── contexts/       # React contexts
│   └── AuthContext.jsx  # Authentication state management
├── lib/            # Utilities
│   └── supabase.js # Supabase client configuration
├── pages/          # Page components
│   ├── Login.jsx
│   ├── Signup.jsx
│   ├── Dashboard.jsx
│   ├── Songs.jsx
│   ├── SongDetail.jsx
│   ├── AddSong.jsx
│   ├── EditSong.jsx
│   ├── PracticeHistory.jsx
│   ├── Reports.jsx
│   ├── Users.jsx
│   └── Profile.jsx
├── App.jsx         # Main app component with routing
└── main.jsx        # Application entry point
```

## User Roles

**Admin**
- Full access to everything
- Manage users and assign roles
- Generate CCLI reports
- Add, edit, delete songs
- View practice history

**Editor**
- Add and modify songs
- Upload audio files
- Tag songs with themes
- View practice history
- Cannot manage users or access reports

**Viewer**
- Browse song library
- View lyrics and chords
- Mark songs as practiced
- View own practice history
- Read-only access

## Database Schema

The app uses the following Supabase tables:
- `profiles` - User profiles with roles
- `songs` - Song library with all metadata
- `song_themes` - Theme tags for songs
- `key_changes` - Modulations within songs
- `audio_files` - Uploaded audio references
- `practice_history` - Practice session records
- `usage_history` - Song usage for CCLI reporting

All tables have Row Level Security (RLS) enabled.

## Development Status

**Completed:**
- ✅ Authentication system
- ✅ Database schema and RLS policies
- ✅ App structure and routing
- ✅ Navigation and layout
- ✅ Login/Signup pages
- ✅ PWA configuration

**To Be Completed:**
- ⚠️  Song management CRUD operations
- ⚠️  Practice tracking functionality
- ⚠️  CCLI report generation
- ⚠️  User management interface
- ⚠️  File upload for audio
- ⚠️  Search and filter features

## License

Private project for NTCCA church use.

## Support

For questions or issues, contact the development team.
