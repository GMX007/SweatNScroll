/**
 * FormForge Program Engine
 * Generates equipment-aware programs, supports user-designed programs
 * (double / triple / %1RM progression), and adapts everything using
 * real form data from the camera.
 *
 * Core idea: the AI form score is a first-class programming input. It decides
 * when you progress, when you hold, and when you regress — on every model.
 */

import { exercises, getScaledTarget } from '../data/exercises';
import {
  PATTERN_MAP,
  GOALS,
  EXPERIENCE,
  DAY_TEMPLATES,
  WEEK_SPLITS,
  FORM_THRESHOLDS,
  SETS_MIN,
  SETS_MAX,
  WEIGHT_INCREMENT_LB,
  WEIGHT_ROUND_LB,
  LB_PER_KG,
  DEFAULT_PCT_1RM,
} from '../data/programs';

// ── Helpers ───────────────────────────────────────────────────────────────

export function getExerciseById(id) {
  return exercises.find((e) => e.id === id) || null;
}

export function isWeighted(exercise) {
  if (!exercise) return false;
  return ['Dumbbells', 'Kettlebell'].includes(exercise.equipment);
}

function allowedByEquipment(exercise, equipment = []) {
  const allowed = ['Bodyweight', ...equipment];
  return allowed.includes(exercise.equipment);
}

/** All exercises the user can do with their equipment (for the builder). */
export function getAvailableExercises(equipment = []) {
  return exercises.filter((e) => allowedByEquipment(e, equipment));
}

/** All exercises in a pattern the user can actually do, sorted easy → hard. */
export function getPatternPool(pattern, equipment = []) {
  return exercises
    .filter((e) => PATTERN_MAP[e.id]?.pattern === pattern)
    .filter((e) => allowedByEquipment(e, equipment))
    .sort((a, b) => (PATTERN_MAP[a.id]?.rank || 9) - (PATTERN_MAP[b.id]?.rank || 9));
}

/** Average of last N form scores for an exercise (null if no data). */
export function getFormAvg(formProfile, exerciseId, lastN = 3) {
  const scores = formProfile?.[exerciseId]?.scores || [];
  if (scores.length === 0) return null;
  const recent = scores.slice(-lastN);
  return Math.round(recent.reduce((s, v) => s + v, 0) / recent.length);
}

/** Append a form score to the profile (keeps last 10 per exercise). */
export function updateFormProfile(formProfile = {}, exerciseId, formScore) {
  const prev = formProfile[exerciseId]?.scores || [];
  const scores = [...prev, Math.round(formScore)].slice(-10);
  const avg = Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
  return {
    ...formProfile,
    [exerciseId]: { scores, avg, sessions: scores.length },
  };
}

// ── Weight / 1RM utilities (all weights stored in lb) ─────────────────────

export function roundWeight(lb) {
  return Math.round(lb / WEIGHT_ROUND_LB) * WEIGHT_ROUND_LB;
}

export function lbToDisplay(lb, units = 'lb') {
  if (lb == null) return null;
  return units === 'kg' ? Math.round((lb / LB_PER_KG) * 2) / 2 : lb;
}

export function displayToLb(value, units = 'lb') {
  if (value == null || value === '') return null;
  const n = Number(value);
  if (Number.isNaN(n)) return null;
  return units === 'kg' ? n * LB_PER_KG : n;
}

/** Epley estimated 1RM from a set. */
export function epley1RM(weightLb, reps) {
  if (!weightLb || !reps || reps <= 0) return null;
  if (reps === 1) return weightLb;
  return weightLb * (1 + reps / 30);
}

/** Effective 1RM: manual entry wins if present, else best estimate. */
export function getEffective1RM(oneRMs = {}, exerciseId) {
  const entry = oneRMs[exerciseId];
  if (!entry) return null;
  return entry.manual || entry.estimated || null;
}

/** Merge a new estimated 1RM (keeps the best recent estimate). */
export function updateEstimated1RM(oneRMs = {}, exerciseId, weightLb, reps, formScore = 100) {
  // Only trust sets with acceptable form.
  if (formScore < FORM_THRESHOLDS.hold) return oneRMs;
  const est = epley1RM(weightLb, Math.min(reps, 12)); // Epley unreliable past ~12 reps
  if (!est) return oneRMs;
  const prev = oneRMs[exerciseId] || {};
  const estimated = Math.max(prev.estimated || 0, roundWeight(est));
  return { ...oneRMs, [exerciseId]: { ...prev, estimated } };
}

// ── Exercise selection (auto-generation) ──────────────────────────────────

