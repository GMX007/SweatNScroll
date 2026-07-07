import React, { useState, useContext } from 'react';
import Button from '../components/Button';
import { AppContext } from '../AppContext';
import { equipmentOptions, getExercisesByTier } from '../data/exercises';

export default function EquipmentScreen() {
  const { state, dispatch } = useContext(AppContext);
  const [selected, setSelected] = useState(state.userEquipment || []);

  const toggle = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const handleContinue = () => {
    dispatch({ type: 'SET_EQUIPMENT', payload: selected });
  };

  // Calculate total exercises available
  const totalExercises = getExercisesByTier('standard', selected).length;
  const bodyweightOnly = getExercisesByTier('standard', []).length;
  const extraExercises = totalExercises - bodyweightOnly;

  return (
    <div style={styles.screen}>
      <div style={styles.bgGlow} />

      <div style={styles.content}>
        <div style={styles.logo}>FORMFORGED</div>
        <div style={styles.badge}>STANDARD</div>
        <div style={styles.title}>WHAT EQUIPMENT DO YOU HAVE?</div>
        <div style={styles.subtitle}>
          Select everything you have access to. You can always change this later in Settings.
        </div>

        <div style={styles.list}>
          {equipmentOptions.map((eq) => {
            const isSelected = selected.includes(eq.id);
            return (
              <button
                key={eq.id}
                onClick={() => toggle(eq.id)}
                style={{
                  ...styles.card,
                  ...(isSelected ? styles.cardSelected : {}),
                }}
              >
                <div style={styles.cardLeft}>
                  <span style={styles.cardEmoji}>{eq.emoji}</span>
                  <div>
                    <div style={styles.cardName}>{eq.name}</div>
                    <div style={styles.cardDesc}>{eq.description}</div>
                  </div>
                </div>
                <div style={{
                  ...styles.checkbox,
                  ...(isSelected ? styles.checkboxSelected : {}),
                }}>
                  {isSelected && '✓'}
                </div>
              </button>
            );
          })}
        </div>

        <div style={styles.countBadge}>
          {totalExercises} exercises available
          {extraExercises > 0 && (
            <span style={{ color: '#2ECC71' }}> (+{extraExercises} with equipment)</span>
          )}
        </div>

        <div style={{ marginTop: 20 }}>
          <Button onClick={handleContinue}>
            Continue {'→'}
          </Button>
        </div>

        <button onClick={handleContinue} style={styles.skipBtn}>
          Skip — I only have my bodyweight
        </button>
      </div>
    </div>
  );
}

const styles = {
  screen: {
    background: 'linear-gradient(165deg, #0F1647 0%, #152058 50%, #0F1647 100%)',
    minHeight: '100%',
    padding: '16px 0 40px',
    position: 'relative',
  },
  bgGlow: {
    position: 'absolute',
    width: 350,
    height: 350,
    background: 'radial-gradient(circle, rgba(240,165,0,0.15) 0%, transparent 70%)',
    top: '20%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
  },
  content: {
    padding: '32px 20px 0',
    position: 'relative',
    zIndex: 1,
    textAlign: 'center',
  },
  logo: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 16,
    letterSpacing: 3,
    color: '#E8533A',
    marginBottom: 4,
  },
  badge: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 11,
    letterSpacing: 3,
    color: '#F0A500',
    marginBottom: 16,
  },
  title: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 28,
    letterSpacing: 2,
    color: '#F4F1EB',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#9AA0B8',
    lineHeight: 1.5,
    marginBottom: 24,
    maxWidth: 320,
    margin: '0 auto 24px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    textAlign: 'left',
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: '14px 16px',
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'all 0.2s',
    width: '100%',
  },
  cardSelected: {
    background: 'rgba(240,165,0,0.08)',
    borderColor: 'rgba(240,165,0,0.3)',
    boxShadow: '0 0 12px rgba(240,165,0,0.1)',
  },
  cardLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  cardEmoji: {
    fontSize: 28,
    width: 40,
    textAlign: 'center',
  },
  cardName: {
    fontSize: 15,
    fontWeight: 600,
    color: '#F4F1EB',
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 11,
    color: '#9AA0B8',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    border: '2px solid rgba(255,255,255,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    color: 'transparent',
    transition: 'all 0.2s',
    flexShrink: 0,
  },
  checkboxSelected: {
    background: '#F0A500',
    borderColor: '#F0A500',
    color: '#0D0D14',
    fontWeight: 800,
  },
  countBadge: {
    marginTop: 16,
    fontSize: 13,
    color: '#9AA0B8',
    textAlign: 'center',
  },
  skipBtn: {
    display: 'block',
    margin: '16px auto 0',
    background: 'transparent',
    border: 'none',
    color: '#9AA0B8',
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    textDecoration: 'underline',
  },
};
