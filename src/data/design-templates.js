export const colorThemes = {
  default: {
    name: 'Default Theme',
    primary: '#3B82F6',
    secondary: '#8B5CF6',
    accent: '#EC4899',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    background: '#FFFFFF',
    surface: '#F3F4F6',
    text: '#111827'
  },
  ocean: {
    name: 'Ocean Blue',
    primary: '#0EA5E9',
    secondary: '#0284C7',
    accent: '#06B6D4',
    success: '#14B8A6',
    warning: '#F59E0B',
    error: '#EF4444',
    background: '#FFFFFF',
    surface: '#F0F9FF',
    text: '#0C4A6E'
  },
  forest: {
    name: 'Forest Green',
    primary: '#10B981',
    secondary: '#059669',
    accent: '#34D399',
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    background: '#FFFFFF',
    surface: '#F0FDF4',
    text: '#064E3B'
  },
  sunset: {
    name: 'Warm Sunset',
    primary: '#F59E0B',
    secondary: '#EF4444',
    accent: '#F97316',
    success: '#10B981',
    warning: '#FBBF24',
    error: '#DC2626',
    background: '#FFFBEB',
    surface: '#FEF3C7',
    text: '#78350F'
  },
  royal: {
    name: 'Royal Purple',
    primary: '#8B5CF6',
    secondary: '#7C3AED',
    accent: '#A78BFA',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    background: '#FFFFFF',
    surface: '#F5F3FF',
    text: '#4C1D95'
  },
  monochrome: {
    name: 'Monochrome',
    primary: '#1F2937',
    secondary: '#4B5563',
    accent: '#6B7280',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    background: '#FFFFFF',
    surface: '#F9FAFB',
    text: '#111827'
  }
};

export const fontPairings = {
  modern: {
    name: 'Modern Sans',
    heading: 'Inter, system-ui, sans-serif',
    body: 'Inter, system-ui, sans-serif'
  },
  classic: {
    name: 'Classic Serif',
    heading: 'Georgia, serif',
    body: 'Georgia, serif'
  },
  elegant: {
    name: 'Elegant Mix',
    heading: 'Playfair Display, serif',
    body: 'Inter, sans-serif'
  },
  tech: {
    name: 'Tech Modern',
    heading: 'Space Grotesk, monospace',
    body: 'Inter, sans-serif'
  }
};

export const spacingScales = {
  compact: {
    name: 'Compact',
    scale: 0.75,
    cardPadding: '1rem',
    sectionPadding: '1.5rem',
    gap: '0.75rem'
  },
  default: {
    name: 'Default',
    scale: 1,
    cardPadding: '2rem',
    sectionPadding: '3rem',
    gap: '1.5rem'
  },
  spacious: {
    name: 'Spacious',
    scale: 1.25,
    cardPadding: '2.5rem',
    sectionPadding: '4rem',
    gap: '2rem'
  },
  generous: {
    name: 'Generous',
    scale: 1.5,
    cardPadding: '3rem',
    sectionPadding: '5rem',
    gap: '2.5rem'
  }
};

export const borderStyles = {
  sharp: {
    name: 'Sharp Corners',
    radius: '0px',
    cardRadius: '0px',
    buttonRadius: '0px'
  },
  subtle: {
    name: 'Subtle Rounded',
    radius: '0.375rem',
    cardRadius: '0.5rem',
    buttonRadius: '0.375rem'
  },
  default: {
    name: 'Default Rounded',
    radius: '0.5rem',
    cardRadius: '1rem',
    buttonRadius: '0.5rem'
  },
  soft: {
    name: 'Soft Rounded',
    radius: '1rem',
    cardRadius: '1.5rem',
    buttonRadius: '1rem'
  },
  pill: {
    name: 'Pill Shaped',
    radius: '9999px',
    cardRadius: '1.5rem',
    buttonRadius: '9999px'
  }
};

export const componentStyles = {
  cards: [
    {
      id: 'elevated',
      name: 'Elevated Cards',
      shadow: 'shadow-lg hover:shadow-2xl',
      border: 'border-0'
    },
    {
      id: 'outlined',
      name: 'Outlined Cards',
      shadow: 'shadow-none',
      border: 'border-2'
    },
    {
      id: 'subtle',
      name: 'Subtle Cards',
      shadow: 'shadow-sm',
      border: 'border'
    },
    {
      id: 'flat',
      name: 'Flat Cards',
      shadow: 'shadow-none',
      border: 'border-0'
    }
  ],
  buttons: [
    {
      id: 'solid',
      name: 'Solid Buttons',
      style: 'bg-primary text-white'
    },
    {
      id: 'outlined',
      name: 'Outlined Buttons',
      style: 'bg-transparent border-2 border-primary text-primary'
    },
    {
      id: 'ghost',
      name: 'Ghost Buttons',
      style: 'bg-transparent text-primary hover:bg-primary/10'
    },
    {
      id: 'gradient',
      name: 'Gradient Buttons',
      style: 'bg-gradient-to-r from-primary to-secondary text-white'
    }
  ]
};

export const layoutPresets = {
  dashboard: [
    {
      id: 'grid-3',
      name: '3-Column Grid',
      description: 'Classic 3-column layout for dashboard cards',
      preview: '□ □ □'
    },
    {
      id: 'grid-4',
      name: '4-Column Grid',
      description: 'Dense 4-column layout for more cards',
      preview: '□ □ □ □'
    },
    {
      id: 'masonry',
      name: 'Masonry Layout',
      description: 'Pinterest-style staggered grid',
      preview: '□□ □ □'
    },
    {
      id: 'sidebar',
      name: 'Sidebar Layout',
      description: 'Featured card with sidebar',
      preview: '■■ □'
    }
  ]
};

export const animationPresets = {
  none: {
    name: 'No Animations',
    enabled: false
  },
  subtle: {
    name: 'Subtle Animations',
    enabled: true,
    duration: '200ms',
    easing: 'ease-in-out'
  },
  smooth: {
    name: 'Smooth Animations',
    enabled: true,
    duration: '300ms',
    easing: 'ease-in-out'
  },
  playful: {
    name: 'Playful Animations',
    enabled: true,
    duration: '400ms',
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
  }
};

export const defaultDesignConfig = {
  colorTheme: 'default',
  fontPairing: 'modern',
  spacingScale: 'default',
  borderStyle: 'default',
  cardStyle: 'elevated',
  buttonStyle: 'gradient',
  animation: 'smooth',
  darkMode: false
};