export function pickExercise(pattern, equipment, experienceId, formProfile = {}, excludeIds = []) {
  const exp = EXPERIENCE[experienceId] || EXPERIENCE.intermediate;
  let pool = getPatternPool(pattern, equipment).filter((e) => !excludeIds.includes(e.id));
  if (pool.length === 0) pool = getPatternPool(pattern, equipment);
  if (pool.length === 0) return null;

  let maxRank = exp.maxRank;
  const rankedWithForm = pool.map((e) => ({ e, avg: getFormAvg(formProfile, e.id) }));
  const anyExcellent = rankedWithForm.some(({ avg }) => avg !== null && avg >= FORM_THRESHOLDS.progress);
  if (anyExcellent) maxRank += 1;

  const candidates = pool.filter((e) => (PATTERN_MAP[e.id]?.rank || 9) <= maxRank);
  const usable = (candidates.length > 0 ? candidates : pool.slice(0, 1));

  for (let i = usable.length - 1; i >= 0; i -= 1) {
    const avg = getFormAvg(formProfile, usable[i].id);
    if (avg === null || avg >= FORM_THRESHOLDS.hold) return usable[i];
  }
  return usable[0];
}

export function getRegression(exerciseId, equipment) {
  const meta = PATTERN_MAP[exerciseId];
  if (!meta) return null;
  const pool = getPatternPool(meta.pattern, equipment);
  const easier = pool.filter((e) => (PATTERN_MAP[e.id]?.rank || 9) < meta.rank);
  return easier.length > 0 ? easier[easier.length - 1] : null;
}

export function getProgressionExercise(exerciseId, equipment, experienceId) {
  const meta = PATTERN_MAP[exerciseId];
  if (!meta) return null;
  const exp = EXPERIENCE[experienceId] || EXPERIENCE.intermediate;
  const pool = getPatternPool(meta.pattern, equipment);
  const harder = pool.filter(
    (e) => (PATTERN_MAP[e.id]?.rank || 9) > meta.rank && (PATTERN_MAP[e.id]?.rank || 9) <= exp.maxRank + 1
  );
  return harder.length > 0 ? harder[0] : null;
}

export function getSubstitute(exerciseId, equipment, experienceId, formProfile = {}) {
  const meta = PATTERN_MAP[exerciseId];
  if (!meta) return null;
  return pickExercise(meta.pattern, equipment, experienceId, formProfile, [exerciseId]);
}

// ── Targets (auto-generated programs) ─────────────────────────────────────

export function computeTarget(exercise, {
  gender = 'male',
  activityLevel = 'moderate',
  sessionsCompleted = 0,
  goal = 'muscle',
  model = 'form-gated',
  dayIndex = 0,
  formProfile = {},
  lastCompletionRatio = null,
} = {}) {
  const goalCfg = GOALS[goal] || GOALS.muscle;
  let target = getScaledTarget(exercise, gender, activityLevel, sessionsCompleted) * goalCfg.targetScale;

  if (model === 'undulating') {
    target *= dayIndex % 2 === 0 ? 1.1 : 0.85;
  } else if (model === 'linear') {
    target *= 1 + Math.min(0.15, sessionsCompleted * 0.005);
  } else if (model === 'autoregulated' && lastCompletionRatio !== null) {
    if (lastCompletionRatio >= 1) target *= 1.05;
    else if (lastCompletionRatio < 0.7) target *= 0.85;
  }

  const avg = getFormAvg(formProfile, exercise.id);
  if (avg !== null) {
    if (avg >= FORM_THRESHOLDS.progress) target *= 1.08;
    else if (avg < FORM_THRESHOLDS.hold) target *= 0.75;
  }

  target = Math.round(target);
  if (exercise.type === 'hold') return Math.max(10, Math.round(target / 5) * 5);
  return Math.max(3, target);
}

// ── Prescriptions (custom / builder programs) ─────────────────────────────

/**
 * What should the user actually do for this item today?
 * Returns { sets, repMin, repMax, targetReps, weightLb, pct }.
 */
export function getPrescription(item, { model = 'double', oneRMs = {}, formProfile = {} } = {}) {
  const exercise = getExerciseById(item.exerciseId);
  const isHold = exercise?.type === 'hold';
  const weighted = isWeighted(exercise);

  let sets = clampSets(item.sets);
  let repMin = item.repMin ?? (isHold ? 20 : 8);
  let repMax = item.repMax ?? (isHold ? 45 : 12);
  let weightLb = weighted ? (item.weightLb ?? null) : null;
  let pct = null;
  let targetReps = item.curReps ?? repMax;

  if (model === 'triple') {
    sets = clampSets(item.curSets ?? item.setsMin ?? sets);
  }

  if (model === 'percent1rm' && weighted) {
    pct = item.pct ?? DEFAULT_PCT_1RM.muscle;
    const oneRM = getEffective1RM(oneRMs, item.exerciseId);
    weightLb = oneRM ? roundWeight(oneRM * (pct / 100)) : (item.weightLb ?? null);
    targetReps = repMin; // %-based work uses the low end as the working target
  }

  // Form gate on load: poor recent form → drop intensity 10%.
  const avg = getFormAvg(formProfile, item.exerciseId);
  if (avg !== null && avg < FORM_THRESHOLDS.hold && weightLb) {
    weightLb = roundWeight(weightLb * 0.9);
  }

  return { sets, repMin, repMax, targetReps, weightLb, pct, isHold, weighted };
}

