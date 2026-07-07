/**
 * FormForged Exercise Verifier
 * Applies exercise-specific form rules to MoveNet keypoints.
 * Every exercise in `exercises.js` maps here (bodyweight + equipment).
 * Equipment moves use closest pose heuristics (elbow angle, squat, hinge, etc.).
 */

import { getKeypoint, calculateAngle, calculateAlignment } from './poseDetection';

/**
 * Form feedback result
 * @typedef {Object} FormResult
 * @property {'green'|'amber'|'red'|'pause'} level
 * @property {string} message
 * @property {boolean} repCompleted - true if a full rep was just completed
 * @property {number} effortScore - 0 to 1 (1 = perfect form)
 * @property {boolean} [holdValid] - for hold exercises, whether hold counts
 */

// State trackers for rep counting
const repState = {
  phase: 'up', // 'up' or 'down'
  lastAngle: 180,
  formBreakStart: null,
};

export function resetRepState() {
  repState.phase = 'up';
  repState.lastAngle = 180;
  repState.formBreakStart = null;
}

// ─── HELPERS ───

const CANT_SEE = { level: 'amber', message: "Adjust camera — can't see full body", repCompleted: false, effortScore: 0 };

function visible(...points) {
  return points.every(p => p != null);
}

// ─── FORM BREAK DETECTION ───
function checkFormBreak(result) {
  const now = Date.now();
  if (!repState.formBreakStart) {
    repState.formBreakStart = now;
  }
  const breakDuration = (now - repState.formBreakStart) / 1000;

  if (breakDuration > 5) {
    return {
      ...result,
      level: 'pause',
      message: 'Form breaking down — take a breath',
    };
  }

  return result;
}

function clearFormBreak() {
  repState.formBreakStart = null;
}

// ─────────────────────────────────────────────
// PUSH-UP FAMILY (push-up, knee, wide, diamond, decline, pike)
// All share the same elbow-angle rep counting and hip-alignment check.
// ─────────────────────────────────────────────

function verifyPushUpFamily(pose, { downAngle = 95, upAngle = 160, hipTolerance = 15, useKnee = false, pikeMode = false } = {}) {
  const shoulder = getKeypoint(pose, 'left_shoulder');
  const elbow = getKeypoint(pose, 'left_elbow');
  const wrist = getKeypoint(pose, 'left_wrist');
  const hip = getKeypoint(pose, 'left_hip');
  const lowerRef = useKnee ? getKeypoint(pose, 'left_knee') : getKeypoint(pose, 'left_ankle');

  if (!visible(shoulder, elbow, wrist, hip, lowerRef)) {
    return CANT_SEE;
  }

  const elbowAngle = calculateAngle(shoulder, elbow, wrist);
  const hipDeviation = calculateAlignment(shoulder, hip, lowerRef);

  // Pike push-ups expect elevated hips — invert the check
  const maxHipDev = pikeMode ? hipTolerance + 15 : hipTolerance;
  const hipBadThreshold = maxHipDev + 10;

  // Check hip alignment
  if (!pikeMode && hipDeviation > hipBadThreshold) {
    return checkFormBreak({
      level: 'red',
      message: hipDeviation > hipBadThreshold + 10 ? 'Hips dropping — squeeze your core' : 'Keep hips level',
      repCompleted: false,
      effortScore: 0,
    });
  }

  // Rep counting: detect down phase then up phase
  let repCompleted = false;
  if (elbowAngle < downAngle && repState.phase === 'up') {
    repState.phase = 'down';
  }
  if (elbowAngle > upAngle && repState.phase === 'down') {
    repState.phase = 'up';
    repCompleted = true;
  }

  // Amber form check
  if (!pikeMode && hipDeviation > hipTolerance) {
    return {
      level: 'amber',
      message: useKnee ? 'Keep body straight from head to knees' : 'Keep your body aligned',
      repCompleted,
      effortScore: 0.8,
    };
  }

  clearFormBreak();
  return {
    level: 'green',
    message: 'Good form — keep it up',
    repCompleted,
    effortScore: 1,
  };
}

