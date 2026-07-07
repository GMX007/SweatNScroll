import React, { useState, useContext } from 'react';
import Button from '../components/Button';
import LevelAvatar from '../components/LevelAvatar';
import { AppContext } from '../AppContext';

const steps = [
  {
    id: 'gender',
    question: 'Pick your look! ✨',
    subtitle: 'Your avatar levels up as you do',
    options: [
      { emoji: '🙋‍♂️', text: 'Male', value: 'male' },
      { emoji: '🙋‍♀️', text: 'Female', value: 'female' },
    ],
  },
  {
    id: 'goal',
    question: "What's the goal? 🎯",
    subtitle: 'This shapes your whole program',
    options: [
      { emoji: '🏋️', text: 'Get stronger', value: 'strength' },
      { emoji: '💪', text: 'Build muscle', value: 'muscle' },
      { emoji: '⚡', text: 'General fitness', value: 'general' },
    ],
  },
  {
    id: 'experience',
    question: 'Training experience? 🤔',
    subtitle: 'Be honest — the AI will notice anyway',
    options: [
      { emoji: '🌱', text: 'New to training', value: 'beginner' },
      { emoji: '🏃', text: 'Train on and off', value: 'intermediate' },
      { emoji: '🔥', text: 'Train consistently', value: 'advanced' },
    ],
  },
  {
    id: 'daysPerWeek',
    question: 'Days per week? 📅',
    subtitle: 'Your split is built around this',
    options: [
      { emoji: '2️⃣', text: '2 days', value: 2 },
      { emoji: '3️⃣', text: '3 days', value: 3 },
      { emoji: '4️⃣', text: '4 days', value: 4 },
      { emoji: '5️⃣', text: '5 days', value: 5 },
    ],
  },
  {
    id: 'programMode',
    question: 'How do you want your program? 🧩',
    subtitle: 'You can switch anytime',
    options: [
      { emoji: '🤖', text: 'Generate it for me', value: 'generate' },
      { emoji: '🛠️', text: "I'll design my own", value: 'build' },
    ],
  },
  {
    id: 'equipment',
    question: 'What equipment do you have? 🏠',
    subtitle: 'Select all that apply — bodyweight is always included',
    multi: true,
    options: [
      { emoji: '🏋️', text: 'Dumbbells', value: 'Dumbbells' },
      { emoji: '🔔', text: 'Kettlebell', value: 'Kettlebell' },
      { emoji: '🟡', text: 'Resistance Bands', value: 'Resistance Bands' },
      { emoji: '💪', text: 'Pull-up Bar', value: 'Pull-up Bar' },
    ],
  },
];

