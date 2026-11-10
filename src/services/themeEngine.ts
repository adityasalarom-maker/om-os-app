import { db } from '../db';

export type ThemeCategory = 'Basic Dark' | 'High Contrast' | 'Bright Solar';

export interface ThemeDefinition {
  id: string;
  name: string;
  category: ThemeCategory;
  description: string;
  isLight: boolean;
  previewColors: {
    bg: string;
    card: string;
    accent: string;
    text: string;
  };
  variables: {
    '--bg-primary': string;
    '--bg-secondary': string;
    '--bg-card': string;
    '--bg-card-hover': string;
    '--border-color': string;
    '--text-main': string;
    '--text-muted': string;
    '--accent': string;
    '--accent-hover': string;
    '--accent-muted': string;
  };
}

export const THEMES: ThemeDefinition[] = [
  // ==========================================
  // 1. BASIC / DARK ELEGANCE (5 THEMES)
  // ==========================================
  {
    id: 'midnight-obsidian',
    name: 'Midnight Obsidian',
    category: 'Basic Dark',
    description: 'Deep cosmic obsidian with royal indigo accents (Canonical Default)',
    isLight: false,
    previewColors: { bg: '#0f1117', card: '#181a24', accent: '#6366f1', text: '#f3f4f6' },
    variables: {
      '--bg-primary': '#0f1117',
      '--bg-secondary': '#161822',
      '--bg-card': '#181a24',
      '--bg-card-hover': '#212533',
      '--border-color': '#272b3b',
      '--text-main': '#f3f4f6',
      '--text-muted': '#9ca3af',
      '--accent': '#6366f1',
      '--accent-hover': '#4f46e5',
      '--accent-muted': 'rgba(99, 102, 241, 0.15)'
    }
  },
  {
    id: 'slate-monolith',
    name: 'Slate Monolith',
    category: 'Basic Dark',
    description: 'Cool architectural slate and deep titanium with cyan-sky highlights',
    isLight: false,
    previewColors: { bg: '#0f172a', card: '#1e293b', accent: '#0284c7', text: '#f8fafc' },
    variables: {
      '--bg-primary': '#0f172a',
      '--bg-secondary': '#1e293b',
      '--bg-card': '#1e293b',
      '--bg-card-hover': '#334155',
      '--border-color': '#334155',
      '--text-main': '#f8fafc',
      '--text-muted': '#94a3b8',
      '--accent': '#0284c7',
      '--accent-hover': '#0369a1',
      '--accent-muted': 'rgba(2, 132, 199, 0.15)'
    }
  },
  {
    id: 'deep-charcoal',
    name: 'Deep Charcoal & Ruby',
    category: 'Basic Dark',
    description: 'Ultra-refined neutral carbon charcoal with vivid ruby crimson accents',
    isLight: false,
    previewColors: { bg: '#121212', card: '#1e1e1e', accent: '#e11d48', text: '#f4f4f5' },
    variables: {
      '--bg-primary': '#121212',
      '--bg-secondary': '#181818',
      '--bg-card': '#1e1e1e',
      '--bg-card-hover': '#282828',
      '--border-color': '#2e2e2e',
      '--text-main': '#f4f4f5',
      '--text-muted': '#a1a1aa',
      '--accent': '#e11d48',
      '--accent-hover': '#be123c',
      '--accent-muted': 'rgba(225, 29, 72, 0.15)'
    }
  },
  {
    id: 'cosmic-navy',
    name: 'Cosmic Deep Navy',
    category: 'Basic Dark',
    description: 'Abyssal deep-space navy with electric cobalt and pulsar blue',
    isLight: false,
    previewColors: { bg: '#080c18', card: '#11182c', accent: '#3b82f6', text: '#f1f5f9' },
    variables: {
      '--bg-primary': '#080c18',
      '--bg-secondary': '#0d1324',
      '--bg-card': '#11182c',
      '--bg-card-hover': '#1b2544',
      '--border-color': '#1f2c4e',
      '--text-main': '#f1f5f9',
      '--text-muted': '#94a3b8',
      '--accent': '#3b82f6',
      '--accent-hover': '#2563eb',
      '--accent-muted': 'rgba(59, 130, 246, 0.15)'
    }
  },
  {
    id: 'emerald-forest',
    name: 'Emerald Forest / Vana',
    category: 'Basic Dark',
    description: 'Deep Himalayan cedar and Ayurvedic pine with radiant emerald jade',
    isLight: false,
    previewColors: { bg: '#091510', card: '#12251c', accent: '#10b981', text: '#f0fdf4' },
    variables: {
      '--bg-primary': '#091510',
      '--bg-secondary': '#0e1e17',
      '--bg-card': '#12251c',
      '--bg-card-hover': '#1a3528',
      '--border-color': '#1f3f30',
      '--text-main': '#f0fdf4',
      '--text-muted': '#86efac',
      '--accent': '#10b981',
      '--accent-hover': '#059669',
      '--accent-muted': 'rgba(16, 185, 129, 0.15)'
    }
  },

  // ==========================================
  // 2. HIGH-CONTRAST / FOCUS (5 THEMES)
  // ==========================================
  {
    id: 'oled-pitch-black',
    name: 'OLED Pure Pitch Black',
    category: 'High Contrast',
    description: 'Zero-nit absolute black for Samsung S25 Ultra battery preservation & pure focus',
    isLight: false,
    previewColors: { bg: '#000000', card: '#080808', accent: '#06b6d4', text: '#ffffff' },
    variables: {
      '--bg-primary': '#000000',
      '--bg-secondary': '#050505',
      '--bg-card': '#0a0a0a',
      '--bg-card-hover': '#141414',
      '--border-color': '#2a2a2a',
      '--text-main': '#ffffff',
      '--text-muted': '#a3a3a3',
      '--accent': '#06b6d4',
      '--accent-hover': '#0891b2',
      '--accent-muted': 'rgba(6, 182, 212, 0.2)'
    }
  },
  {
    id: 'cyberpunk-amber',
    name: 'Cyberpunk Amber Matrix',
    category: 'High Contrast',
    description: 'Deep void with phosphor amber typography inspired by retro mainframe terminals',
    isLight: false,
    previewColors: { bg: '#0a0701', card: '#181105', accent: '#f59e0b', text: '#fef3c7' },
    variables: {
      '--bg-primary': '#0a0701',
      '--bg-secondary': '#120d04',
      '--bg-card': '#181105',
      '--bg-card-hover': '#291d09',
      '--border-color': '#452b0a',
      '--text-main': '#fef3c7',
      '--text-muted': '#d97706',
      '--accent': '#f59e0b',
      '--accent-hover': '#d97706',
      '--accent-muted': 'rgba(245, 158, 11, 0.2)'
    }
  },
  {
    id: 'monochrome-ink',
    name: 'Monochrome Print Ink',
    category: 'High Contrast',
    description: 'Strict stark black and white for pure distraction-free typographic reading',
    isLight: false,
    previewColors: { bg: '#040404', card: '#121212', accent: '#ffffff', text: '#ffffff' },
    variables: {
      '--bg-primary': '#040404',
      '--bg-secondary': '#0c0c0c',
      '--bg-card': '#121212',
      '--bg-card-hover': '#1e1e1e',
      '--border-color': '#3f3f46',
      '--text-main': '#ffffff',
      '--text-muted': '#d4d4d8',
      '--accent': '#ffffff',
      '--accent-hover': '#e4e4e7',
      '--accent-muted': 'rgba(255, 255, 255, 0.2)'
    }
  },
  {
    id: 'solarized-dark',
    name: 'Solarized Dark Pro',
    category: 'High Contrast',
    description: 'Precision calculated color relationships with low eye fatigue and teal highlights',
    isLight: false,
    previewColors: { bg: '#002b36', card: '#073642', accent: '#2aa198', text: '#93a1a1' },
    variables: {
      '--bg-primary': '#002b36',
      '--bg-secondary': '#073642',
      '--bg-card': '#073642',
      '--bg-card-hover': '#0d4a59',
      '--border-color': '#586e75',
      '--text-main': '#fdf6e3',
      '--text-muted': '#93a1a1',
      '--accent': '#2aa198',
      '--accent-hover': '#268bd2',
      '--accent-muted': 'rgba(42, 161, 152, 0.2)'
    }
  },
  {
    id: 'high-contrast-cobalt',
    name: 'High-Contrast Violet',
    category: 'High Contrast',
    description: 'Deep pitch navy with vivid electric violet markers for maximum visual clarity',
    isLight: false,
    previewColors: { bg: '#030712', card: '#0f172a', accent: '#a855f7', text: '#f9fafb' },
    variables: {
      '--bg-primary': '#030712',
      '--bg-secondary': '#0b1120',
      '--bg-card': '#0f172a',
      '--bg-card-hover': '#1e293b',
      '--border-color': '#374151',
      '--text-main': '#f9fafb',
      '--text-muted': '#c084fc',
      '--accent': '#a855f7',
      '--accent-hover': '#9333ea',
      '--accent-muted': 'rgba(168, 85, 247, 0.2)'
    }
  },

  // ==========================================
  // 3. BRIGHT / SOLAR / DAY (5 THEMES)
  // ==========================================
  {
    id: 'white-sand',
    name: 'Pure White Sand',
    category: 'Bright Solar',
    description: 'Crisp clean daylight white with warm dune sandstone ochre and graphite text',
    isLight: true,
    previewColors: { bg: '#ffffff', card: '#f8fafc', accent: '#b45309', text: '#0f172a' },
    variables: {
      '--bg-primary': '#ffffff',
      '--bg-secondary': '#f8fafc',
      '--bg-card': '#ffffff',
      '--bg-card-hover': '#f1f5f9',
      '--border-color': '#e2e8f0',
      '--text-main': '#0f172a',
      '--text-muted': '#64748b',
      '--accent': '#b45309',
      '--accent-hover': '#92400e',
      '--accent-muted': 'rgba(180, 83, 9, 0.12)'
    }
  },
  {
    id: 'nordic-snow',
    name: 'Nordic Snow Daylight',
    category: 'Bright Solar',
    description: 'Bright Scandinavian winter daylight with pine spruce accents and granite text',
    isLight: true,
    previewColors: { bg: '#f1f5f9', card: '#ffffff', accent: '#0f766e', text: '#1e293b' },
    variables: {
      '--bg-primary': '#f1f5f9',
      '--bg-secondary': '#e2e8f0',
      '--bg-card': '#ffffff',
      '--bg-card-hover': '#f8fafc',
      '--border-color': '#cbd5e1',
      '--text-main': '#1e293b',
      '--text-muted': '#64748b',
      '--accent': '#0f766e',
      '--accent-hover': '#115e59',
      '--accent-muted': 'rgba(15, 118, 110, 0.12)'
    }
  },
  {
    id: 'vedic-parchment',
    name: 'Vedic Manuscript Parchment',
    category: 'Bright Solar',
    description: 'Warm antique palm-leaf parchment with sacred saffron and deep teak lettering',
    isLight: true,
    previewColors: { bg: '#fdfbf7', card: '#f7f2e7', accent: '#d97706', text: '#292524' },
    variables: {
      '--bg-primary': '#fdfbf7',
      '--bg-secondary': '#f3ede0',
      '--bg-card': '#f7f2e7',
      '--bg-card-hover': '#ebe4d3',
      '--border-color': '#e2d8c3',
      '--text-main': '#292524',
      '--text-muted': '#78716c',
      '--accent': '#d97706',
      '--accent-hover': '#b45309',
      '--accent-muted': 'rgba(217, 119, 6, 0.12)'
    }
  },
  {
    id: 'lotus-rosewater',
    name: 'Lotus Rosewater Dawn',
    category: 'Bright Solar',
    description: 'Serene petal dawn with gentle soft rose blush and calming burgundy accents',
    isLight: true,
    previewColors: { bg: '#fff1f2', card: '#ffffff', accent: '#e11d48', text: '#4c0519' },
    variables: {
      '--bg-primary': '#fff1f2',
      '--bg-secondary': '#ffe4e6',
      '--bg-card': '#ffffff',
      '--bg-card-hover': '#fff5f6',
      '--border-color': '#fecdd3',
      '--text-main': '#4c0519',
      '--text-muted': '#9f1239',
      '--accent': '#e11d48',
      '--accent-hover': '#be123c',
      '--accent-muted': 'rgba(225, 29, 72, 0.1)'
    }
  },
  {
    id: 'mint-dawn',
    name: 'Mint Dawn / Ayurvedic Ayur',
    category: 'Bright Solar',
    description: 'Fresh morning botanical garden with soothing jade mint and herbal greens',
    isLight: true,
    previewColors: { bg: '#f0fdf4', card: '#ffffff', accent: '#16a34a', text: '#14532d' },
    variables: {
      '--bg-primary': '#f0fdf4',
      '--bg-secondary': '#dcfce7',
      '--bg-card': '#ffffff',
      '--bg-card-hover': '#f7fee7',
      '--border-color': '#bbf7d0',
      '--text-main': '#14532d',
      '--text-muted': '#15803d',
      '--accent': '#16a34a',
      '--accent-hover': '#15803d',
      '--accent-muted': 'rgba(22, 163, 74, 0.1)'
    }
  }
];