export function verifyPushUp(pose) {
  return verifyPushUpFamily(pose, { downAngle: 80, upAngle: 145, hipTolerance: 25 });
}

export function verifyKneePushUp(pose) {
  return verifyPushUpFamily(pose, { downAngle: 80, upAngle: 145, hipTolerance: 25, useKnee: true });
}

export function verifyWidePushUp(pose) {
  return verifyPushUpFamily(pose, { downAngle: 80, upAngle: 145, hipTolerance: 25 });
}

export function verifyDiamondPushUp(pose) {
  return verifyPushUpFamily(pose, { downAngle: 85, upAngle: 145, hipTolerance: 25 });
}

export function verifyDeclinePushUp(pose) {
  return verifyPushUpFamily(pose, { downAngle: 80, upAngle: 145, hipTolerance: 25 });
}

export function verifyPikePushUp(pose) {
  return verifyPushUpFamily(pose, { downAngle: 90, upAngle: 155, hipTolerance: 30, pikeMode: true });
}

// ─────────────────────────────────────────────
// SQUAT VERIFIER
// ─────────────────────────────────────────────

export function verifySquat(pose) {
  const hip = getKeypoint(pose, 'left_hip');
  const knee = getKeypoint(pose, 'left_knee');
  const ankle = getKeypoint(pose, 'left_ankle');
  const shoulder = getKeypoint(pose, 'left_shoulder');

  if (!visible(hip, knee, ankle, shoulder)) return CANT_SEE;

  const kneeAngle = calculateAngle(hip, knee, ankle);
  const torsoAngle = calculateAngle({ x: shoulder.x, y: shoulder.y - 100 }, shoulder, hip);

  let repCompleted = false;
  if (kneeAngle < 115 && repState.phase === 'up') {
    repState.phase = 'down';
  }
  if (kneeAngle > 150 && repState.phase === 'down') {
    repState.phase = 'up';
    repCompleted = true;
  }

  if (kneeAngle > 125 && repState.phase === 'down') {
    return { level: 'amber', message: 'Go deeper — thighs parallel', repCompleted: false, effortScore: 0.8 };
  }

  if (torsoAngle > 50) {
    return checkFormBreak({ level: 'red', message: "Chest up — don't lean forward", repCompleted: false, effortScore: 0 });
  }

  clearFormBreak();
  return { level: 'green', message: 'Good form — keep it up', repCompleted, effortScore: 1 };
}

// ─────────────────────────────────────────────
// LUNGE VERIFIER
// ─────────────────────────────────────────────

export function verifyLunge(pose) {
  const hip = getKeypoint(pose, 'left_hip');
  const knee = getKeypoint(pose, 'left_knee');
  const ankle = getKeypoint(pose, 'left_ankle');
  const shoulder = getKeypoint(pose, 'left_shoulder');

  if (!visible(hip, knee, ankle, shoulder)) return CANT_SEE;

  const kneeAngle = calculateAngle(hip, knee, ankle);
  const torsoDeviation = calculateAlignment({ x: shoulder.x, y: shoulder.y - 50 }, shoulder, hip);

  let repCompleted = false;
  if (kneeAngle < 115 && repState.phase === 'up') {
    repState.phase = 'down';
  }
  if (kneeAngle > 150 && repState.phase === 'down') {
    repState.phase = 'up';
    repCompleted = true;
  }

  // Knee going past toes check (approximate: knee.x far ahead of ankle.x)
  if (Math.abs(knee.x - ankle.x) > 80) {
    return checkFormBreak({ level: 'red', message: 'Knee over toes — step wider', repCompleted: false, effortScore: 0 });
  }

  if (torsoDeviation > 20) {
    return { level: 'amber', message: 'Keep torso upright', repCompleted, effortScore: 0.8 };
  }

  clearFormBreak();
  return { level: 'green', message: 'Good form — keep it up', repCompleted, effortScore: 1 };
}

// ─────────────────────────────────────────────
// HOLD EXERCISES (plank, wall-sit, glute-bridge-hold, superman)
// ─────────────────────────────────────────────

