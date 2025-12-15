# NTCC CMA - Demo Accounts

## Test Accounts for All Roles

Your NTCC CMA application is now fully configured with working database tables and demo accounts. Use these credentials to test all functionality:

---

## 🔑 Admin Account
**Full Access - Can manage everything**

- **Email:** `admin@ntcc-cma.demo`
- **Password:** `Admin@123`
- **Role:** Administrator

### Admin Capabilities:
- ✅ View all songs and reports
- ✅ Add, edit, and delete songs
- ✅ Manage usage history
- ✅ View and manage all users
- ✅ Access user management dashboard
- ✅ Delete practice history records
- ✅ Full system access

---

## ✏️ Editor Account
**Can manage songs and content**

- **Email:** `editor@ntcc-cma.demo`
- **Password:** `Editor@123`
- **Role:** Editor

### Editor Capabilities:
- ✅ View all songs and reports
- ✅ Add and edit songs
- ✅ Add usage history records
- ✅ Add practice sessions
- ✅ View own profile
- ❌ Cannot delete songs
- ❌ Cannot manage users
- ❌ Cannot access admin features

---

## 👀 Viewer Account
**Read-only access**

- **Email:** `viewer@ntcc-cma.demo`
- **Password:** `Viewer@123`
- **Role:** Viewer

### Viewer Capabilities:
- ✅ View all songs
- ✅ View reports and statistics
- ✅ View practice history
- ✅ View usage history
- ✅ View own profile
- ❌ Cannot add or edit songs
- ❌ Cannot add usage records
- ❌ Cannot manage users
- ❌ Cannot delete anything

---

## 📊 Sample Data Included

The database includes **3 sample songs** to test with:

1. **Amazing Grace** - John Newton (Key: G)
2. **How Great Thou Art** - Carl Boberg (Key: D)
3. **Blessed Assurance** - Fanny Crosby (Key: C)

---

## 🗄️ Database Status

✅ **All tables are working:**
- `profiles` - User profiles with role-based access
- `songs` - Song library with full metadata
- `practice_history` - Practice session tracking
- `usage_history` - Service usage tracking

✅ **Row Level Security (RLS) enabled:**
- Admin users have full access
- Editors can manage content
- Viewers have read-only access
- All policies are properly configured

✅ **Automatic triggers configured:**
- Profile creation on user signup
- Updated timestamp management
- Role-based access control

---

## 🚀 Getting Started

1. Navigate to the login page
2. Use any of the demo accounts above
3. Explore the features based on your role
4. Test adding/editing songs (Admin & Editor only)
5. View reports and statistics (All roles)

---

## 🔒 Security Notes

- All passwords are securely hashed using bcrypt
- Row Level Security prevents unauthorized access
- Each role has appropriate permissions
- Demo accounts are for testing only

---

## 🎵 Application Features

- **Song Management** - Full CRUD operations for songs
- **Practice Tracking** - Log practice sessions
- **Usage History** - Track when songs are used in services
- **User Management** - Admin can manage all users
- **Reports & Analytics** - View usage statistics
- **Memorial Page** - Honor legacy members
- **Accessibility Features** - Colorblind modes, language support
- **Responsive Design** - Works on all devices
- **PWA Support** - Install as app on any device

---

## 💡 Tips

- **Admin role** gives you full control to test all features
- **Editor role** is perfect for music directors who manage content
- **Viewer role** is ideal for choir members who need to view songs
- All roles can practice songs and view reports
- Try logging in with different roles to see permission differences

---

**Application Name:** NTCC CMA (Church Music Management)
**Database:** Fully configured with Supabase
**Authentication:** Email/Password with Supabase Auth
**Status:** ✅ Ready to use!
