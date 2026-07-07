import React, { useContext, useState } from 'react';
import Button from '../components/Button';
import { AppContext } from '../AppContext';

/**
 * Manual set logging — the form-check bypass.
 * Used when AI Form Check is disabled in Settings, or when the user taps
 * "Log manually" before a set. Reps count for progression, but no form
 * score is recorded (the form profile is never guessed at).
 */
export default function ManualLogScreen({ exercise, onComplete }) {
  const { state, dispatch } = useContext(AppContext);
  const isHold = exercise?.type === 'hold';
  const target = state.currentTarget || (isHold ? 30 : 10);
  const [count, setCount] = useState(target);

  const item = state.workout?.items?.[state.workout.itemIndex];
  const setNumber = (item?.results?.length || 0) + 1;
  const totalSets = item?.sets || 1;
  const weightLb = item?.prescription?.weightLb;
  const units = state.settings?.units || 'lb';
  const weightDisplay = weightLb
    ? `${units === 'kg' ? Math.round((weightLb / 2.20462) * 2) / 2 : weightLb} ${units}`
    : null;

  const step = isHold ? 5 : 1;

  return (
    <div style={styles.screen}>
      <div style={styles.badge}>✍️ Manual log — no camera</div>

      <div style={styles.emoji}>{exercise?.emoji}</div>
      <div style={styles.name}>{exercise?.name}</div>
      <div style={styles.sub}>
        Set {setNumber} of {totalSets} · target {target}{isHold ? 's' : ' reps'}
        {weightDisplay ? ` @ ${weightDisplay}` : ''}
      </div>

      <div style={styles.counterRow}>
        <button style={styles.counterBtn} onClick={() => setCount((c) => Math.max(0, c - step))}>−</button>
        <div style={styles.counterVal}>
          {count}
          <div style={styles.counterLabel}>{isHold ? 'seconds held' : 'reps done'}</div>
        </div>
        <button style={styles.counterBtn} onClick={() => setCount((c) => Math.min(999, c + step))}>+</button>
      </div>

      <div style={styles.hint}>
        Do your set, then log what you got. Without the camera, form isn't scored —
        progression runs on reps alone.
      </div>

      <div style={{ padding: '0 24px' }}>
        <Button onClick={() => onComplete?.(isHold ? { reps: 0, holdTime: count, manual: true } : { reps: count, holdTime: 0, manual: true })}>
          Log Set ✓
        </Button>
        <div style={{ marginTop: 8 }}>
          <Button variant="secondary" onClick={() => dispatch({ type: 'END_WORKOUT' })}>
            End Workout
          </Button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  screen: {
    position: 'fixed',
    inset: 0,
    background: 'linear-gradient(165deg, #0F1647 0%, #152058 50%, #0F1647 100%)',
    zIndex: 150,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    textAlign: 'center',
    overflowY: 'auto',
    padding: '40px 0',
  },
  badge: {
    alignSelf: 'center',
    background: 'rgba(240,165,0,0.12)',
    border: '1px solid rgba(240,165,0,0.3)',
    borderRadius: 999,
    color: '#F0A500',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1,
    textTransform: 'uppercase',
    padding: '6px 14px',
    marginBottom: 18,
  },
  emoji: { fontSize: 44 },
  name: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 34,
    letterSpacing: 1,
    color: '#F4F1EB',
    marginTop: 6,
  },
  sub: { fontSize: 13, color: '#9AA0B8', marginTop: 4, marginBottom: 24 },
  counterRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 20,
  },
  counterBtn: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.15)',
    color: '#E8533A',
    fontSize: 28,
    cursor: 'pointer',
    lineHeight: 1,
  },
  counterVal: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 72,
    lineHeight: 1,
    color: '#F4F1EB',
    textShadow: '0 0 40px rgba(232,83,58,0.4)',
    minWidth: 120,
  },
  counterLabel: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 11,
    color: '#9AA0B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 6,
  },
  hint: {
    fontSize: 12,
    color: '#9AA0B8',
    lineHeight: 1.6,
    margin: '0 40px 24px',
  },
};