const STORAGE_KEY = 'om_knowledge_os_theme';

export const getThemeById = (id: string): ThemeDefinition => {
  return THEMES.find(t => t.id === id) || THEMES[0];
};

export const getStoredThemeId = (): string => {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'midnight-obsidian';
  } catch {
    return 'midnight-obsidian';
  }
};

export const applyTheme = (themeId: string): ThemeDefinition => {
  const theme = getThemeById(themeId);
  const root = document.documentElement;

  // Apply CSS Custom Properties
  Object.entries(theme.variables).forEach(([key, val]) => {
    root.style.setProperty(key, val);
  });

  // Set Theme Class on HTML root
  THEMES.forEach(t => root.classList.remove(`theme-${t.id}`));
  root.classList.add(`theme-${theme.id}`);

  if (theme.isLight) {
    root.classList.add('light-mode');
    root.classList.remove('dark-mode');
  } else {
    root.classList.add('dark-mode');
    root.classList.remove('light-mode');
  }

  try {
    localStorage.setItem(STORAGE_KEY, theme.id);
  } catch {}

  try {
    db.syncSettings.put({ id: 'app_theme', value: theme.id, updatedAt: Date.now() }).catch(() => {});
  } catch {}

  // Dispatch custom event for reactive listeners
  window.dispatchEvent(new CustomEvent('om-theme-changed', { detail: theme }));

  return theme;
};

export const restoreThemeFromDbIfAvailable = async (): Promise<ThemeDefinition | null> => {
  try {
    const record = await db.syncSettings.get('app_theme');
    if (record && record.value && typeof record.value === 'string') {
      const current = getStoredThemeId();
      if (record.value !== current) {
        return applyTheme(record.value);
      }
    }
  } catch {}
  return null;
};

export const initializeThemeOnStartup = (): ThemeDefinition => {
  const savedId = getStoredThemeId();
  return applyTheme(savedId);
};