export default function OnboardingScreen() {
  const { dispatch } = useContext(AppContext);
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState({ equipment: [] });

  // ─── WELCOME SPLASH ───
  if (showWelcome) {
    return (
      <div style={welcomeStyles.screen}>
        <div style={welcomeStyles.glow} />
        <div style={welcomeStyles.content}>
          <div style={welcomeStyles.logoIcon}>{'📷'}</div>
          <div style={welcomeStyles.logo}>FORMFORGE</div>
          <div style={welcomeStyles.tagline}>Programs built by your form. ✨</div>

          <div style={welcomeStyles.descCard}>
            <div style={welcomeStyles.descText}>
              Your camera is your coach. FormForge watches every rep, only counts the clean ones,
              and uses your real form data to build and adapt your training program. Move better,
              get stronger. 💪
            </div>
          </div>

          <div style={welcomeStyles.features}>
            <div style={welcomeStyles.featurePill}>{'📷'} Real-time form AI</div>
            <div style={welcomeStyles.featurePill}>{'🧠'} Adaptive programs</div>
            <div style={welcomeStyles.featurePill}>{'🏠'} Any equipment</div>
            <div style={welcomeStyles.featurePill}>{'🏆'} Leaderboards</div>
          </div>

          <Button onClick={() => setShowWelcome(false)}>
            Build My Program ✨
          </Button>
        </div>
      </div>
    );
  }

  // ─── ONBOARDING STEPS ───
  const step = steps[currentStep];
  const currentValue = selections[step.id];
  const hasSelection = step.multi ? true : currentValue !== undefined; // equipment can be empty

  const handleSelect = (option) => {
    if (step.multi) {
      setSelections((prev) => {
        const list = prev[step.id] || [];
        const next = list.includes(option.value)
          ? list.filter((v) => v !== option.value)
          : [...list, option.value];
        return { ...prev, [step.id]: next };
      });
    } else {
      setSelections((prev) => ({ ...prev, [step.id]: option.value }));
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      dispatch({
        type: 'COMPLETE_ONBOARDING',
        payload: {
          gender: selections.gender,
          goal: selections.goal,
          experience: selections.experience,
          daysPerWeek: selections.daysPerWeek,
          programMode: selections.programMode || 'generate',
          equipment: selections.equipment || [],
        },
      });
    }
  };

  const isSelected = (option) =>
    step.multi ? (selections[step.id] || []).includes(option.value) : currentValue === option.value;

  return (
    <div style={styles.screen}>
      <div style={styles.content}>
        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%',
              background: i < currentStep ? '#2ECC71' : i === currentStep ? '#E8533A' : 'rgba(255,255,255,0.15)',
              boxShadow: i === currentStep ? '0 0 8px #E8533A' : 'none',
            }} />
          ))}
        </div>

        <div style={styles.question}>{step.question}</div>
        <div style={styles.subtitle}>{step.subtitle}</div>

        {/* Avatar preview on gender step */}
        {step.id === 'gender' && selections.gender && (
          <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0 8px' }}>
            <LevelAvatar level={1} gender={selections.gender} size={100} />
          </div>
        )}

        {step.options.map((option, i) => {
          const selected = isSelected(option);
          return (
            <button key={`${currentStep}-${i}`} onClick={() => handleSelect(option)} style={{
              ...styles.optionBtn,
              background: selected ? 'rgba(232,83,58,0.12)' : 'rgba(255,255,255,0.04)',
              borderColor: selected ? 'rgba(232,83,58,0.4)' : 'rgba(255,255,255,0.08)',
            }}>
              <span style={{ fontSize: 20 }}>{option.emoji}</span>
              <span style={styles.optionText}>{option.text}</span>
              {selected && <div style={styles.optionCheck}>{'✓'}</div>}
            </button>
          );
        })}

        {step.multi && (selections[step.id] || []).length === 0 && (
          <div style={styles.multiHint}>No equipment? No problem — you'll get a full bodyweight program.</div>
        )}
      </div>

      <div style={{ marginTop: 24 }}>
        <Button onClick={handleNext} disabled={!hasSelection}>
          {currentStep < steps.length - 1 ? 'Continue →' : 'Generate My Program →'}
        </Button>
      </div>
    </div>
  );
}

// ─── WELCOME SPLASH STYLES ───
const welcomeStyles = {
  screen: {
    background: '#0F1647',
    minHeight: '100%',
    padding: '0',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 400,
    height: 400,
    background: 'radial-gradient(circle, rgba(232,83,58,0.25) 0%, transparent 70%)',
    top: '15%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
  },
  content: {
    padding: '60px 24px 80px',
    textAlign: 'center',
    position: 'relative',
    zIndex: 1,
  },
  logoIcon: { fontSize: 48, marginBottom: 12 },
  logo: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 56,
    letterSpacing: 6,
    color: '#E8533A',
    lineHeight: 1,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#9AA0B8',
    marginBottom: 32,
    fontWeight: 500,
  },
  descCard: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 24,
    padding: '18px 20px',
    marginBottom: 24,
    textAlign: 'center',
  },
  descText: {
    fontSize: 14,
    lineHeight: 1.7,
    color: 'rgba(244,241,235,0.8)',
  },
  features: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 32,
  },
  featurePill: {
    background: 'rgba(232,83,58,0.08)',
    border: '1px solid rgba(232,83,58,0.2)',
    borderRadius: 24,
    padding: '6px 14px',
    fontSize: 12,
    color: '#F4F1EB',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
};

// ─── ONBOARDING STEPS STYLES ───
const styles = {
  screen: {
    background: 'radial-gradient(ellipse at 50% 0%, rgba(232,83,58,0.15) 0%, #0F1647 50%)',
    minHeight: '100%',
    padding: '40px 0 100px',
  },
  content: { padding: '20px 24px 0' },
  question: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 26,
    letterSpacing: 0.5,
    color: '#F4F1EB',
    lineHeight: 1.2,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    color: '#9AA0B8',
    marginBottom: 20,
  },
  optionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: '14px 16px',
    marginBottom: 10,
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
    color: '#F4F1EB',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'all 0.2s',
  },
  optionText: {
    fontSize: 14,
    fontWeight: 500,
    flex: 1,
  },
  optionCheck: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    background: '#E8533A',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    color: 'white',
  },
  multiHint: {
    fontSize: 11,
    color: '#9AA0B8',
    marginTop: 4,
    textAlign: 'center',
  },
};