export function verifyPlank(pose) {
  const shoulder = getKeypoint(pose, 'left_shoulder');
  const hip = getKeypoint(pose, 'left_hip');
  const ankle = getKeypoint(pose, 'left_ankle');

  if (!visible(shoulder, hip, ankle)) {
    return { ...CANT_SEE, holdValid: false };
  }

  const hipDeviation = calculateAlignment(shoulder, hip, ankle);

  if (hipDeviation > 20) {
    return checkFormBreak({
      level: 'red',
      message: hip.y > shoulder.y + 30 ? 'Hips sagging — engage your core' : 'Hips too high — flatten out',
      repCompleted: false, effortScore: 0, holdValid: false,
    });
  }

  if (hipDeviation > 10) {
    return { level: 'amber', message: 'Straighten your body line', repCompleted: false, effortScore: 0.8, holdValid: true };
  }

  clearFormBreak();
  return { level: 'green', message: 'Good form — hold steady', repCompleted: false, effortScore: 1, holdValid: true };
}

export function verifyWallSit(pose) {
  const hip = getKeypoint(pose, 'left_hip');
  const knee = getKeypoint(pose, 'left_knee');
  const ankle = getKeypoint(pose, 'left_ankle');
  const shoulder = getKeypoint(pose, 'left_shoulder');

  if (!visible(hip, knee, ankle, shoulder)) {
    return { ...CANT_SEE, holdValid: false };
  }

  const kneeAngle = calculateAngle(hip, knee, ankle);
  const backAlignment = calculateAlignment(shoulder, hip, { x: hip.x, y: hip.y + 100 }); // vertical check

  // Knees should be around 90 degrees
  if (kneeAngle > 120) {
    return checkFormBreak({
      level: 'red', message: 'Slide lower — 90° knee bend', repCompleted: false, effortScore: 0, holdValid: false,
    });
  }

  if (kneeAngle > 105) {
    return { level: 'amber', message: 'Go a bit lower', repCompleted: false, effortScore: 0.8, holdValid: true };
  }

  // Back should be fairly upright (against imaginary wall)
  if (backAlignment > 25) {
    return { level: 'amber', message: 'Press back flat against the wall', repCompleted: false, effortScore: 0.8, holdValid: true };
  }

  clearFormBreak();
  return { level: 'green', message: 'Good form — hold it', repCompleted: false, effortScore: 1, holdValid: true };
}

export function verifyGluteBridgeHold(pose) {
  const hip = getKeypoint(pose, 'left_hip');
  const knee = getKeypoint(pose, 'left_knee');
  const ankle = getKeypoint(pose, 'left_ankle');
  const shoulder = getKeypoint(pose, 'left_shoulder');

  if (!visible(hip, knee, ankle, shoulder)) {
    return { ...CANT_SEE, holdValid: false };
  }

  // Hip should be elevated — shoulder-hip-knee roughly aligned
  const alignment = calculateAlignment(shoulder, hip, knee);

  if (alignment > 20) {
    return checkFormBreak({
      level: 'red', message: 'Push hips higher — squeeze glutes', repCompleted: false, effortScore: 0, holdValid: false,
    });
  }

  if (alignment > 10) {
    return { level: 'amber', message: 'Lift hips a bit higher', repCompleted: false, effortScore: 0.8, holdValid: true };
  }

  clearFormBreak();
  return { level: 'green', message: 'Good hold — squeeze glutes', repCompleted: false, effortScore: 1, holdValid: true };
}

export function verifySuperman(pose) {
  const shoulder = getKeypoint(pose, 'left_shoulder');
  const hip = getKeypoint(pose, 'left_hip');
  const ankle = getKeypoint(pose, 'left_ankle');
  const elbow = getKeypoint(pose, 'left_elbow');

  if (!visible(shoulder, hip, ankle)) {
    return { ...CANT_SEE, holdValid: false };
  }

  // Arms and legs should be elevated — shoulder and ankle above hip level
  const shoulderLift = hip.y - shoulder.y; // positive = shoulder is above hip
  const ankleLift = hip.y - ankle.y;

  // Need at least some lift
  if (shoulderLift < 5 && ankleLift < 5) {
    return checkFormBreak({
      level: 'red', message: 'Lift arms and legs off the ground', repCompleted: false, effortScore: 0, holdValid: false,
    });
  }

  if (shoulderLift < 10 || ankleLift < 10) {
    return { level: 'amber', message: 'Reach higher with arms and legs', repCompleted: false, effortScore: 0.8, holdValid: true };
  }

  clearFormBreak();
  return { level: 'green', message: 'Great hold — keep extending', repCompleted: false, effortScore: 1, holdValid: true };
}

