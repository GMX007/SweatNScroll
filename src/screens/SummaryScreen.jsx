import React, { useContext, useMemo, useState } from 'react';
import Button from '../components/Button';
import { AppContext } from '../AppContext';

function getTipOptions(note = '') {
  const n = (note || '').toLowerCase();
  const tips = [];
  if (n.includes('hip')) tips.push('Brace core and squeeze glutes');
  if (n.includes('knee')) tips.push('Track knees over toes');
  if (n.includes('lean')) tips.push('Keep chest tall and shoulders stacked');
  if (n.includes('depth') || n.includes('deeper')) tips.push('Use full depth each rep');
  if (n.includes('camera')) tips.push('Step back and keep full body in frame');
  tips.push('Slow down and keep control');
  return [...new Set(tips)].slice(0, 4);
}

const ADAPT_COLORS = {
  progress: '#2ECC71',
  hold: '#9AA0B8',
  technique: '#F39C12',
  regress: '#E74C3C',
};

const ADAPT_ICONS = {
  progress: '📈',
  hold: '🧠',
  technique: '🎯',
  regress: '🛠️',
};

export default function SummaryScreen() {
  const { state, dispatch } = useContext(AppContext);
  const { lastSet } = state;
  const [selectedTip, setSelectedTip] = useState('');

  const set = lastSet || {
    exercise: 'Push-up', setNumber: 1, totalSets: 3, target: 12,
    cleanReps: 10, flaggedReps: 2, formScore: 86, personalBest: false,
    topNote: null, adaptation: null, nextAction: 'next-set', nextExerciseName: null, isHold: false,
  };

  const tipOptions = useMemo(() => getTipOptions(set.topNote), [set.topNote]);
  const adaptation = set.adaptation;
  const workoutDone = set.nextAction === 'workout-done';

  const ctaLabel = set.nextAction === 'next-set'
    ? `Next Set (${set.setNumber + 1} of ${set.totalSets}) →`
    : set.nextAction === 'next-exercise'
      ? `Next: ${set.nextExerciseName} →`
      : 'Finish Workout 🎉';

  return (
    <div style={styles.screen}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.checkCircle}>{'✓'}</div>
        <div style={styles.title}>{workoutDone ? 'Workout Complete' : `Set ${set.setNumber} of ${set.totalSets} Done`}</div>
        <div style={styles.sub}>
          {set.exercise} · target {set.target}{set.isHold ? 's' : ' reps'}
          {set.weightLb ? ` @ ${state.settings?.units === 'kg' ? Math.round((set.weightLb / 2.20462) * 2) / 2 + ' kg' : set.weightLb + ' lb'}` : ''}
        </div>
      </div>

      {/* Stat Grid */}
      <div style={styles.statGrid}>
        <div style={styles.statCard}>
          <div style={{ ...styles.statVal, color: '#2ECC71' }}>{set.cleanReps}</div>
          <div style={styles.statKey}>Clean {set.isHold ? 'Seconds' : 'Reps'}</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statVal, color: '#E8533A' }}>{set.flaggedReps}</div>
          <div style={styles.statKey}>Flagged</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statVal}>{set.formScore}%</div>
          <div style={styles.statKey}>Form Score</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statVal}>{set.personalBest ? '🏆' : '—'}</div>
          <div style={styles.statKey}>{set.personalBest ? 'Personal Best!' : 'Keep Going'}</div>
        </div>
        {set.topNote && (
          <div style={styles.highlightCard}>
            <div style={{ flex: 1 }}>
              <div style={{ ...styles.statVal, fontSize: 20, color: '#F39C12' }}>{set.topNote}</div>
              <div style={{ ...styles.statKey, marginTop: 6 }}>Most common form note</div>
            </div>
            <span style={{ fontSize: 28 }}>{'⚠️'}</span>
          </div>
        )}
      </div>

      {/* Program adaptation — form data driving the program */}
      {adaptation && (
        <div style={{
          ...styles.adaptCard,
          borderColor: `${ADAPT_COLORS[adaptation.action]}44`,
        }}>
          <span style={{ fontSize: 22 }}>{ADAPT_ICONS[adaptation.action] || '🧠'}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: ADAPT_COLORS[adaptation.action] }}>
              Program adaptation
            </div>
            <div style={styles.adaptText}>{adaptation.message}</div>
          </div>
        </div>
      )}

      {/* Form tip */}
      {!workoutDone && (
        <>
          <div style={styles.formTip}>
            {'💡'} {set.topNote ? `Form tip: ${set.topNote}` : 'Form tip: Great control — keep that pace.'}
          </div>
          <div style={styles.tipButtons}>
            {tipOptions.map((tip) => (
              <button
                key={tip}
                type="button"
                onClick={() => setSelectedTip(tip)}
                style={{
                  ...styles.tipBtn,
                  ...(selectedTip === tip ? styles.tipBtnActive : {}),
                }}
              >
                {tip}
              </button>
            ))}
          </div>
          {selectedTip && <div style={styles.tipSelected}>Focus next set: {selectedTip}</div>}
        </>
      )}

      {/* CTAs */}
      <div style={{ marginTop: 4 }}>
        <Button onClick={() => dispatch({ type: 'CONTINUE_WORKOUT' })}>
          {ctaLabel}
        </Button>
      </div>
      {!workoutDone && (
        <div style={{ marginTop: 8 }}>
          <Button variant="secondary" onClick={() => dispatch({ type: 'END_WORKOUT' })}>
            End Workout Early
          </Button>
        </div>
      )}
    </div>
  );
}

