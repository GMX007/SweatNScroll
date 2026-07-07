/**
 * FormForged Program Data
 * Movement patterns, program templates, goal configs, progression models.
 * The program engine (services/programEngine.js) turns these into a personalized plan.
 */

// ── Movement pattern mapping ──────────────────────────────────────────────
// Every exercise id in data/exercises.js is tagged with one primary pattern.
// difficultyRank: 1 = easiest in pattern, higher = harder (used for
// progressions/regressions within a pattern).
export const PATTERN_MAP = {
  // squat pattern
  'squat':            { pattern: 'squat', rank: 2 },
  'db-goblet-squat':  { pattern: 'squat', rank: 3 },
  'kb-goblet-squat':  { pattern: 'squat', rank: 3 },
  'band-squat':       { pattern: 'squat', rank: 2 },
  'wall-sit':         { pattern: 'squat', rank: 1 },
  'lunge':            { pattern: 'lunge', rank: 2 },
  'db-lunges':        { pattern: 'lunge', rank: 3 },

  // hinge pattern
  'glute-bridge':        { pattern: 'hinge', rank: 1 },
  'glute-bridge-hold':   { pattern: 'hinge', rank: 1 },
  'kb-deadlift':         { pattern: 'hinge', rank: 2 },
  'db-romanian-deadlift':{ pattern: 'hinge', rank: 3 },
  'kb-swing':            { pattern: 'hinge', rank: 4 },

  // horizontal push
  'knee-push-up':    { pattern: 'push-h', rank: 1 },
  'push-up':         { pattern: 'push-h', rank: 2 },
  'wide-push-up':    { pattern: 'push-h', rank: 3 },
  'db-chest-press':  { pattern: 'push-h', rank: 3 },
  'decline-push-up': { pattern: 'push-h', rank: 4 },

  // vertical push
  'db-lateral-raise':  { pattern: 'push-v', rank: 1 },
  'db-shoulder-press': { pattern: 'push-v', rank: 2 },
  'kb-press':          { pattern: 'push-v', rank: 3 },
  'pike-push-up':      { pattern: 'push-v', rank: 3 },

  // pull
  'band-pull-apart':  { pattern: 'pull', rank: 1 },
  'band-row':         { pattern: 'pull', rank: 2 },
  'db-bent-over-row': { pattern: 'pull', rank: 3 },
  'dead-hang':        { pattern: 'pull', rank: 2 },
  'chin-up':          { pattern: 'pull', rank: 4 },
  'pull-up':          { pattern: 'pull', rank: 5 },

  // core
  'plank':              { pattern: 'core', rank: 1 },
  'superman':           { pattern: 'core', rank: 1 },
  'bicycle-crunch':     { pattern: 'core', rank: 2 },
  'mountain-climber':   { pattern: 'core', rank: 3 },
  'hanging-knee-raise': { pattern: 'core', rank: 4 },
  'kb-turkish-getup':   { pattern: 'core', rank: 5 },

  // arm accessories
  'db-bicep-curl':      { pattern: 'arms', rank: 1 },
  'band-bicep-curl':    { pattern: 'arms', rank: 1 },
  'db-tricep-kickback': { pattern: 'arms', rank: 1 },
  'diamond-push-up':    { pattern: 'arms', rank: 3 },

  // barbell
  'bb-back-squat':         { pattern: 'squat', rank: 4 },
  'bb-lunge':              { pattern: 'lunge', rank: 4 },
  'bb-hip-thrust':         { pattern: 'hinge', rank: 3 },
  'bb-romanian-deadlift':  { pattern: 'hinge', rank: 4 },
  'bb-deadlift':           { pattern: 'hinge', rank: 5 },
  'bb-bench-press':        { pattern: 'push-h', rank: 5 },
  'bb-overhead-press':     { pattern: 'push-v', rank: 4 },
  'bb-row':                { pattern: 'pull', rank: 4 },

  // lower accessory / conditioning
  'calf-raise': { pattern: 'lower-acc', rank: 1 },
  'burpee':     { pattern: 'conditioning', rank: 3 },
};

export const PATTERN_LABELS = {
  'squat':        'Squat',
  'lunge':        'Lunge',
  'hinge':        'Hip Hinge',
  'push-h':       'Horizontal Push',
  'push-v':       'Vertical Push',
  'pull':         'Pull',
  'core':         'Core',
  'arms':         'Arms',
  'lower-acc':    'Lower Accessory',
  'conditioning': 'Conditioning',
};

// ── Goals ─────────────────────────────────────────────────────────────────
// setCount: sets per exercise. targetScale: scales the rep target
// (strength = fewer, crisper reps; endurance = more).
export const GOALS = {
  strength: { id: 'strength', label: 'Get Stronger',   setCount: 4, targetScale: 0.7,  emoji: '🏋️' },
  muscle:   { id: 'muscle',   label: 'Build Muscle',   setCount: 3, targetScale: 1.0,  emoji: '💪' },
  general:  { id: 'general',  label: 'General Fitness',setCount: 3, targetScale: 1.15, emoji: '⚡' },
};

