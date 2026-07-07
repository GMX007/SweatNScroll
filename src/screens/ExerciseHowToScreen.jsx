import React, { useContext } from 'react';
import Button from '../components/Button';
import { AppContext } from '../AppContext';
import { getScaledTarget } from '../data/exercises';

/**
 * How-to screen shown before the camera launches.
 * Explains how the AI camera works so the user knows what to expect.
 */
export default function ExerciseHowToScreen({ exercise, onReady }) {
  const { state } = useContext(AppContext);
  const isHold = exercise?.type === 'hold';
  const target = exercise
    ? getScaledTarget(exercise, state.gender, state.activityLevel, state.sessionsCompleted)
    : isHold ? 30 : 14;

  return (
    <div style={styles.screen}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.logo}>FORMFORGE</span>
      </div>

      {/* Title */}
      <div style={styles.title}>How It Works {'📸'}</div>
      <div style={styles.subtitle}>
        You're about to do: <strong>{exercise?.name}</strong>
      </div>

      {/* Steps */}
      <div style={styles.stepsContainer}>
        <div style={styles.step}>
          <div style={styles.stepNumber}>1</div>
          <div style={styles.stepContent}>
            <div style={styles.stepTitle}>Set up your camera {'📱'}</div>
            <div style={styles.stepDesc}>
              Prop your phone up so the camera can see your <strong>full body</strong> — head to toes. A few feet away works great!
            </div>
          </div>
        </div>

        <div style={styles.step}>
          <div style={styles.stepNumber}>2</div>
          <div style={styles.stepContent}>
            <div style={styles.stepTitle}>AI watches your form {'🤖'}</div>
            <div style={styles.stepDesc}>
              Our AI tracks your body position in real-time. You'll see a <span style={{ color: '#2ECC71', fontWeight: 600 }}>green</span>, <span style={{ color: '#F0A500', fontWeight: 600 }}>yellow</span>, or <span style={{ color: '#E8533A', fontWeight: 600 }}>red</span> indicator showing your form quality.
            </div>
          </div>
        </div>

        <div style={styles.step}>
          <div style={styles.stepNumber}>3</div>
          <div style={styles.stepContent}>
            <div style={styles.stepTitle}>
              {isHold ? 'Hold steady! ⏱️' : 'Do your reps! 💪'}
            </div>
            <div style={styles.stepDesc}>
              {isHold
                ? `Hold the position for ${target} seconds. The AI counts the time for you — just focus on form!`
                : `Complete ${target} reps. The AI counts each one automatically — you'll hear a ding and feel a buzz for each rep!`
              }
            </div>
          </div>
        </div>

        <div style={styles.step}>
          <div style={styles.stepNumber}>4</div>
          <div style={styles.stepContent}>
            <div style={styles.stepTitle}>Your form shapes your program {'🧠'}</div>
            <div style={styles.stepDesc}>
              Only clean reps count. Your form score decides when you progress, when to hold, and when to switch variations. Better form = more XP!
            </div>
          </div>
        </div>
      </div>

      {/* Tips card */}
      <div style={styles.tipsCard}>
        <div style={styles.tipsTitle}>{'💡'} Quick tips</div>
        <div style={styles.tipText}>Good lighting helps the AI see you better</div>
        <div style={styles.tipText}>Wear clothes that contrast with your background</div>
        <div style={styles.tipText}>You can tap the {'🔇'} button to mute sounds</div>
      </div>

      {/* Ready button */}
      <div style={{ marginTop: 20, padding: '0 24px' }}>
        <Button onClick={onReady}>
          I'm Ready! Let's Go! {'🔥'}
        </Button>
      </div>
    </div>
  );
}

const styles = {
  screen: {
    background: 'linear-gradient(165deg, #0F1647 0%, #152058 50%, #0F1647 100%)',
    minHeight: '100vh',
    padding: '16px 0 40px',
    position: 'relative',
  },
  header: {
    padding: '8px 24px 0',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 22,
    letterSpacing: 2,
    color: '#E8533A',
  },
  title: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 36,
    letterSpacing: 1,
    color: '#F4F1EB',
    textAlign: 'center',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 14,
    color: '#9AA0B8',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
  },
  stepsContainer: {
    padding: '0 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  step: {
    display: 'flex',
    gap: 14,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #E8533A, #D4432A)',
    color: '#fff',
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#F4F1EB',
    marginBottom: 3,
  },
  stepDesc: {
    fontSize: 13,
    color: '#9AA0B8',
    lineHeight: 1.5,
  },
  tipsCard: {
    margin: '20px 24px 0',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: '14px 16px',
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#F0A500',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 12,
    color: '#9AA0B8',
    lineHeight: 1.6,
    paddingLeft: 8,
    borderLeft: '2px solid rgba(240,165,0,0.2)',
    marginBottom: 6,
  },
};