// ─────────────────────────────────────────────
// REP EXERCISES (glute-bridge, burpee, mountain-climber, bicycle-crunch, calf-raise)
// ─────────────────────────────────────────────

export function verifyGluteBridge(pose) {
  const hip = getKeypoint(pose, 'left_hip');
  const knee = getKeypoint(pose, 'left_knee');
  const ankle = getKeypoint(pose, 'left_ankle');
  const shoulder = getKeypoint(pose, 'left_shoulder');

  if (!visible(hip, knee, ankle, shoulder)) return CANT_SEE;

  // Rep counting based on hip height relative to shoulder
  const hipHeight = shoulder.y - hip.y; // positive when hip is above shoulder (lying on back, hips raised)
  const alignment = calculateAlignment(shoulder, hip, knee);

  let repCompleted = false;
  // "up" = hips lowered; "down" = hips raised (naming follows rep convention)
  if (alignment < 12 && repState.phase === 'up') {
    repState.phase = 'down'; // hips are raised
  }
  if (alignment > 20 && repState.phase === 'down') {
    repState.phase = 'up'; // hips lowered back
    repCompleted = true;
  }

  if (alignment > 25) {
    return checkFormBreak({ level: 'red', message: 'Push hips higher', repCompleted: false, effortScore: 0 });
  }

  if (alignment > 15) {
    return { level: 'amber', message: 'Squeeze glutes at the top', repCompleted, effortScore: 0.8 };
  }

  clearFormBreak();
  return { level: 'green', message: 'Good form — keep it up', repCompleted, effortScore: 1 };
}

export function verifyBurpee(pose) {
  const shoulder = getKeypoint(pose, 'left_shoulder');
  const hip = getKeypoint(pose, 'left_hip');
  const ankle = getKeypoint(pose, 'left_ankle');
  const elbow = getKeypoint(pose, 'left_elbow');

  if (!visible(shoulder, hip, ankle)) return CANT_SEE;

  // Burpee detection: track vertical range of shoulder position
  // "down" = plank/push-up position (shoulder low), "up" = standing/jump (shoulder high)
  const shoulderHeight = ankle.y - shoulder.y; // bigger = standing taller

  let repCompleted = false;
  if (shoulderHeight < 80 && repState.phase === 'up') {
    repState.phase = 'down'; // went to ground
  }
  if (shoulderHeight > 200 && repState.phase === 'down') {
    repState.phase = 'up'; // stood back up
    repCompleted = true;
  }

  // Hip alignment in plank portion
  const hipDev = calculateAlignment(shoulder, hip, ankle);
  if (repState.phase === 'down' && hipDev > 30) {
    return { level: 'amber', message: 'Keep body tight in plank', repCompleted: false, effortScore: 0.8 };
  }

  clearFormBreak();
  return { level: 'green', message: 'Good pace — keep moving', repCompleted, effortScore: 1 };
}

