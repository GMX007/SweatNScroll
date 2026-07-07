/**
 * FormForge Pose Detection Service
 * Uses TensorFlow.js MoveNet SinglePose Lightning for real-time exercise form verification.
 * All processing runs in the browser — no video data is ever sent to any server.
 */

let detector = null;
let isLoading = false;

/**
 * MoveNet keypoint indices (17 keypoints):
 * 0: nose, 1: left_eye, 2: right_eye, 3: left_ear, 4: right_ear,
 * 5: left_shoulder, 6: right_shoulder, 7: left_elbow, 8: right_elbow,
 * 9: left_wrist, 10: right_wrist, 11: left_hip, 12: right_hip,
 * 13: left_knee, 14: right_knee, 15: left_ankle, 16: right_ankle
 */
const KEYPOINT_MAP = {
  nose: 0, left_eye: 1, right_eye: 2, left_ear: 3, right_ear: 4,
  left_shoulder: 5, right_shoulder: 6, left_elbow: 7, right_elbow: 8,
  left_wrist: 9, right_wrist: 10, left_hip: 11, right_hip: 12,
  left_knee: 13, right_knee: 14, left_ankle: 15, right_ankle: 16,
};

/**
 * Initialize the MoveNet detector. Call once on app load.
 * Caches the model via service worker for offline use.
 */
export async function initPoseDetector() {
  if (detector) return detector;
  if (isLoading) {
    // Wait for existing load
    while (isLoading) await new Promise(r => setTimeout(r, 100));
    return detector;
  }

  isLoading = true;
  try {
    // Dynamic imports so the app loads fast even without these
    const tf = await import('@tensorflow/tfjs-core');
    await import('@tensorflow/tfjs-backend-webgl');
    await tf.ready();

    const poseDetection = await import('@tensorflow-models/pose-detection');

    detector = await poseDetection.createDetector(
      poseDetection.SupportedModels.MoveNet,
      {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        enableSmoothing: true,
        minPoseScore: 0.25,
      }
    );

    console.log('[FormForge] MoveNet detector initialized');
    return detector;
  } catch (err) {
    console.error('[FormForge] Failed to init MoveNet:', err);
    throw err;
  } finally {
    isLoading = false;
  }
}

/**
 * Estimate pose from a video element.
 * @param {HTMLVideoElement} videoEl
 * @returns {Array} Array of poses, each with keypoints
 */
export async function estimatePose(videoEl) {
  if (!detector) throw new Error('Detector not initialized. Call initPoseDetector() first.');
  const poses = await detector.estimatePoses(videoEl, { flipHorizontal: false });
  return poses;
}

/**
 * Get a specific keypoint from a pose.
 * @param {Object} pose - A pose object from estimatePoses
 * @param {string} name - Keypoint name (e.g., 'left_shoulder')
 * @returns {Object|null} { x, y, score } or null if not found/low confidence
 */
export function getKeypoint(pose, name) {
  const idx = KEYPOINT_MAP[name];
  if (idx === undefined || !pose?.keypoints?.[idx]) return null;
  const kp = pose.keypoints[idx];
  return kp.score > 0.2 ? kp : null; // minimum confidence threshold (loosened for varied lighting)
}

/**
 * Calculate the angle between three points (in degrees).
 * Useful for checking joint angles like elbow bend, knee bend, etc.
 * @param {{x:number,y:number}} a - First point (e.g., shoulder)
 * @param {{x:number,y:number}} b - Middle point / vertex (e.g., elbow)
 * @param {{x:number,y:number}} c - Third point (e.g., wrist)
 * @returns {number} Angle in degrees (0-180)
 */
export function calculateAngle(a, b, c) {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs(radians * (180 / Math.PI));
  if (angle > 180) angle = 360 - angle;
  return angle;
}

/**
 * Calculate the body alignment angle (deviation from a straight line).
 * Used for checking if hips are sagging or piking.
 * @param {{x:number,y:number}} shoulder
 * @param {{x:number,y:number}} hip
 * @param {{x:number,y:number}} ankle
 * @returns {number} Deviation from 180 (straight line) in degrees
 */
export function calculateAlignment(shoulder, hip, ankle) {
  const angle = calculateAngle(shoulder, hip, ankle);
  return Math.abs(180 - angle);
}

/**
 * Dispose of the detector to free memory.
 */
export function disposeDetector() {
  if (detector) {
    detector.dispose();
    detector = null;
  }
}
