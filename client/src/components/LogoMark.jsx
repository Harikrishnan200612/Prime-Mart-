import React from 'react';
import { useSettings } from '../context/SettingsContext';

/**
 * Renders the business logo consistently everywhere it's used
 * (sidebar, header, footer avatar, login/register, receipt).
 * Pass a `variant` matching a CSS class that defines size/shape for that spot.
 * Falls back to a plain "P" mark until the user uploads a logo in Settings.
 */
const LogoMark = ({ variant, alt = 'Prime Mart logo', fallback = 'P' }) => {
  const { logo } = useSettings();

  if (logo) {
    return <img src={logo} alt={alt} className={variant} />;
  }

  return <div className={variant}>{fallback}</div>;
};

export default LogoMark;