function clampSets(n) {
  return Math.min(SETS_MAX, Math.max(SETS_MIN, Number(n) || 3));
}

/**
 * Apply progression to a custom program item after a completed workout.
 * results: [{ reps, formScore, weightLb }]. Returns updated item.
 */
export function progressCustomItem(item, results, model, formProfile = {}) {
  if (!results || results.length === 0) return item;
  const exercise = getExerciseById(item.exerciseId);
  const weighted = isWeighted(exercise);
  const repMax = item.repMax ?? 12;
  const repMin = item.repMin ?? 8;
  const formAvg = Math.round(results.reduce((s, r) => s + (r.formScore || 0), 0) / results.length);
  const allTopped = results.every((r) => r.reps >= repMax);

  // Form gate first: bad form never progresses, and sheds load.
  if (formAvg < FORM_THRESHOLDS.hold) {
    if (weighted && item.weightLb) {
      return { ...item, weightLb: roundWeight(item.weightLb * 0.9), lastAdapt: 'regress' };
    }
    return { ...item, curReps: Math.max(repMin, (item.curReps ?? repMax) - 2), lastAdapt: 'regress' };
  }

  const formEarned = formAvg >= FORM_THRESHOLDS.progress;

  if (model === 'double') {
    if (allTopped && formEarned) {
      if (weighted && item.weightLb != null) {
        return { ...item, weightLb: item.weightLb + WEIGHT_INCREMENT_LB, curReps: repMin, lastAdapt: 'progress' };
      }
      // Bodyweight double progression: extend the rep range.
      return { ...item, repMax: repMax + 2, curReps: repMin, lastAdapt: 'progress' };
    }
    // Still climbing the range: nudge target reps up.
    const bestReps = Math.max(...results.map((r) => r.reps));
    return { ...item, curReps: Math.min(repMax, Math.max(repMin, bestReps + 1)), lastAdapt: allTopped ? 'technique' : 'hold' };
  }

  if (model === 'triple') {
    const setsMin = clampSets(item.setsMin ?? 2);
    const setsMax = clampSets(item.setsMax ?? item.sets ?? 4);
    const curSets = clampSets(item.curSets ?? setsMin);
    if (allTopped && formEarned) {
      if (curSets < setsMax) {
        return { ...item, curSets: curSets + 1, curReps: repMin, lastAdapt: 'progress' };
      }
      if (weighted && item.weightLb != null) {
        return { ...item, weightLb: item.weightLb + WEIGHT_INCREMENT_LB, curSets: setsMin, curReps: repMin, lastAdapt: 'progress' };
      }
      return { ...item, repMax: repMax + 2, curSets: setsMin, curReps: repMin, lastAdapt: 'progress' };
    }
    const bestReps = Math.max(...results.map((r) => r.reps));
    return { ...item, curReps: Math.min(repMax, Math.max(repMin, bestReps + 1)), lastAdapt: 'hold' };
  }

  if (model === 'percent1rm') {
    // Weight auto-derives from 1RM (which grows via logged estimates).
    // Bump percentage slightly when everything topped out with great form.
    if (allTopped && formEarned && item.pct != null && item.pct < 90) {
      return { ...item, pct: item.pct + 2.5, lastAdapt: 'progress' };
    }
    return { ...item, lastAdapt: formEarned ? 'technique' : 'hold' };
  }

  return item;
}

// ── Program generation ────────────────────────────────────────────────────

export function generateProgram({
  goal = 'muscle',
  experience = 'intermediate',
  daysPerWeek = 3,
  equipment = [],
  formProfile = {},
} = {}) {
  const split = WEEK_SPLITS[daysPerWeek] || WEEK_SPLITS[3];
  const goalCfg = GOALS[goal] || GOALS.muscle;

  const days = split.map((key, di) => {
    const tpl = DAY_TEMPLATES[key];
    const used = [];
    const items = tpl.slots
      .map((pattern) => {
        const ex = pickExercise(pattern, equipment, experience, formProfile, used);
        if (!ex) return null;
        used.push(ex.id);
        return { pattern, exerciseId: ex.id, sets: goalCfg.setCount };
      })
      .filter(Boolean);
    return { key: `${key}-${di}`, templateKey: key, name: tpl.name, focus: tpl.focus, items };
  });

  return {
    name: `${goalCfg.label} · ${daysPerWeek}x / week`,
    goal,
    daysPerWeek,
    custom: false,
    days,
    createdAt: Date.now(),
  };
}

