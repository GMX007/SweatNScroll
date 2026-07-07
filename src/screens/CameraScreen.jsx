import React, { useRef, useEffect, useState, useContext, useCallback } from 'react';
import { AppContext } from '../AppContext';
import { initPoseDetector, estimatePose } from '../services/poseDetection';
import { verifyExercise, resetRepState } from '../services/exerciseVerifier';
import { playRepComplete, playSetComplete, playFormWarning, playFormBreak, playCountdownTick } from '../services/audioService';
import FormIndicator from '../components/FormIndicator';
import Button from '../components/Button';
import { getScaledTarget } from '../data/exercises';

function getQuickFixes(exercise, issueMessage = '') {
  const issue = (issueMessage || '').toLowerCase();
  const quick = [];

  // Start with issue-specific fixes so users can tap exactly what to correct.
  if (issue.includes('hip')) quick.push('Brace core + squeeze glutes');
  if (issue.includes('knee')) quick.push('Track knees in line with toes');
  if (issue.includes('chest')) quick.push('Keep chest tall, eyes forward');
  if (issue.includes('lean')) quick.push('Stack shoulders over hips');
  if (issue.includes('deeper')) quick.push('Use full range — go deeper');
  if (issue.includes('camera')) quick.push('Step back and keep full body in frame');

  // Fill with exercise-specific points.
  const fromFormPoints = (exercise?.formPoints || []).slice(0, 4);
  for (const point of fromFormPoints) {
    if (quick.length >= 5) break;
    if (!quick.includes(point)) quick.push(point);
  }

  // Final fallback.
  if (quick.length === 0) quick.push('Slow down and keep control on each rep');
  return quick.slice(0, 5);
}

/**
 * Live camera exercise screen with real-time pose detection.
 * Camera feed as background, overlay with rep counter & form indicator.
 */