export function verifyMountainClimber(pose) {
  const ls = getKeypoint(pose, 'left_shoulder');
  const rs = getKeypoint(pose, 'right_shoulder');
  const lh = getKeypoint(pose, 'left_hip');
  const rh = getKeypoint(pose, 'right_hip');
  const lk = getKeypoint(pose, 'left_knee');
  const rk = getKeypoint(pose, 'right_knee');

  const shoulder = ls && rs
    ? { x: (ls.x + rs.x) / 2, y: (ls.y + rs.y) / 2 }
    : ls || rs;

  if (!visible(shoulder, lh, rh)) return CANT_SEE;
  if (!lk && !rk) return CANT_SEE;

  // Rep counting: either knee can drive (alternating climbers). hip.y - knee.y is positive
  // when the knee moves up toward the chest (screen coords, y grows downward).
  const leftDrive = lk ? lh.y - lk.y : -1e6;
  const rightDrive = rk ? rh.y - rk.y : -1e6;
  const kneeDriveMax = Math.max(leftDrive, rightDrive);

  let repCompleted = false;
  const DRIVE_IN = 12;
  const DRIVE_RESET = 6;
  if (kneeDriveMax > DRIVE_IN && repState.phase === 'up') {
    repState.phase = 'down';
  }
  if (kneeDriveMax < DRIVE_RESET && repState.phase === 'down') {
    repState.phase = 'up';
    repCompleted = true;
  }

  // Shoulder–hip–ankle straight line breaks whenever one knee is tucked — that falsely
  // triggered "bad form" and cleared reps. Use mid-hip + vertical reference instead.
  const midHip = { x: (lh.x + rh.x) / 2, y: (lh.y + rh.y) / 2 };
  const verticalRef = { x: midHip.x, y: midHip.y + 100 };
  const torsoStability = calculateAlignment(shoulder, midHip, verticalRef);

  if (torsoStability > 42) {
    return checkFormBreak({
      level: 'red',
      message: 'Keep torso steady — stack shoulders over hips',
      repCompleted: false,
      effortScore: 0,
    });
  }
  if (torsoStability > 28) {
    return { level: 'amber', message: 'Brace your core — stay stable', repCompleted, effortScore: 0.8 };
  }

  clearFormBreak();
  return { level: 'green', message: 'Good form — keep it up', repCompleted, effortScore: 1 };
}

export function verifyBicycleCrunch(pose) {
  const shoulder = getKeypoint(pose, 'left_shoulder');
  const hip = getKeypoint(pose, 'left_hip');
  const knee = getKeypoint(pose, 'left_knee');
  const elbow = getKeypoint(pose, 'left_elbow');

  if (!visible(shoulder, hip, knee, elbow)) return CANT_SEE;

  // Track rotation: elbow moving toward opposite knee
  const elbowKneeDist = Math.sqrt(
    Math.pow(elbow.x - knee.x, 2) + Math.pow(elbow.y - knee.y, 2)
  );

  let repCompleted = false;
  if (elbowKneeDist < 80 && repState.phase === 'up') {
    repState.phase = 'down'; // elbow close to knee
  }
  if (elbowKneeDist > 150 && repState.phase === 'down') {
    repState.phase = 'up';
    repCompleted = true;
  }

  // Shoulder should stay lifted (not lying flat)
  const shoulderLift = hip.y - shoulder.y;
  if (shoulderLift < 15) {
    return { level: 'amber', message: 'Lift shoulders off the ground', repCompleted, effortScore: 0.8 };
  }

  clearFormBreak();
  return { level: 'green', message: 'Good form — keep rotating', repCompleted, effortScore: 1 };
}

export function verifyCalfRaise(pose) {
  const ankle = getKeypoint(pose, 'left_ankle');
  const knee = getKeypoint(pose, 'left_knee');
  const hip = getKeypoint(pose, 'left_hip');
  const shoulder = getKeypoint(pose, 'left_shoulder');

  if (!visible(ankle, knee, hip, shoulder)) return CANT_SEE;

  // Calf raise: track ankle vertical position (rises when on tiptoes)
  // Use ankle-to-knee distance change as proxy
  const ankleKneeDist = Math.abs(knee.y - ankle.y);

  let repCompleted = false;
  // Shorter distance = calf raised (ankle comes up toward knee)
  if (ankleKneeDist < repState.lastAngle * 0.85 && repState.phase === 'up') {
    repState.phase = 'down'; // raised up
  }
  if (ankleKneeDist > repState.lastAngle * 0.95 && repState.phase === 'down') {
    repState.phase = 'up'; // lowered
    repCompleted = true;
  }
  repState.lastAngle = ankleKneeDist || repState.lastAngle;

  // Posture check — should be standing upright
  const bodyAlignment = calculateAlignment(shoulder, hip, ankle);
  if (bodyAlignment > 15) {
    return { level: 'amber', message: 'Stand tall — don\'t lean', repCompleted, effortScore: 0.8 };
  }

  clearFormBreak();
  return { level: 'green', message: 'Good form — full range of motion', repCompleted, effortScore: 1 };
}

