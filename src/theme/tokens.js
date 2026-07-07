/**
 * FormForged Design System Tokens
 * Matches the UI prototype exactly
 */

export const colors = {
  ink: '#0F1647',
  paper: '#F4F1EB',
  muscle: '#E8533A',
  muscleDark: '#C0392B',
  muscleGlow: 'rgba(232,83,58,0.35)',
  gold: '#F0A500',
  steel: '#1A2060',
  steelLight: '#252D72',
  mist: '#9AA0B8',
  safe: '#2ECC71',
  warn: '#F39C12',
  danger: '#E74C3C',
  card: 'rgba(255,255,255,0.04)',
  cardBorder: 'rgba(255,255,255,0.08)',
  barBg: 'rgba(255,255,255,0.08)',
};

export const fonts = {
  heading: "'Bebas Neue', sans-serif",
  body: "'DM Sans', sans-serif",
};

export const radii = {
  lg: '20px',
  md: '16px',
  sm: '12px',
  pill: '20px',
};

export const shadows = {
  ctaGlow: '0 8px 24px rgba(232,83,58,0.35)',
  ctaHover: '0 12px 32px rgba(232,83,58,0.5)',
  goldGlow: '0 0 40px rgba(240,165,0,0.25)',
  safeGlow: '0 0 8px rgba(46,204,113,0.6)',
};

export const gradients = {
  muscle: 'linear-gradient(135deg, #E8533A, #C0392B)',
  earnBg: 'linear-gradient(165deg, #0F1647 0%, #152058 50%, #0F1647 100%)',
  levelUpBg: 'radial-gradient(ellipse at 50% 30%, rgba(240,165,0,0.2) 0%, #0F1647 60%)',
  summaryBg: 'linear-gradient(170deg, #152058 0%, #0F1647 100%)',
  onboardBg: 'radial-gradient(ellipse at 50% 0%, rgba(232,83,58,0.15) 0%, #0F1647 50%)',
  barFill: 'linear-gradient(90deg, #E8533A, #F0A500)',
};

// Effort bar earning rates (hidden from users)
export const earningRates = {
  plankHold: { seconds: 10, minutesEarned: 1 },
  wallSitHold: { seconds: 10, minutesEarned: 1 },
  gluteBridgeHold: { seconds: 15, minutesEarned: 1 },
  repBased: { secondsPerRep: 3.5, minutesPerRep: 21 / 60 },
};

export const DAILY_CAP_MINUTES = 60;
export const GRACE_PERIOD_SECONDS = 30;