export default function CameraScreen({ exercise, onComplete, onSwitchExercise }) {
  const { state, dispatch } = useContext(AppContext);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const frameCount = useRef(0);

  const [cameraReady, setCameraReady] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [reps, setReps] = useState(0);
  const [holdTime, setHoldTime] = useState(0);
  const [formStatus, setFormStatus] = useState({ level: 'green', message: 'Get ready...' });
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(!state.settings?.audioEnabled);
  const [countdown, setCountdown] = useState(5);
  const [lastFlagMessage, setLastFlagMessage] = useState('Form breaking down');
  const [selectedFix, setSelectedFix] = useState('');
  const lastFormLevel = useRef('green');
  const targetCelebratedRef = useRef(false);
  // Real form tracking — this score drives the program engine.
  const cleanRepsRef = useRef(0);
  const flaggedRepsRef = useRef(0);
  const formBreaksRef = useRef(0);

  const computeFormScore = useCallback(() => {
    const totalCounted = cleanRepsRef.current + flaggedRepsRef.current;
    if (exercise?.type === 'hold') {
      // Holds: start from 100, each form break costs 10.
      return Math.max(40, 100 - formBreaksRef.current * 10);
    }
    if (totalCounted === 0) return 80;
    return Math.round((cleanRepsRef.current / totalCounted) * 100);
  }, [exercise]);

  const completeSession = useCallback((payload = {}) => {
    const formNote = lastFlagMessage && !/get ready/i.test(lastFlagMessage) ? lastFlagMessage : null;
    onComplete?.({
      reps,
      holdTime,
      formScore: computeFormScore(),
      topNote: formNote,
      ...payload,
    });
  }, [reps, holdTime, lastFlagMessage, onComplete, computeFormScore]);

  const isHold = exercise?.type === 'hold';
  // Program-driven target (form-gated); falls back to base scaling.
  const target = state.currentTarget || getScaledTarget(exercise, state.gender, state.activityLevel, state.sessionsCompleted);

  // Start camera
  useEffect(() => {
    let stream;
    async function startCamera() {
      try {
        const facingMode = state.settings?.camera === 'Rear' ? 'environment' : 'user';
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraReady(true);
        }
      } catch (err) {
        console.error('[FormForged] Camera access denied:', err);
        setFormStatus({ level: 'red', message: 'Camera access denied — check browser settings' });
      }
    }
    startCamera();
    return () => {
      stream?.getTracks().forEach(t => t.stop());
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Init pose detector
  useEffect(() => {
    initPoseDetector()
      .then(() => setModelReady(true))
      .catch(() => setFormStatus({ level: 'amber', message: 'AI model loading failed — try refreshing' }));
    resetRepState();
  }, []);

  useEffect(() => {
    targetCelebratedRef.current = false;
    cleanRepsRef.current = 0;
    flaggedRepsRef.current = 0;
    formBreaksRef.current = 0;
  }, [exercise?.id, isHold]);

  // 5-second positioning countdown
  useEffect(() => {
    if (!cameraReady) return;
    if (countdown <= 0) return;
    const timer = setTimeout(() => {
      const next = countdown - 1;
      setCountdown(next);
      if (!muted) {
        if (next === 0) {
          playSetComplete();
        } else {
          playCountdownTick();
        }
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown, cameraReady]);

  // Detection loop
  const detectLoop = useCallback(async () => {
    if (!videoRef.current || !cameraReady || !modelReady || paused || countdown > 0) {
      animFrameRef.current = requestAnimationFrame(detectLoop);
      return;
    }

    frameCount.current++;
    if (frameCount.current % 3 !== 0) {
      animFrameRef.current = requestAnimationFrame(detectLoop);
      return;
    }

    try {
      const poses = await estimatePose(videoRef.current);
      if (poses.length > 0) {
        const result = verifyExercise(exercise.id, poses[0]);
        setFormStatus({ level: result.level, message: result.message });

        if (result.level === 'pause') {
          setPaused(true);
          formBreaksRef.current += 1;
          if (!muted) playFormBreak();
        }

        if (!muted && result.level === 'red' && lastFormLevel.current !== 'red') {
          playFormWarning();
        }
        if (result.level === 'red' || result.level === 'amber' || result.level === 'pause') {
          setLastFlagMessage(result.message || 'Form breaking down');
        }
        lastFormLevel.current = result.level;

        if (isHold && result.holdValid) {
          setHoldTime(prev => {
            const newTime = prev + (1 / 10);
            if (newTime >= target && !targetCelebratedRef.current) {
              targetCelebratedRef.current = true;
              if (!muted) playSetComplete();
              setFormStatus({ level: 'green', message: 'Target achieved! Keep going! 🎉' });
            }
            return newTime;
          });
        }

        if (!isHold && result.repCompleted) {
          if (result.level === 'red' || result.level === 'amber') {
            flaggedRepsRef.current += 1;
          } else {
            cleanRepsRef.current += 1;
          }
          setReps(prev => {
            const newReps = prev + 1;
            if (newReps >= target && !targetCelebratedRef.current) {
              targetCelebratedRef.current = true;
              if (!muted) playSetComplete();
              setFormStatus({ level: 'green', message: 'Target achieved! Keep pushing! 🔥' });
            } else {
              if (!muted) playRepComplete();
            }
            return newReps;
          });

          if (state.settings?.vibrationEnabled && navigator.vibrate) {
            navigator.vibrate(50);
          }

          if (result.level === 'red' && navigator.vibrate) {
            navigator.vibrate([200]);
          }
        }
      }
    } catch (err) {
      console.error('[FormForged] Pose detection error:', err);
    }

    animFrameRef.current = requestAnimationFrame(detectLoop);
  }, [cameraReady, modelReady, paused, countdown, exercise, isHold, target, onComplete, state.settings, muted]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(detectLoop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [detectLoop]);

  return (
    <div style={styles.screen}>
      {/* Camera feed */}
      <video
        ref={videoRef}
        style={styles.video}
        playsInline
        muted
      />

      {/* Overlay */}
      <div style={styles.overlay}>
        <div style={styles.topBar}>
          <div style={styles.exerciseName}>{exercise?.name}</div>
          <div style={styles.exerciseTarget}>
            Target: {target} {isHold ? 'sec' : 'reps'}
          </div>
        </div>

        <div style={styles.counter}>
          <div style={styles.counterVal}>
            {isHold ? Math.floor(holdTime) : reps}
          </div>
          <div style={styles.counterLabel}>
            {isHold ? `/ ${target} sec` : `/ ${target} reps`}
          </div>
        </div>

        <div style={styles.miniBar}>
          <div style={{
            ...styles.miniBarFill,
            width: `${Math.min(100, ((isHold ? holdTime : reps) / target) * 100)}%`,
          }} />
        </div>

        <div style={styles.bottom}>
          <FormIndicator status={formStatus.level === 'pause' ? 'red' : formStatus.level} message={formStatus.message} />
          {!modelReady && (
            <div style={styles.loading}>Loading AI model...</div>
          )}
        </div>
      </div>

      {/* Pause overlay */}
      {paused && (
        <div style={styles.pauseOverlay}>
          <div style={styles.pauseContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: '#E8533A', letterSpacing: 2 }}>FORMFORGED</div>
              <div style={{ background: 'rgba(240,165,0,0.15)', border: '1px solid rgba(240,165,0,0.3)', borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 600, color: '#F0A500', display: 'flex', alignItems: 'center', gap: 4 }}>
                {'⚡'} GRINDER
              </div>
            </div>

            <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#9AA0B8', marginBottom: 8 }}>Form Alert</div>
            <div style={styles.pauseTitle}>Form Breaking Down</div>

            <div style={styles.alertCard}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#F4F1EB', marginBottom: 6 }}>
                Your form is breaking down — that means you're working hard.
              </div>
              <div style={{ fontSize: 12, color: '#9AA0B8' }}>
                {lastFlagMessage || formStatus.message}
              </div>
            </div>

            <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#9AA0B8', marginBottom: 10, marginTop: 18 }}>
              Tap a fix
            </div>
            <div style={styles.fixGrid}>
              {getQuickFixes(exercise, lastFlagMessage || formStatus.message).map((fix) => (
                <button
                  key={fix}
                  type="button"
                  onClick={() => setSelectedFix(fix)}
                  style={{
                    ...styles.fixChip,
                    ...(selectedFix === fix ? styles.fixChipActive : {}),
                  }}
                >
                  {fix}
                </button>
              ))}
            </div>
            {selectedFix && (
              <div style={styles.fixSelected}>
                Focus cue: {selectedFix}
              </div>
            )}

            {exercise?.easierVariation && (
              <>
                <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#9AA0B8', marginBottom: 12, marginTop: 20 }}>
                  Want to switch to an easier variation?
                </div>
                <div style={styles.variationCard}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#F4F1EB' }}>{exercise.easierVariation}</div>
                    <div style={{ fontSize: 11, color: '#9AA0B8', marginTop: 2 }}>Same chest activation, reduced load</div>
                  </div>
                  <div style={{ background: 'rgba(46,204,113,0.15)', border: '1px solid rgba(46,204,113,0.3)', borderRadius: 12, padding: '4px 10px', fontSize: 10, fontWeight: 700, color: '#2ECC71', letterSpacing: 1 }}>
                    EASIER
                  </div>
                </div>
                <Button onClick={() => {
                  setPaused(false);
                  setSelectedFix('');
                  resetRepState();
                  onSwitchExercise?.(exercise.easierVariation);
                }}>
                  Switch to {exercise.easierVariation}
                </Button>
              </>
            )}

            <div style={{ marginTop: 8 }}>
              <Button variant="secondary" onClick={() => { setPaused(false); setSelectedFix(''); resetRepState(); }}>
                Try Again
              </Button>
            </div>
            <button onClick={() => completeSession({ formScore: 0 })} style={styles.endSetBtn}>
              End Set
            </button>
          </div>
        </div>
      )}

      {/* Countdown overlay */}
      {(countdown > 0 || !cameraReady) && (
        <div style={styles.countdownOverlay}>
          {!cameraReady ? (
            <>
              <div style={styles.countdownLabel}>Starting camera…</div>
              <div style={styles.countdownExercise}>{exercise?.name}</div>
              <div style={{ ...styles.countdownNumber, fontSize: 48 }}>{'📸'}</div>
              <div style={styles.countdownSub}>Allow camera access to continue</div>
            </>
          ) : (
            <>
              <div style={styles.countdownLabel}>Get in position!</div>
              <div style={styles.countdownExercise}>{exercise?.name}</div>
              <div style={styles.countdownNumber}>{countdown}</div>
              <div style={styles.countdownSub}>
                Put your phone down & step back{'\n'}AI starts in {countdown} second{countdown !== 1 ? 's' : ''}…
              </div>
            </>
          )}
        </div>
      )}

      <button onClick={() => setMuted(m => !m)} style={styles.muteBtn}>
        {muted ? '🔇' : '🔊'}
      </button>

      <button onClick={() => completeSession()} style={styles.endBtn}>
        End Set
      </button>
    </div>
  );
}

const styles = {
  screen: {
    position: 'fixed',
    inset: 0,
    background: '#000',
    zIndex: 150,
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transform: 'scaleX(-1)',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 30%, transparent 60%, rgba(0,0,0,0.7) 100%)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '60px 0 100px',
  },
  topBar: {
    textAlign: 'center',
    padding: '0 24px',
  },
  exerciseName: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 24,
    letterSpacing: 1,
    color: '#F4F1EB',
  },
  exerciseTarget: {
    fontSize: 12,
    color: '#9AA0B8',
  },
  counter: {
    textAlign: 'center',
  },
  counterVal: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 80,
    lineHeight: 1,
    color: '#F4F1EB',
    textShadow: '0 0 40px rgba(232,83,58,0.5)',
  },
  counterLabel: {
    fontSize: 14,
    color: '#9AA0B8',
    marginTop: 4,
  },
  miniBar: {
    margin: '0 40px',
    height: 6,
    background: 'rgba(255,255,255,0.15)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  miniBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #E8533A, #F0A500)',
    borderRadius: 3,
    transition: 'width 0.3s ease',
  },
  bottom: {
    padding: '0 0 20px',
  },
  loading: {
    textAlign: 'center',
    fontSize: 12,
    color: '#F0A500',
    marginTop: 8,
  },
  muteBtn: {
    position: 'absolute',
    top: 48,
    left: 20,
    background: 'rgba(0,0,0,0.5)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: '8px 12px',
    color: '#F4F1EB',
    fontSize: 16,
    cursor: 'pointer',
    zIndex: 10,
  },
  endBtn: {
    position: 'absolute',
    top: 48,
    right: 20,
    background: 'rgba(0,0,0,0.5)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: '8px 16px',
    color: '#F4F1EB',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    zIndex: 10,
  },
  pauseOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(13,13,20,0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  pauseContent: {
    padding: '40px 24px 0',
    textAlign: 'left',
    width: '100%',
    maxWidth: 400,
    overflowY: 'auto',
    maxHeight: '100vh',
  },
  pauseTitle: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 28,
    color: '#E8533A',
    marginBottom: 12,
  },
  alertCard: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 16,
  },
  variationCard: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  fixGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  fixChip: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.14)',
    color: '#F4F1EB',
    borderRadius: 999,
    padding: '8px 12px',
    fontSize: 11,
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    textAlign: 'left',
  },
  fixChipActive: {
    background: 'rgba(46,204,113,0.14)',
    borderColor: 'rgba(46,204,113,0.45)',
    color: '#2ECC71',
  },
  fixSelected: {
    fontSize: 12,
    color: '#2ECC71',
    marginBottom: 10,
  },
  endSetBtn: {
    marginTop: 12,
    background: 'transparent',
    border: 'none',
    color: '#9AA0B8',
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    textDecoration: 'underline',
  },
  countdownOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(10, 14, 40, 0.82)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
  },
  countdownLabel: {
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: '#F0A500',
    marginBottom: 6,
  },
  countdownExercise: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 28,
    letterSpacing: 2,
    color: '#F4F1EB',
    marginBottom: 20,
  },
  countdownNumber: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 120,
    lineHeight: 1,
    color: '#E8533A',
    textShadow: '0 0 60px rgba(232,83,58,0.6)',
    marginBottom: 16,
  },
  countdownSub: {
    fontSize: 14,
    color: '#9AA0B8',
  },
};
