export type Theme = 'light' | 'dark' | 'system';
export type Accent = 'steel' | 'sky' | 'mint' | 'amber' | 'purple';

const THEME_KEY = 'ndg-theme';
const ACCENT_KEY = 'ndg-accent';

export function getStoredTheme(): Theme {
  return (localStorage.getItem(THEME_KEY) as Theme) || 'system';
}

export function getStoredAccent(): Accent {
  return (localStorage.getItem(ACCENT_KEY) as Accent) || 'steel';
}

export function setTheme(theme: Theme) {
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
}

export function setAccent(accent: Accent) {
  localStorage.setItem(ACCENT_KEY, accent);
  document.documentElement.setAttribute('data-accent', accent);
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    root.setAttribute('data-theme', theme);
  }
}

export function initTheme() {
  const theme = getStoredTheme();
  const accent = getStoredAccent();
  applyTheme(theme);
  document.documentElement.setAttribute('data-accent', accent);

  // Listen for system theme changes
  if (theme === 'system') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (getStoredTheme() === 'system') {
        applyTheme('system');
      }
    });
  }
}