// ─────────────────────────────────────────────
// EQUIPMENT & SHARED ARM / HINGE HEURISTICS
// MoveNet does not see weights — reps track visible joint motion only.
// ─────────────────────────────────────────────

/** Curl / row / pull-up pattern: extended → flexed → extended = 1 rep */
function verifyElbowFlexCycle(pose, { contractBelow = 95, extendAbove = 145, cantSeeMsg = "Adjust camera — show your arm" } = {}) {
  const shoulder = getKeypoint(pose, 'left_shoulder');
  const elbow = getKeypoint(pose, 'left_elbow');
  const wrist = getKeypoint(pose, 'left_wrist');
  if (!visible(shoulder, elbow, wrist)) {
    return { level: 'amber', message: cantSeeMsg, repCompleted: false, effortScore: 0 };
  }
  const elbowAngle = calculateAngle(shoulder, elbow, wrist);
  let repCompleted = false;
  if (elbowAngle < contractBelow && repState.phase === 'up') {
    repState.phase = 'down';
  }
  if (elbowAngle > extendAbove && repState.phase === 'down') {
    repState.phase = 'up';
    repCompleted = true;
  }
  clearFormBreak();
  return { level: 'green', message: 'Good form — keep it up', repCompleted, effortScore: 1 };
}

/** Tricep kickback: bent → straight → bent = 1 rep */
function verifyElbowExtensionCycle(pose, { bentBelow = 120, straightAbove = 148 } = {}) {
  const shoulder = getKeypoint(pose, 'left_shoulder');
  const elbow = getKeypoint(pose, 'left_elbow');
  const wrist = getKeypoint(pose, 'left_wrist');
  if (!visible(shoulder, elbow, wrist)) {
    return { level: 'amber', message: "Adjust camera — show your working arm", repCompleted: false, effortScore: 0 };
  }
  const elbowAngle = calculateAngle(shoulder, elbow, wrist);
  let repCompleted = false;
  if (elbowAngle > straightAbove && repState.phase === 'up') {
    repState.phase = 'down';
  }
  if (elbowAngle < bentBelow && repState.phase === 'down') {
    repState.phase = 'up';
    repCompleted = true;
  }
  clearFormBreak();
  return { level: 'green', message: 'Good form — keep it up', repCompleted, effortScore: 1 };
}

/** RDL / KB deadlift / swing: hinge at hip (angle at hip between shoulder–hip–knee) */
function verifyHipHingeReps(pose, { hingeDeep = 155, hingeTall = 172 } = {}) {
  const shoulder = getKeypoint(pose, 'left_shoulder');
  const hip = getKeypoint(pose, 'left_hip');
  const knee = getKeypoint(pose, 'left_knee');
  if (!visible(shoulder, hip, knee)) return CANT_SEE;
  const hipAngle = calculateAngle(shoulder, hip, knee);
  let repCompleted = false;
  if (hipAngle < hingeDeep && repState.phase === 'up') {
    repState.phase = 'down';
  }
  if (hipAngle > hingeTall && repState.phase === 'down') {
    repState.phase = 'up';
    repCompleted = true;
  }
  if (hipAngle < hingeDeep - 25) {
    return checkFormBreak({ level: 'red', message: 'Keep a flat back — hinge, don’t round', repCompleted: false, effortScore: 0 });
  }
  clearFormBreak();
  return { level: 'green', message: 'Good form — keep it up', repCompleted, effortScore: 1 };
}