/**
 * Build a custom (user-designed) program from builder draft days.
 * draftDays: [{ name, items: [{ exerciseId, sets, setsMin, setsMax, repMin, repMax, weightLb, pct }] }]
 */
export function buildCustomProgram(draftDays, model, goal = 'muscle') {
  const days = draftDays
    .map((day, di) => ({
      key: `custom-${di}`,
      templateKey: 'custom',
      name: day.name || `Day ${di + 1}`,
      focus: day.focus || 'Custom',
      items: (day.items || [])
        .filter((it) => it.exerciseId)
        .map((it) => ({
          pattern: PATTERN_MAP[it.exerciseId]?.pattern || 'custom',
          exerciseId: it.exerciseId,
          sets: clampSets(it.sets),
          setsMin: it.setsMin != null ? clampSets(it.setsMin) : undefined,
          setsMax: it.setsMax != null ? clampSets(it.setsMax) : undefined,
          curSets: it.setsMin != null ? clampSets(it.setsMin) : undefined,
          repMin: it.repMin,
          repMax: it.repMax,
          curReps: it.repMin,
          weightLb: it.weightLb ?? null,
          pct: it.pct ?? null,
        })),
    }))
    .filter((d) => d.items.length > 0);

  return {
    name: `My Program · ${days.length}x / week`,
    goal,
    daysPerWeek: days.length,
    custom: true,
    model,
    days,
    createdAt: Date.now(),
  };
}

// ── Adaptation (after each exercise / workout) ────────────────────────────

export function getAdaptation(exerciseId, formProfile, equipment, experienceId) {
  const avg = getFormAvg(formProfile, exerciseId);
  const sessions = formProfile?.[exerciseId]?.sessions || 0;
  const exercise = getExerciseById(exerciseId);
  const name = exercise?.name || 'this exercise';

  if (avg === null || sessions < 2) {
    return { action: 'hold', message: `Building your form profile for ${name} — keep logging clean reps.`, swapToId: null };
  }
  if (avg >= FORM_THRESHOLDS.progress) {
    const harder = getProgressionExercise(exerciseId, equipment, experienceId);
    return harder
      ? { action: 'progress', message: `Form earned it: ${harder.name} unlocked as your next progression.`, swapToId: harder.id }
      : { action: 'progress', message: `Excellent form (${avg}%). Targets will increase next session.`, swapToId: null };
  }
  if (avg >= FORM_THRESHOLDS.hold) {
    return { action: 'technique', message: `Form at ${avg}% — holding your target while you sharpen technique.`, swapToId: null };
  }
  const easier = getRegression(exerciseId, equipment);
  return easier
    ? { action: 'regress', message: `Form slipping (${avg}%). Switching to ${easier.name} to rebuild the pattern safely.`, swapToId: easier.id }
    : { action: 'regress', message: `Form slipping (${avg}%). Target reduced — quality over quantity.`, swapToId: null };
}

/**
 * Apply adaptations to a program after a workout completes.
 * - Auto programs: swap exercises the form data says to swap.
 * - Custom programs: run per-item double/triple/%1RM progression on the
 *   day that was just completed (workoutItems carries the set results).
 */
export function adaptProgram(program, formProfile, equipment, experienceId, completed = null) {
  if (!program) return program;

  if (program.custom) {
    if (!completed) return program;
    const days = program.days.map((day, di) => {
      if (di !== completed.dayIndex % program.days.length) return day;
      return {
        ...day,
        items: day.items.map((item) => {
          const done = completed.items.find((w) => w.exerciseId === item.exerciseId);
          if (!done || done.results.length === 0) return item;
          return progressCustomItem(item, done.results, program.model, formProfile);
        }),
      };
    });
    return { ...program, days, adaptedAt: Date.now() };
  }

  const days = program.days.map((day) => ({
    ...day,
    items: day.items.map((item) => {
      const adaptation = getAdaptation(item.exerciseId, formProfile, equipment, experienceId);
      if ((adaptation.action === 'regress' || adaptation.action === 'progress') && adaptation.swapToId) {
        return { ...item, exerciseId: adaptation.swapToId, adaptedFrom: item.exerciseId, adaptedWhy: adaptation.action };
      }
      return item;
    }),
  }));
  return { ...program, days, adaptedAt: Date.now() };
}

/** Overall movement quality score (weighted avg across profile). */
export function getMovementQuality(formProfile = {}) {
  const entries = Object.values(formProfile);
  if (entries.length === 0) return null;
  const total = entries.reduce((s, e) => s + (e.avg || 0), 0);
  return Math.round(total / entries.length);
}
