import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AccessibilityProvider } from './contexts/AccessibilityContext'
import Dashboard from './pages/Dashboard'
import './index.css'

const MockAuthProvider = ({ children }) => {
  const mockAuthValue = {
    user: {
      id: '76230fc3-d85b-4c37-87c6-af2fec91d8e5',
      email: 'admin@demo.com'
    },
    profile: {
      id: '76230fc3-d85b-4c37-87c6-af2fec91d8e5',
      email: 'admin@demo.com',
      full_name: 'Admin User',
      role: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    loading: false,
    dbError: null,
    signUp: async () => ({ data: null, error: null }),
    signIn: async () => ({ data: null, error: null }),
    signOut: async () => ({ error: null }),
    isAdmin: () => true,
    isEditor: () => true,
    isViewer: () => true,
    refreshProfile: () => Promise.resolve()
  };

  return (
    <div>
      {typeof children === 'function' ? children(mockAuthValue) : children}
    </div>
  );
};

const AuthContext = React.createContext({});
const useAuth = () => {
  return {
    user: {
      id: '76230fc3-d85b-4c37-87c6-af2fec91d8e5',
      email: 'admin@demo.com'
    },
    profile: {
      id: '76230fc3-d85b-4c37-87c6-af2fec91d8e5',
      email: 'admin@demo.com',
      full_name: 'Admin User',
      role: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    loading: false,
    dbError: null,
    signUp: async () => ({ data: null, error: null }),
    signIn: async () => ({ data: null, error: null }),
    signOut: async () => ({ error: null }),
    isAdmin: () => true,
    isEditor: () => true,
    isViewer: () => true,
    refreshProfile: () => Promise.resolve()
  };
};

window.useAuth = useAuth;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AccessibilityProvider>
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    </AccessibilityProvider>
  </StrictMode>,
)