export function verifyDeadHang(pose) {
  const shoulder = getKeypoint(pose, 'left_shoulder');
  const elbow = getKeypoint(pose, 'left_elbow');
  const wrist = getKeypoint(pose, 'left_wrist');
  if (!visible(shoulder, elbow, wrist)) {
    return { ...CANT_SEE, holdValid: false };
  }
  const elbowAngle = calculateAngle(shoulder, elbow, wrist);
  if (elbowAngle < 145) {
    return checkFormBreak({
      level: 'red',
      message: 'Arms should stay straight — full hang',
      repCompleted: false,
      effortScore: 0,
      holdValid: false,
    });
  }
  if (elbowAngle < 155) {
    return { level: 'amber', message: 'Lock elbows out gently', repCompleted: false, effortScore: 0.8, holdValid: true };
  }
  clearFormBreak();
  return { level: 'green', message: 'Good hang — stay steady', repCompleted: false, effortScore: 1, holdValid: true };
}

export function verifyHangingKneeRaise(pose) {
  const shoulder = getKeypoint(pose, 'left_shoulder');
  const hip = getKeypoint(pose, 'left_hip');
  const knee = getKeypoint(pose, 'left_knee');
  if (!visible(shoulder, hip, knee)) return CANT_SEE;
  const drive = hip.y - knee.y;
  let repCompleted = false;
  if (drive > 18 && repState.phase === 'up') {
    repState.phase = 'down';
  }
  if (drive < 2 && repState.phase === 'down') {
    repState.phase = 'up';
    repCompleted = true;
  }
  clearFormBreak();
  return { level: 'green', message: 'Good form — keep it up', repCompleted, effortScore: 1 };
}

export function verifyBandPullApart(pose) {
  const ls = getKeypoint(pose, 'left_shoulder');
  const rs = getKeypoint(pose, 'right_shoulder');
  const lw = getKeypoint(pose, 'left_wrist');
  const rw = getKeypoint(pose, 'right_wrist');
  if (!visible(ls, rs, lw, rw)) {
    return { level: 'amber', message: 'Face the camera — arms and shoulders visible', repCompleted: false, effortScore: 0 };
  }
  const shoulderW = Math.abs(rs.x - ls.x) || 40;
  const spread = Math.abs(rw.x - lw.x);
  const ratio = spread / shoulderW;
  let repCompleted = false;
  if (ratio > 1.85 && repState.phase === 'up') {
    repState.phase = 'down';
  }
  if (ratio < 1.4 && repState.phase === 'down') {
    repState.phase = 'up';
    repCompleted = true;
  }
  clearFormBreak();
  return { level: 'green', message: 'Good form — keep it up', repCompleted, effortScore: 1 };
}

/** Side view: wrist rises relative to shoulder when arm abducts */
export function verifyLateralRaise(pose) {
  const shoulder = getKeypoint(pose, 'left_shoulder');
  const wrist = getKeypoint(pose, 'left_wrist');
  const elbow = getKeypoint(pose, 'left_elbow');
  if (!visible(shoulder, wrist, elbow)) {
    return { level: 'amber', message: "Adjust camera — show working arm", repCompleted: false, effortScore: 0 };
  }
  const lift = shoulder.y - wrist.y;
  let repCompleted = false;
  if (lift > 22 && repState.phase === 'up') {
    repState.phase = 'down';
  }
  if (lift < 6 && repState.phase === 'down') {
    repState.phase = 'up';
    repCompleted = true;
  }
  clearFormBreak();
  return { level: 'green', message: 'Good form — keep it up', repCompleted, effortScore: 1 };
}

/** Full-body flow: counts hip hinge cycles (approximation for TGU) */
export function verifyTurkishGetupApprox(pose) {
  return verifyHipHingeReps(pose, { hingeDeep: 140, hingeTall: 165 });
}

// ─────────────────────────────────────────────
// MAIN DISPATCHER
// ─────────────────────────────────────────────

/**
 * Main verification dispatcher — routes to the correct exercise verifier.
 * @param {string} exerciseId
 * @param {Object} pose
 * @returns {FormResult}
 */
