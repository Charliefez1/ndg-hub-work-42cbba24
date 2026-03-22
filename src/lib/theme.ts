export type Theme = 'light' | 'dark' | 'system';
export type Accent = 'steel' | 'sky' | 'mint' | 'amber' | 'purple';

const THEME_KEY = 'nqi-theme';
const ACCENT_KEY = 'nqi-accent';

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
  root.setAttribute("data-transitioning", "");

  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  } else {
    root.classList.toggle('dark', theme === 'dark');
  }

  // Remove old data-theme attribute if present
  root.removeAttribute('data-theme');

  setTimeout(() => root.removeAttribute("data-transitioning"), 250);
}

export function initTheme() {
  const theme = getStoredTheme();
  const accent = getStoredAccent();
  applyTheme(theme);
  document.documentElement.setAttribute('data-accent', accent);

  if (theme === 'system') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (getStoredTheme() === 'system') {
        applyTheme('system');
      }
    });
  }
}
