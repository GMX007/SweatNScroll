import React, { useState } from 'react';

/**
 * FormForge button — primary (orange) or secondary (ghost).
 */
export default function Button({ children, variant = 'primary', onClick, style = {}, disabled = false }) {
  const [hover, setHover] = useState(false);

  const base = {
    margin: '0 20px',
    border: 'none',
    borderRadius: 28,
    padding: '16px 20px',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: 0.5,
    cursor: disabled ? 'not-allowed' : 'pointer',
    width: 'calc(100% - 40px)',
    transition: 'transform 0.15s, box-shadow 0.15s',
    opacity: disabled ? 0.5 : 1,
    transform: hover && !disabled ? 'translateY(-2px)' : 'none',
    WebkitTapHighlightColor: 'transparent',
  };

  const variants = {
    primary: {
      background: 'linear-gradient(135deg, #E8533A, #C0392B)',
      color: 'white',
      boxShadow: hover ? '0 12px 32px rgba(232,83,58,0.5)' : '0 8px 24px rgba(232,83,58,0.35)',
    },
    secondary: {
      background: 'rgba(255,255,255,0.06)',
      color: '#F4F1EB',
      border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: 'none',
    },
  };

  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ ...base, ...variants[variant], ...style }}
    >
      {children}
    </button>
  );
}
