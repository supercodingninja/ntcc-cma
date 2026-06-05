// src/components/AppLayout.tsx
// NTCC Music App — Root Layout Component
// Adapted from Adoración codebase for NTCC Graham Spanish Worship Team
// arr. NTCC Graham Spanish Worship Team

import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  X, 
  Music, 
  Library, 
  Settings, 
  Users, 
  Calendar, 
  Mic2, 
  Lightbulb,
  Wifi,
  WifiOff,
  Church
} from 'lucide-react';
import { useUnityLED } from '../hooks/useUnityLED';
import { useWorshipSession } from '../hooks/useWorshipSession';
import type { Song } from '../types/song';

// ─────────────────────────────────────────────────────────────────────────────
// This Area Of Code Is: Type Definitions
// Explanation: Interface definitions for component props and internal state.
// In Other Words: The "shape" of the data this component expects and tracks.
// ─────────────────────────────────────────────────────────────────────────────

interface AppLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// This Area Of Code Is: Navigation Configuration
// Explanation: Static route definitions for the NTCC Music App sidebar.
// Ordered by worship team workflow: Library → Schedule → Team → Live → Settings.
// In Other Words: The menu buttons and where each one takes you.
// ─────────────────────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  { path: '/library', label: 'Song Library', icon: Library },
  { path: '/schedule', label: 'Service Schedule', icon: Calendar },
  { path: '/team', label: 'Worship Team', icon: Users },
  { path: '/live', label: 'Live Mode', icon: Mic2 },
  { path: '/settings', label: 'Settings', icon: Settings },
];

// ─────────────────────────────────────────────────────────────────────────────
// This Area Of Code Is: Unity LED Status Badge Component
// Explanation: Small inline indicator showing whether the Unity LED hardware
// bridge is connected, disconnected, or in transition. Pulses when active.
// In Other Words: A little light that tells you if the stage lights are talking to the app.
// ─────────────────────────────────────────────────────────────────────────────

