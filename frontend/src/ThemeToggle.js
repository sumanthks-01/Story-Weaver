import React from 'react';

export default function ThemeToggle({ darkMode, onToggle }) {
  return (
    <div className="toggle-cont" title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
      <input
        className="toggle-input"
        id="theme-toggle"
        name="toggle"
        type="checkbox"
        checked={darkMode}
        onChange={onToggle}
        aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      />
      <label className="toggle-label" htmlFor="theme-toggle">
        <div className="cont-label-play">
          {/* Sun icon — visible when light mode (unchecked) */}
          <svg
            className="toggle-icon toggle-icon-sun"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="4" />
            <line x1="12" y1="2"  x2="12" y2="4"  />
            <line x1="12" y1="20" x2="12" y2="22" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="2"  y1="12" x2="4"  y2="12" />
            <line x1="20" y1="12" x2="22" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>

          {/* Moon icon — visible when dark mode (checked) */}
          <svg
            className="toggle-icon toggle-icon-moon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
          </svg>
        </div>
      </label>
    </div>
  );
}