// ── Experience levels ─────────────────────────────────────────────────────
// maxRank caps how hard an exercise the engine will pick initially.
export const EXPERIENCE = {
  beginner:     { id: 'beginner',     label: 'New to training',      maxRank: 2, activityLevel: 'beginner' },
  intermediate: { id: 'intermediate', label: 'Train sometimes',      maxRank: 4, activityLevel: 'moderate' },
  advanced:     { id: 'advanced',     label: 'Train consistently',   maxRank: 9, activityLevel: 'active' },
};

// ── Progression models ────────────────────────────────────────────────────
// custom: true → available in the program builder with per-exercise
// sets / rep ranges / weight (or %1RM) prescriptions.
export const PROGRESSION_MODELS = {
  'form-gated': {
    id: 'form-gated',
    label: 'Form-Gated',
    custom: false,
    description: 'You only progress when your form quality earns it. Poor form triggers easier variations and technique focus.',
  },
  'linear': {
    id: 'linear',
    label: 'Linear',
    custom: false,
    description: 'Small target increase every session. Simple and steady — form still gates big jumps.',
  },
  'undulating': {
    id: 'undulating',
    label: 'Undulating',
    custom: false,
    description: 'Alternates heavier/lighter days across the week to manage fatigue.',
  },
  'autoregulated': {
    id: 'autoregulated',
    label: 'Autoregulated',
    custom: false,
    description: 'Targets adjust based on how your last session actually went — completion and form together.',
  },
  'double': {
    id: 'double',
    label: 'Double Progression',
    custom: true,
    description: 'Fixed sets, a rep range (e.g. 8–12). Hit the top of the range on every set with clean form → weight goes up and reps reset to the bottom.',
  },
  'triple': {
    id: 'triple',
    label: 'Triple Progression',
    custom: true,
    description: 'Reps grow first, then sets (1–5), then weight. Top out the rep range → add a set. Top out sets → add weight, drop back down.',
  },
  'percent1rm': {
    id: 'percent1rm',
    label: '% of 1RM',
    custom: true,
    description: 'Intensity-based: each exercise is prescribed at a % of your one-rep max. 1RM can be entered manually or estimated from your logged sets.',
  },
};

// Models offered inside the program builder
export const BUILDER_MODELS = ['double', 'triple', 'percent1rm', 'form-gated'];

// ── Rep range presets (builder) ───────────────────────────────────────────
export const REP_RANGE_PRESETS = [
  { id: 'strength',  label: 'Strength 3–6',   min: 3,  max: 6 },
  { id: 'hypertrophy', label: 'Muscle 8–12',  min: 8,  max: 12 },
  { id: 'endurance', label: 'Endurance 12–20', min: 12, max: 20 },
];

export const SETS_MIN = 1;
export const SETS_MAX = 5;

// Weight handling (stored internally in lb)
export const WEIGHT_INCREMENT_LB = 5;      // default load jump on progression
export const WEIGHT_ROUND_LB = 2.5;        // round prescriptions to nearest
export const LB_PER_KG = 2.20462;

// Default %1RM by goal (starting point in the builder)
export const DEFAULT_PCT_1RM = { strength: 80, muscle: 72, general: 65 };

// ── Program day templates ─────────────────────────────────────────────────
// Each day is a list of pattern slots, in order. The engine fills each slot
// with a concrete exercise based on equipment, experience, and form profile.
export const DAY_TEMPLATES = {
  fullA: { name: 'Full Body A', focus: 'Squat + Push', slots: ['squat', 'push-h', 'pull', 'core'] },
  fullB: { name: 'Full Body B', focus: 'Hinge + Pull',  slots: ['hinge', 'pull', 'push-v', 'core'] },
  fullC: { name: 'Full Body C', focus: 'Mixed',         slots: ['lunge', 'push-h', 'hinge', 'core'] },
  upper: { name: 'Upper Body',  focus: 'Push + Pull',   slots: ['push-h', 'pull', 'push-v', 'arms'] },
  lower: { name: 'Lower Body',  focus: 'Legs + Core',   slots: ['squat', 'hinge', 'lunge', 'core'] },
  push:  { name: 'Push Day',    focus: 'Chest + Shoulders + Triceps', slots: ['push-h', 'push-v', 'arms', 'core'] },
  pullD: { name: 'Pull Day',    focus: 'Back + Biceps', slots: ['pull', 'pull', 'arms', 'core'] },
  engine:{ name: 'Engine Day',  focus: 'Conditioning',  slots: ['conditioning', 'squat', 'core', 'pull'] },
};

// daysPerWeek → ordered day template keys (2–6 days)
export const WEEK_SPLITS = {
  2: ['fullA', 'fullB'],
  3: ['fullA', 'fullB', 'fullC'],
  4: ['upper', 'lower', 'upper', 'lower'],
  5: ['upper', 'lower', 'fullC', 'upper', 'engine'],
  6: ['push', 'pullD', 'lower', 'push', 'pullD', 'lower'],
};

// ── Form-gating thresholds ────────────────────────────────────────────────
export const FORM_THRESHOLDS = {
  progress: 90,  // avg form score needed to earn a harder target/variation
  hold: 75,      // between hold and progress: keep target, focus on technique
  // below hold → regress: easier variation or reduced target
};

export const BLOCK_WEEKS = 4; // program block length before targets re-baseline