const LEDStatusBadge: React.FC = () => {
  const { isConnected, isTransitioning, currentScene } = useUnityLED();

  let statusColor = 'bg-gray-400';
  let statusText = 'Disconnected';
  let pulseClass = '';

  if (isConnected) {
    statusColor = 'bg-emerald-500';
    statusText = currentScene ? `Scene: ${currentScene}` : 'Connected';
    pulseClass = 'animate-pulse';
  } else if (isTransitioning) {
    statusColor = 'bg-amber-400';
    statusText = 'Transitioning...';
    pulseClass = 'animate-pulse';
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm">
      <div className={`w-2 h-2 rounded-full ${statusColor} ${pulseClass}`} />
      <span className="text-xs font-medium text-white/90">{statusText}</span>
      {isConnected ? <Wifi size={14} className="text-emerald-400" /> : <WifiOff size={14} className="text-gray-400" />}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// This Area Of Code Is: Service Context Header
// Explanation: Displays the current worship service information when a session
// is active — date, service type, key/tempo of the current song, and LED status.
// Collapses to a compact bar on scroll.
// In Other Words: The banner at the top showing "Sunday Service — June 2, 2026" and what song is up.
// ─────────────────────────────────────────────────────────────────────────────

const ServiceContextHeader: React.FC = () => {
  const { activeSession, currentSong } = useWorshipSession();
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsCompact(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!activeSession) return null;

  return (
    <div
      className={`sticky top-0 z-40 transition-all duration-300 ${
        isCompact 
          ? 'py-2 bg-slate-900/95 backdrop-blur-md border-b border-white/10' 
          : 'py-4 bg-gradient-to-r from-indigo-900/90 via-purple-900/90 to-slate-900/90 backdrop-blur-xl'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Church size={isCompact ? 18 : 24} className="text-amber-400" />
          <div>
            <h2 className={`font-semibold text-white transition-all ${isCompact ? 'text-sm' : 'text-lg'}`}>
              {activeSession.serviceName}
            </h2>
            {!isCompact && (
              <p className="text-sm text-white/60">
                {activeSession.date.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {currentSong && (
            <div className="hidden md:flex items-center gap-3 text-sm text-white/70">
              <Music size={16} />
              <span className="font-medium text-white">{currentSong.title}</span>
              <span className="text-white/40">|</span>
              <span>Key: {currentSong.key}</span>
              <span className="text-white/40">|</span>
              <span>{currentSong.tempo} BPM</span>
            </div>
          )}
          <LEDStatusBadge />
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// This Area Of Code Is: Mobile Navigation Drawer
// Explanation: Slide-out drawer for mobile/tablet viewports. Mirrors the
// desktop sidebar links with touch-friendly tap targets. Closes on route change.
// In Other Words: The hamburger menu that slides in from the left on phones.
// ─────────────────────────────────────────────────────────────────────────────

const MobileDrawer: React.FC<<{
  isOpen: boolean;
  onClose: () => void;
  activePath: string;
  onNavigate: (path: string) => void;
}> = ({ isOpen, onClose, activePath, onNavigate }) => {
  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
        onClick={onClose}
      />
      <aside className="fixed left-0 top-0 h-full w-72 bg-slate-900 border-r border-white/10 z-50 md:hidden transform transition-transform duration-300 ease-out shadow-2xl">
        <div className="p-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Music size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white text-lg leading-tight">NTCC Music</h1>
              <p className="text-xs text-white/50">Graham Spanish Worship</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = activePath === item.path || activePath.startsWith(`${item.path}/`);
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => {
                  onNavigate(item.path);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-400 border border-amber-500/20'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-auto bg-amber-500 text-slate-900 text-xs font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="flex items-center gap-2 text-xs text-white/40">
            <Lightbulb size={14} />
            <span>Unity LED Ready</span>
          </div>
        </div>
      </aside>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// This Area Of Code Is: Desktop Sidebar
// Explanation: Permanent left sidebar for desktop viewports (>768px). Same
// navigation structure as mobile drawer but always visible with hover states.
// In Other Words: The fixed menu on the left side when you're on a computer.
// ─────────────────────────────────────────────────────────────────────────────

const DesktopSidebar: React.FC<<{
  activePath: string;
  onNavigate: (path: string) => void;
}> = ({ activePath, onNavigate }) => {
  return (
    <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-slate-900/80 backdrop-blur-xl border-r border-white/10">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Music size={24} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-xl leading-tight">NTCC Music</h1>
            <p className="text-xs text-white/50">Graham Spanish Worship</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = activePath === item.path || activePath.startsWith(`${item.path}/`);
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all group ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-400 border border-amber-500/20 shadow-sm shadow-amber-500/10'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon 
                size={20} 
                className={`transition-colors ${isActive ? 'text-amber-400' : 'group-hover:text-white'}`} 
              />
              <span className="font-medium">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="ml-auto bg-amber-500 text-slate-900 text-xs font-bold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-3">
        <div className="flex items-center justify-between text-xs text-white/40">
          <div className="flex items-center gap-2">
            <Lightbulb size={14} />
            <span>Unity LED</span>
          </div>
          <LEDStatusBadge />
        </div>
        <p className="text-[10px] text-white/30 text-center">
          © 2026 NTCC Music App | 𝐹𝑟𝑒𝑑𝑒𝑟𝑖𝑐𝑘 𝑇ℎ𝑜𝑚𝑎𝑠,𝑇ℎ𝑒 𝑆𝑢𝑝𝑒𝑟 𝐶𝑜𝑑𝑖𝑛𝑔 𝑁𝑖𝑛𝑗𝑎™ | Made with ❤️ for the global community
        </p>
      </div>
    </aside>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// This Area Of Code Is: Main AppLayout Component
// Explanation: The root layout that composes all sub-components. Manages
// mobile drawer state, active route detection, scroll restoration, and wraps
// all page content in the glassmorphism main container.
// In Other Words: The "boss" component that puts the sidebar, header, and page content together.
// ─────────────────────────────────────────────────────────────────────────────

const AppLayout: React.FC<<AppLayoutProps> = ({ children }) => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const activePath = location.pathname;

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  const handleNavigate = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      {/* Desktop Sidebar — always visible on md+ */}
      <DesktopSidebar activePath={activePath} onNavigate={handleNavigate} />

      {/* Mobile Drawer — conditional render */}
      <MobileDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        activePath={activePath}
        onNavigate={handleNavigate}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Mobile Header Bar */}
        <header className="md:hidden sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Music size={18} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white text-base leading-tight">NTCC Music</h1>
              <p className="text-[10px] text-white/50">Graham Spanish Worship</p>
            </div>
          </div>
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <Menu size={24} />
          </button>
        </header>

        {/* Service Context Header (when worship session active) */}
        <ServiceContextHeader />

        {/* Page Content */}
        <main className="flex-1 relative">
          <div className="max-w-7xl mx-auto px-4 py-6 md:px-8 md:py-8">
            {children}
          </div>
        </main>

        {/* Mobile Footer Spacer (prevents content hiding behind bottom nav if added later) */}
        <div className="md:hidden h-6" />
      </div>
    </div>
  );
};

export default AppLayout;