export function verifyExercise(exerciseId, pose) {
  switch (exerciseId) {
    // Free tier
    case 'push-up':           return verifyPushUp(pose);
    case 'squat':             return verifySquat(pose);
    case 'plank':             return verifyPlank(pose);

    // Push-up variants
    case 'knee-push-up':      return verifyKneePushUp(pose);
    case 'wide-push-up':      return verifyWidePushUp(pose);
    case 'diamond-push-up':   return verifyDiamondPushUp(pose);
    case 'decline-push-up':   return verifyDeclinePushUp(pose);
    case 'pike-push-up':      return verifyPikePushUp(pose);

    // Hold exercises
    case 'wall-sit':          return verifyWallSit(pose);
    case 'glute-bridge-hold': return verifyGluteBridgeHold(pose);
    case 'superman':          return verifySuperman(pose);
    case 'dead-hang':         return verifyDeadHang(pose);

    // Rep exercises — bodyweight
    case 'glute-bridge':      return verifyGluteBridge(pose);
    case 'lunge':             return verifyLunge(pose);
    case 'burpee':            return verifyBurpee(pose);
    case 'mountain-climber':  return verifyMountainClimber(pose);
    case 'bicycle-crunch':    return verifyBicycleCrunch(pose);
    case 'calf-raise':        return verifyCalfRaise(pose);
    case 'hanging-knee-raise': return verifyHangingKneeRaise(pose);

    // Dumbbells — arm/elbow cycles
    case 'db-bicep-curl':
    case 'band-bicep-curl':
      return verifyElbowFlexCycle(pose, { contractBelow: 78, extendAbove: 142 });
    case 'db-shoulder-press':
    case 'kb-press':
      return verifyElbowFlexCycle(pose, { contractBelow: 100, extendAbove: 152 });
    case 'db-lateral-raise':
      return verifyLateralRaise(pose);
    case 'db-bent-over-row':
    case 'band-row':
      return verifyElbowFlexCycle(pose, { contractBelow: 92, extendAbove: 145 });
    case 'db-tricep-kickback':
      return verifyElbowExtensionCycle(pose, { bentBelow: 118, straightAbove: 148 });
    case 'db-chest-press':
      return verifyElbowFlexCycle(pose, { contractBelow: 98, extendAbove: 148 });

    // Dumbbells / bands / kettlebell — squat & hinge
    case 'db-goblet-squat':
    case 'band-squat':
    case 'kb-goblet-squat':
      return verifySquat(pose);
    case 'db-lunges':
      return verifyLunge(pose);
    case 'db-romanian-deadlift':
    case 'kb-deadlift':
      return verifyHipHingeReps(pose, { hingeDeep: 152, hingeTall: 172 });
    case 'kb-swing':
      return verifyHipHingeReps(pose, { hingeDeep: 148, hingeTall: 168 });

    // Pull-up bar — elbow flex (chin clears ≈ sharp elbow angle)
    case 'pull-up':
    case 'chin-up':
      return verifyElbowFlexCycle(pose, { contractBelow: 110, extendAbove: 148 });

    // Resistance band — horizontal spread (front view)
    case 'band-pull-apart':
      return verifyBandPullApart(pose);

    // Barbell — mapped onto squat / hinge / press primitives
    case 'bb-back-squat':
      return verifySquat(pose);
    case 'bb-lunge':
      return verifyLunge(pose);
    case 'bb-deadlift':
      return verifyHipHingeReps(pose, { hingeDeep: 148, hingeTall: 172 });
    case 'bb-romanian-deadlift':
      return verifyHipHingeReps(pose, { hingeDeep: 152, hingeTall: 172 });
    case 'bb-bench-press':
      return verifyElbowFlexCycle(pose, { contractBelow: 95, extendAbove: 150 });
    case 'bb-overhead-press':
      return verifyElbowFlexCycle(pose, { contractBelow: 100, extendAbove: 152 });
    case 'bb-row':
      return verifyElbowFlexCycle(pose, { contractBelow: 92, extendAbove: 145 });
    case 'bb-hip-thrust':
      return verifyGluteBridge(pose);

    // Complex flow — coarse rep count from hip movement
    case 'kb-turkish-getup':
      return verifyTurkishGetupApprox(pose);

    default:
      return { level: 'green', message: 'Exercise not yet supported by AI', repCompleted: false, effortScore: 1 };
  }
}
