export interface PdfTheme {
  id: string;
  name: string;
  bg: string;
  textColor: string;
  pageBg: string;
  canvasFilter: string; // CSS filter for canvas
  selectionColor: string;
  accent: string;
}

export const PDF_THEMES: PdfTheme[] = [
  {
    id: 'pristine-day',
    name: 'Pristine Day',
    bg: '#f8fafc',
    textColor: '#0f172a',
    pageBg: '#ffffff',
    canvasFilter: 'none',
    selectionColor: 'rgba(59, 130, 246, 0.3)',
    accent: '#2563eb'
  },
  {
    id: 'warm-parchment',
    name: 'Warm Parchment',
    bg: '#f5efe0',
    textColor: '#292524',
    pageBg: '#faf6ee',
    canvasFilter: 'sepia(0.15) brightness(0.97)',
    selectionColor: 'rgba(217, 119, 6, 0.25)',
    accent: '#d97706'
  },
  {
    id: 'antique-sepia',
    name: 'Antique Sepia',
    bg: '#ebe1cb',
    textColor: '#382a1d',
    pageBg: '#f4ecd8',
    canvasFilter: 'sepia(0.4) contrast(0.95)',
    selectionColor: 'rgba(180, 83, 9, 0.3)',
    accent: '#b45309'
  },
  {
    id: 'solarized-light',
    name: 'Solarized Light',
    bg: '#f5edd5',
    textColor: '#586e75',
    pageBg: '#fdf6e3',
    canvasFilter: 'sepia(0.2) hue-rotate(5deg)',
    selectionColor: 'rgba(38, 139, 210, 0.25)',
    accent: '#268bd2'
  },
  {
    id: 'nord-snow',
    name: 'Nord Snow',
    bg: '#e5e9f0',
    textColor: '#2e3440',
    pageBg: '#eceff4',
    canvasFilter: 'brightness(0.98) contrast(1.02)',
    selectionColor: 'rgba(94, 129, 172, 0.25)',
    accent: '#5e81ac'
  },
  {
    id: 'sage-calm',
    name: 'Sage Calm',
    bg: '#e2ede5',
    textColor: '#1c2e24',
    pageBg: '#ebf3ed',
    canvasFilter: 'hue-rotate(60deg) sepia(0.15)',
    selectionColor: 'rgba(5, 150, 105, 0.25)',
    accent: '#059669'
  },
  {
    id: 'midnight-slate',
    name: 'Midnight Slate',
    bg: '#090d16',
    textColor: '#e2e8f0',
    pageBg: '#0f172a',
    canvasFilter: 'invert(0.92) hue-rotate(180deg) contrast(1.05)',
    selectionColor: 'rgba(96, 165, 250, 0.35)',
    accent: '#60a5fa'
  },
  {
    id: 'obsidian-abyss',
    name: 'Obsidian Abyss',
    bg: '#050507',
    textColor: '#f3f4f6',
    pageBg: '#0f1015',
    canvasFilter: 'invert(0.95) hue-rotate(180deg) brightness(0.9)',
    selectionColor: 'rgba(129, 140, 248, 0.35)',
    accent: '#818cf8'
  },
  {
    id: 'gruvbox-dark',
    name: 'Gruvbox Dark',
    bg: '#1d2021',
    textColor: '#ebdbb2',
    pageBg: '#282828',
    canvasFilter: 'invert(0.9) hue-rotate(160deg) sepia(0.25)',
    selectionColor: 'rgba(250, 189, 47, 0.3)',
    accent: '#fabd2f'
  },
  {
    id: 'solarized-dark',
    name: 'Solarized Dark',
    bg: '#001e26',
    textColor: '#839496',
    pageBg: '#002b36',
    canvasFilter: 'invert(0.95) hue-rotate(140deg)',
    selectionColor: 'rgba(42, 161, 152, 0.3)',
    accent: '#2aa198'
  },
  {
    id: 'e-ink-contrast',
    name: 'E-Ink High Contrast',
    bg: '#000000',
    textColor: '#ffffff',
    pageBg: '#000000',
    canvasFilter: 'invert(1) grayscale(1) contrast(1.2)',
    selectionColor: 'rgba(255, 255, 255, 0.4)',
    accent: '#ffffff'
  },
  {
    id: 'amethyst-dusk',
    name: 'Amethyst Dusk',
    bg: '#120d1c',
    textColor: '#e9e3f5',
    pageBg: '#181324',
    canvasFilter: 'invert(0.92) hue-rotate(220deg)',
    selectionColor: 'rgba(192, 132, 252, 0.35)',
    accent: '#c084fc'
  }
];
