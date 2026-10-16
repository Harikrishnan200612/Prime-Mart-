import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import defaultLogo from '../assets/prime-mart-logo.png';

const SettingsContext = createContext();

export const ACCENTS = {
  blue: { label: 'Ocean Blue', primary: '#356df3', dark: '#1e4fd6', soft: 'rgba(53,109,243,.14)' },
  purple: { label: 'Royal Purple', primary: '#8457d8', dark: '#6633b8', soft: 'rgba(132,87,216,.16)' },
  green: { label: 'Emerald', primary: '#17ad76', dark: '#0f8a5c', soft: 'rgba(23,173,118,.15)' },
  orange: { label: 'Amber', primary: '#ee9a38', dark: '#c9761a', soft: 'rgba(238,154,56,.16)' },
  rose: { label: 'Rose', primary: '#e0507a', dark: '#b8355c', soft: 'rgba(224,80,122,.15)' },
  teal: { label: 'Teal', primary: '#1cadb5', dark: '#0f8890', soft: 'rgba(28,173,181,.15)' }
};

const STORAGE_KEY = 'primemart-settings-v4';

// A logo the user uploaded in Settings is stored as a data: URL and is kept.
// Anything else saved earlier is just an old copy of the default logo, so it is
// replaced with the current default (this is how a new default logo reaches
// browsers that already have saved settings).
const isUploadedLogo = (logo) => typeof logo === 'string' && logo.startsWith('data:') && logo !== defaultLogo;

const loadSettings = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { theme: 'light', accent: 'blue', ...parsed, logo: isUploadedLogo(parsed.logo) ? parsed.logo : defaultLogo };
    }
  } catch (err) {
    // ignore malformed storage
  }
  return { theme: 'light', accent: 'blue', logo: defaultLogo };
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(loadSettings);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (err) {
      // storage full or unavailable - ignore, in-memory state still works
    }
    document.documentElement.setAttribute('data-theme', settings.theme);
    const accent = ACCENTS[settings.accent] || ACCENTS.blue;
    document.documentElement.style.setProperty('--primary', accent.primary);
    document.documentElement.style.setProperty('--primary-dark', accent.dark);
    document.documentElement.style.setProperty('--primary-soft', accent.soft);
  }, [settings]);

  const toggleTheme = useCallback(() => {
    setSettings((prev) => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }));
  }, []);

  const setTheme = useCallback((theme) => {
    setSettings((prev) => ({ ...prev, theme }));
  }, []);

  const setAccent = useCallback((accent) => {
    setSettings((prev) => ({ ...prev, accent }));
  }, []);

  const setLogo = useCallback((logo) => {
    setSettings((prev) => ({ ...prev, logo }));
  }, []);

  return (
    <SettingsContext.Provider value={{ ...settings, accents: ACCENTS, toggleTheme, setTheme, setAccent, setLogo }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};
