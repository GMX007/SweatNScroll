import { createClient } from '@supabase/supabase-js';

const SOCIAL_STORAGE_KEY = 'formforged_social_device_id';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

function getDeviceId() {
  let id = localStorage.getItem(SOCIAL_STORAGE_KEY);
  if (!id) {
    id = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : `sns-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    localStorage.setItem(SOCIAL_STORAGE_KEY, id);
  }
  return id;
}

function normalizeCode(code) {
  return (code || '').trim().toUpperCase();
}

export function isSocialBackendConfigured() {
  return Boolean(supabase);
}

export async function syncSocialProfile(state) {
  if (!supabase) return null;

  const profile = state.socialProfile || {};
  const payload = {
    device_id: getDeviceId(),
    display_name: (profile.displayName || 'You').slice(0, 20),
    referral_code: normalizeCode(profile.referralCode),
    referred_by: profile.referredBy ? normalizeCode(profile.referredBy) : null,
    friend_codes: Array.isArray(profile.friends) ? profile.friends.map(normalizeCode).filter(Boolean).slice(0, 100) : [],
    xp: Number(state.xp || 0),
    all_time_reps: Number(state.totalReps || 0),
    weekly_reps: Number(state.totalReps || 0),
    streak: Number(state.streak || 0),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('leaderboard_profiles')
    .upsert(payload, { onConflict: 'device_id' })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function fetchLeaderboardProfiles() {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('leaderboard_profiles')
    .select('display_name,referral_code,friend_codes,xp,all_time_reps,weekly_reps,streak')
    .order('all_time_reps', { ascending: false })
    .limit(200);

  if (error) throw error;
  return data || [];
}

