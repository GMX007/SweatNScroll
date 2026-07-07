import React, { useContext } from 'react';
import Button from '../components/Button';
import LevelBadge from '../components/LevelBadge';
import { AppContext } from '../AppContext';
import { getLevelForXP } from '../data/levels';
import { getExerciseById, getFormAvg, getMovementQuality, getPrescription, lbToDisplay } from '../services/programEngine';
import { PATTERN_LABELS, PROGRESSION_MODELS } from '../data/programs';

export default function HomeScreen() {
  const { state, dispatch } = useContext(AppContext);
  const { program, nextDayIndex, streak, totalReps, xp, formProfile } = state;
  const level = getLevelForXP(xp);
  const day = program?.days?.[nextDayIndex % (program?.days?.length || 1)];
  const quality = getMovementQuality(formProfile);

  return (
    <div style={styles.screen}>
      <div style={styles.bgGlow} />

      {/* Header */}
      <div style={styles.header}>
        <span style={styles.logo}>FORMFORGED</span>
        <LevelBadge level={level} />
      </div>

      {/* Program banner */}
      {program && (
        <div style={styles.programBanner}>
          <div>
            <div style={styles.programName}>{program.name}</div>
            <div style={styles.programSub}>
              Day {(nextDayIndex % program.days.length) + 1} of {program.days.length}
              {program.custom && program.model && ` · ${PROGRESSION_MODELS[program.model]?.label || ''}`}
              {quality !== null && ` · Movement quality ${quality}%`}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={styles.regenBtn} onClick={() => dispatch({ type: 'SHOW_PROGRAM_BUILDER' })} title="Edit program">
              {'🛠️'}
            </button>
            {!program.custom && (
              <button style={styles.regenBtn} onClick={() => dispatch({ type: 'REGENERATE_PROGRAM' })} title="Rebuild program">
                {'🔄'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Today's workout */}
      {day && (
        <div style={styles.workoutCard}>
          <div style={styles.workoutTitle}>{day.name}</div>
          <div style={styles.workoutFocus}>{day.focus}</div>

          {day.items.map((item, i) => {
            const ex = getExerciseById(item.exerciseId);
            if (!ex) return null;
            const avg = getFormAvg(formProfile, item.exerciseId);
            const rx = program.custom
              ? getPrescription(item, { model: program.model, oneRMs: state.oneRMs, formProfile })
              : null;
            const units = state.settings?.units || 'lb';
            const rxText = rx
              ? `${rx.sets}×${rx.repMin}–${rx.repMax}${ex.type === 'hold' ? 's' : ''}` +
                (rx.weightLb ? ` @ ${lbToDisplay(rx.weightLb, units)} ${units}` : '') +
                (rx.pct ? ` (${rx.pct}% 1RM)` : '')
              : null;
            return (
              <div key={`${item.exerciseId}-${i}`} style={styles.exerciseRow}>
                <span style={styles.exerciseEmoji}>{ex.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={styles.exerciseName}>
                    {ex.name}
                    {item.adaptedFrom && (
                      <span style={{
                        ...styles.adaptTag,
                        color: item.adaptedWhy === 'progress' ? '#2ECC71' : '#F39C12',
                        borderColor: item.adaptedWhy === 'progress' ? 'rgba(46,204,113,0.4)' : 'rgba(243,156,18,0.4)',
                      }}>
                        {item.adaptedWhy === 'progress' ? '↑ earned' : '↓ form fix'}
                      </span>
                    )}
                  </div>
                  <div style={styles.exerciseMeta}>
                    {rxText || `${PATTERN_LABELS[item.pattern] || item.pattern} · ${item.sets} sets`}
                    {avg !== null && (
                      <span style={{ color: avg >= 90 ? '#2ECC71' : avg >= 75 ? '#F39C12' : '#E74C3C' }}>
                        {' '}· form {avg}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          <div style={{ marginTop: 16 }}>
            <Button onClick={() => dispatch({ type: 'START_WORKOUT' })}>
              Start Workout {'💪'}
            </Button>
          </div>
        </div>
      )}

      {/* Mini Stats */}
      <div style={styles.miniStats}>
        <div style={styles.miniStat}>
          <div style={styles.miniStatVal}>{'🔥'} {streak}</div>
          <div style={styles.miniStatKey}>Day Streak</div>
        </div>
        <div style={styles.miniStat}>
          <div style={styles.miniStatVal}>{totalReps}</div>
          <div style={styles.miniStatKey}>Clean Reps</div>
        </div>
        <div style={styles.miniStat}>
          <div style={styles.miniStatVal}>{quality !== null ? `${quality}%` : '—'}</div>
          <div style={styles.miniStatKey}>Form Quality</div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  screen: {
    background: 'linear-gradient(165deg, #0F1647 0%, #152058 50%, #0F1647 100%)',
    minHeight: '100%',
    padding: '16px 0 100px',
    position: 'relative',
  },
  bgGlow: {
    position: 'absolute',
    width: 300,
    height: 300,
    background: 'radial-gradient(circle, rgba(232,83,58,0.35) 0%, transparent 70%)',
    top: '30%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
  },
  header: {
    padding: '8px 24px 0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
  },
  logo: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 22,
    letterSpacing: 2,
    color: '#E8533A',
  },
  programBanner: {
    margin: '20px 20px 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    position: 'relative',
    zIndex: 1,
  },
  programName: {
    fontSize: 13,
    fontWeight: 700,
    color: '#F4F1EB',
  },
  programSub: {
    fontSize: 11,
    color: '#9AA0B8',
    marginTop: 2,
  },
  regenBtn: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: '6px 10px',
    fontSize: 14,
    cursor: 'pointer',
  },
  workoutCard: {
    margin: '12px 20px 0',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 18,
    position: 'relative',
    zIndex: 1,
  },
  workoutTitle: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 28,
    letterSpacing: 1,
    color: '#F4F1EB',
    lineHeight: 1,
  },
  workoutFocus: {
    fontSize: 11,
    color: '#E8533A',
    textTransform: 'uppercase',
    letterSpacing: 1,
    margin: '4px 0 12px',
  },
  exerciseRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 0',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  exerciseEmoji: { fontSize: 22 },
  exerciseName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#F4F1EB',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  exerciseMeta: {
    fontSize: 11,
    color: '#9AA0B8',
    marginTop: 2,
  },
  adaptTag: {
    fontSize: 9,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    border: '1px solid',
    borderRadius: 999,
    padding: '2px 8px',
  },
  miniStats: {
    margin: '14px 20px 0',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 10,
    position: 'relative',
    zIndex: 1,
  },
  miniStat: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 12,
    padding: '12px 8px',
    textAlign: 'center',
  },
  miniStatVal: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 22,
    color: '#F4F1EB',
    lineHeight: 1,
  },
  miniStatKey: {
    fontSize: 9,
    color: '#9AA0B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 3,
  },
};
