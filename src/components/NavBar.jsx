import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const tabs = [
  { path: '/', label: 'Train', emoji: '💪' },
  { path: '/progress', label: 'Progress', emoji: '📊' },
  { path: '/ranks', label: 'Ranks', emoji: '🏆' },
  { path: '/settings', label: 'Settings', emoji: '⚙️' },
];

export default function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav style={styles.nav}>
      {tabs.map(tab => {
        const active = location.pathname === tab.path;
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{
              ...styles.item,
              ...(active ? styles.active : {}),
            }}
          >
            <span style={styles.icon}>{tab.emoji}</span>
            <span style={{
              ...styles.label,
              color: active ? '#E8533A' : '#9AA0B8',
            }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

const styles = {
  nav: {
    position: 'fixed',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: 430,
    height: 72,
    background: 'rgba(8,13,46,0.95)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderTop: '1px solid rgba(255,255,255,0.07)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: '0 12px 8px',
    paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
    zIndex: 100,
  },
  item: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    padding: '8px 16px',
    borderRadius: 12,
    cursor: 'pointer',
    background: 'transparent',
    border: 'none',
    WebkitTapHighlightColor: 'transparent',
  },
  active: {
    background: 'rgba(232,83,58,0.15)',
  },
  icon: {
    fontSize: 20,
  },
  label: {
    fontSize: 9,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
};