const styles = {
  screen: {
    background: 'linear-gradient(170deg, #152058 0%, #0F1647 100%)',
    minHeight: '100%',
    padding: '16px 0 100px',
  },
  header: {
    padding: '12px 24px 0',
    textAlign: 'center',
  },
  checkCircle: {
    width: 56,
    height: 56,
    background: 'rgba(46,204,113,0.15)',
    border: '2px solid rgba(46,204,113,0.4)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
    margin: '0 auto 12px',
    boxShadow: '0 0 24px rgba(46,204,113,0.2)',
    color: '#2ECC71',
  },
  title: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 32,
    letterSpacing: 1,
    color: '#F4F1EB',
    marginBottom: 4,
  },
  sub: {
    fontSize: 12,
    color: '#9AA0B8',
    marginBottom: 20,
  },
  statGrid: {
    margin: '0 20px',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
  },
  statCard: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
  },
  statVal: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 32,
    lineHeight: 1,
    color: '#F4F1EB',
  },
  statKey: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#9AA0B8',
    marginTop: 4,
  },
  highlightCard: {
    background: 'rgba(232,83,58,0.08)',
    border: '1px solid rgba(232,83,58,0.2)',
    borderRadius: 16,
    padding: 16,
    gridColumn: 'span 2',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  adaptCard: {
    margin: '12px 20px 0',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid',
    borderRadius: 16,
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  adaptText: {
    fontSize: 13,
    color: '#F4F1EB',
    marginTop: 3,
    lineHeight: 1.4,
  },
  formTip: {
    margin: '12px 20px',
    background: 'rgba(46,204,113,0.07)',
    border: '1px solid rgba(46,204,113,0.2)',
    borderRadius: 12,
    padding: '10px 14px',
    fontSize: 12,
    color: 'rgba(46,204,113,0.9)',
  },
  tipButtons: {
    margin: '8px 20px 4px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  tipBtn: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 999,
    color: '#F4F1EB',
    fontSize: 11,
    padding: '8px 12px',
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
  },
  tipBtnActive: {
    background: 'rgba(46,204,113,0.14)',
    borderColor: 'rgba(46,204,113,0.4)',
    color: '#2ECC71',
  },
  tipSelected: {
    margin: '4px 20px 10px',
    fontSize: 12,
    color: '#2ECC71',
  },
};
