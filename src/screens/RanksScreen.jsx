import React, { useContext, useState, useMemo, useEffect } from 'react';
import { AppContext } from '../AppContext';
import { getLevelForXP } from '../data/levels';
import { fetchLeaderboardProfiles, isSocialBackendConfigured } from '../services/socialService';

// In production this list comes from backend + auth.
const communityUsers = [
  { code: 'FF-IRON01', name: 'IronMike', xp: 20000, allTimeReps: 14520, weeklyReps: 310, streak: 89 },
  { code: 'FF-SQEE02', name: 'SweatQueen', xp: 12000, allTimeReps: 12340, weeklyReps: 420, streak: 72 },
  { code: 'FF-REPK03', name: 'RepKing', xp: 8000, allTimeReps: 10890, weeklyReps: 280, streak: 61 },
  { code: 'FF-CORE04', name: 'CoreCrusher', xp: 5500, allTimeReps: 9200, weeklyReps: 195, streak: 54 },
  { code: 'FF-PLNK05', name: 'PlankMaster', xp: 3500, allTimeReps: 7600, weeklyReps: 350, streak: 45 },
  { code: 'FF-GAIN06', name: 'GainzGuru', xp: 2000, allTimeReps: 6100, weeklyReps: 150, streak: 38 },
  { code: 'FF-PUSH07', name: 'PushPro', xp: 1000, allTimeReps: 4800, weeklyReps: 220, streak: 29 },
  { code: 'FF-SQAT08', name: 'SquatStar', xp: 1000, allTimeReps: 3950, weeklyReps: 180, streak: 22 },
];

const TABS = ['All Time', 'This Week', 'Friends'];

export default function RanksScreen() {
  const { state, dispatch } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState(0);
  const [friendCodeInput, setFriendCodeInput] = useState('');
  const [referralInput, setReferralInput] = useState('');
  const [displayNameInput, setDisplayNameInput] = useState(state.socialProfile?.displayName || 'You');
  const [socialNotice, setSocialNotice] = useState('');
  const [copied, setCopied] = useState(false);
  const [liveUsers, setLiveUsers] = useState([]);
  const [backendError, setBackendError] = useState('');

  const normalizeCode = (value) => (value || '').trim().toUpperCase();

  useEffect(() => {
    let cancelled = false;
    async function loadLive() {
      if (!isSocialBackendConfigured()) {
        setLiveUsers([]);
        return;
      }
      try {
        const rows = await fetchLeaderboardProfiles();
        if (cancelled) return;
        const mapped = rows.map((r) => ({
          code: r.referral_code,
          name: r.display_name || 'Sweater',
          xp: Number(r.xp || 0),
          allTimeReps: Number(r.all_time_reps || 0),
          weeklyReps: Number(r.weekly_reps || 0),
          streak: Number(r.streak || 0),
        }));
        setLiveUsers(mapped);
        setBackendError('');
      } catch {
        if (!cancelled) setBackendError('Live leaderboard unavailable — showing local data.');
      }
    }
    loadLive();
    return () => {
      cancelled = true;
    };
  }, [state.totalReps, state.xp, state.streak, state.socialProfile]);

  // Build ranked list based on active tab
  const rankedList = useMemo(() => {
    const ownCode = normalizeCode(state.socialProfile?.referralCode);
    const friendCodes = (state.socialProfile?.friends || []).map(normalizeCode).filter(Boolean);
    const seed = liveUsers.length > 0 ? liveUsers : communityUsers;
    const byCode = new Map();
    for (const u of seed) {
      const code = normalizeCode(u.code);
      if (!code || code === ownCode) continue; // prevent duplicate "You" from backend row
      if (!byCode.has(code)) {
        byCode.set(code, {
          ...u,
          code,
          isFriend: friendCodes.includes(code),
        });
      }
    }

    // Show pending friend placeholders so add-code feels immediate even before friend's data syncs.
    for (const code of friendCodes) {
      if (!byCode.has(code)) {
        byCode.set(code, {
          code,
          name: `Friend ${code.slice(-4)}`,
          xp: 0,
          allTimeReps: 0,
          weeklyReps: 0,
          streak: 0,
          isFriend: true,
          isPending: true,
        });
      }
    }

    let pool = [...byCode.values()];

    // Add "You" to the pool
    const you = {
      code: ownCode,
      name: state.socialProfile?.displayName || 'You',
      xp: state.xp,
      allTimeReps: state.totalReps,
      weeklyReps: state.totalReps, // approximation — proper implementation tracks weekly
      streak: state.streak,
      isFriend: true,
      isYou: true,
    };
    pool.push(you);

    // Filter for Friends tab
    if (activeTab === 2) {
      pool = pool.filter(u => u.isFriend || u.isYou);
    }

    // Sort by the right metric
    const sortKey = activeTab === 1 ? 'weeklyReps' : 'allTimeReps';
    pool.sort((a, b) => b[sortKey] - a[sortKey]);

    // Assign ranks and add level info
    return pool.map((user, i) => ({
      ...user,
      rank: i + 1,
      level: getLevelForXP(user.xp),
      displayReps: activeTab === 1 ? user.weeklyReps : user.allTimeReps,
    }));
  }, [activeTab, liveUsers, state.socialProfile, state.xp, state.totalReps, state.streak]);

  const top3 = rankedList.slice(0, 3);
  const rest = rankedList.slice(3);

  // Find user's entry if not in top list shown
  const userInList = rankedList.find(u => u.isYou);
  const userInRest = rest.find(u => u.isYou);

  const saveDisplayName = () => {
    dispatch({ type: 'SET_DISPLAY_NAME', payload: displayNameInput });
    setSocialNotice('Display name updated.');
  };

  const addFriendByCode = () => {
    const code = normalizeCode(friendCodeInput);
    if (!code) return;
    dispatch({ type: 'ADD_FRIEND_CODE', payload: code });
    setSocialNotice(`Friend code ${code} added.`);
    setFriendCodeInput('');
  };

  const applyReferral = () => {
    if (!referralInput.trim()) return;
    dispatch({ type: 'APPLY_REFERRAL_CODE', payload: referralInput });
    setSocialNotice(`Referral code ${referralInput.trim().toUpperCase()} applied.`);
    setReferralInput('');
  };

  const copyReferralCode = async () => {
    const code = state.socialProfile?.referralCode;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setSocialNotice(`Your code: ${code}`);
    }
  };

  return (
    <div style={styles.screen}>
      <div style={styles.title}>Leaderboard</div>

      <div style={styles.socialCard}>
        <div style={styles.socialHeader}>Social</div>
        {!isSocialBackendConfigured() && (
          <div style={styles.notice}>Live backend not configured yet. Add Supabase env vars to publish cross-user leaderboard.</div>
        )}
        {backendError && <div style={styles.notice}>{backendError}</div>}
        <div style={styles.socialRow}>
          <input
            value={displayNameInput}
            onChange={(e) => setDisplayNameInput(e.target.value)}
            placeholder="Display name"
            style={styles.input}
          />
          <button onClick={saveDisplayName} style={styles.smallBtn}>Save</button>
        </div>
        <div style={styles.socialRow}>
          <div style={styles.codePill}>{state.socialProfile?.referralCode}</div>
          <button onClick={copyReferralCode} style={styles.smallBtn}>{copied ? 'Copied' : 'Copy Code'}</button>
        </div>
        <div style={styles.socialRow}>
          <input
            value={friendCodeInput}
            onChange={(e) => setFriendCodeInput(e.target.value)}
            placeholder="Add friend code"
            style={styles.input}
          />
          <button onClick={addFriendByCode} style={styles.smallBtn}>Add</button>
        </div>
        {!state.socialProfile?.referredBy && (
          <div style={styles.socialRow}>
            <input
              value={referralInput}
              onChange={(e) => setReferralInput(e.target.value)}
              placeholder="Apply referral code"
              style={styles.input}
            />
            <button onClick={applyReferral} style={styles.smallBtn}>Apply</button>
          </div>
        )}
        {state.socialProfile?.referredBy && (
          <div style={styles.notice}>Referred by: {state.socialProfile.referredBy}</div>
        )}
        {socialNotice && <div style={styles.notice}>{socialNotice}</div>}
      </div>

      {/* Category tabs */}
      <div style={styles.tabs}>
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            style={{
              ...styles.tab,
              ...(i === activeTab ? styles.tabActive : {}),
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Top 3 podium — show as [2nd, 1st, 3rd] */}
      {top3.length >= 3 && (
        <div style={styles.podium}>
          {[1, 0, 2].map(idx => {
            const entry = top3[idx];
            const isFirst = idx === 0;
            return (
              <div key={idx} style={{ ...styles.podiumItem, ...(isFirst ? styles.podiumFirst : {}) }}>
                <div style={{
                  ...styles.podiumAvatar,
                  width: isFirst ? 64 : 48,
                  height: isFirst ? 64 : 48,
                  fontSize: isFirst ? 32 : 24,
                  border: isFirst ? '2px solid #F0A500' : '1px solid rgba(255,255,255,0.15)',
                  ...(entry.isYou ? { boxShadow: '0 0 12px rgba(232,83,58,0.4)' } : {}),
                }}>
                  {entry.level.emoji}
                </div>
                <div style={{
                  fontSize: 12, fontWeight: 600, marginTop: 6,
                  color: entry.isYou ? '#E8533A' : '#F4F1EB',
                }}>
                  {entry.name}
                </div>
                <div style={{ fontSize: 10, color: '#F0A500' }}>{entry.displayReps} reps</div>
                <div style={{
                  ...styles.rankBadge,
                  background: entry.rank === 1 ? 'rgba(240,165,0,0.2)' : 'rgba(255,255,255,0.08)',
                  color: entry.rank === 1 ? '#F0A500' : '#9AA0B8',
                }}>
                  #{entry.rank}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full list */}
      <div style={styles.list}>
        {rest.map(entry => (
          <div key={entry.code || `${entry.name}-${entry.rank}`} style={{
            ...styles.listItem,
            ...(entry.isYou ? { background: 'rgba(232,83,58,0.08)', border: '1px solid rgba(232,83,58,0.2)' } : {}),
          }}>
            <div style={{ ...styles.listRank, color: entry.isYou ? '#E8533A' : '#9AA0B8' }}>#{entry.rank}</div>
            <div style={styles.listAvatar}>{entry.level.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: entry.isYou ? '#E8533A' : '#F4F1EB' }}>
                {entry.name}
              </div>
              <div style={{ fontSize: 11, color: '#9AA0B8' }}>
                {entry.level.name} &middot; {'🔥'}{entry.streak} streak {entry.isPending ? '· pending sync' : ''}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: '#E8533A' }}>
                {entry.displayReps}
              </div>
              <div style={{ fontSize: 9, color: '#9AA0B8', textTransform: 'uppercase' }}>reps</div>
            </div>
          </div>
        ))}

        {/* If user didn't appear in the visible list (in top 3 podium only), show them pinned at bottom */}
        {userInList && !userInRest && userInList.rank <= 3 && (
          <div style={{ textAlign: 'center', padding: '12px 0', fontSize: 12, color: '#2ECC71' }}>
            You're in the top 3! {'🏆'}
          </div>
        )}
      </div>

      {/* Empty state for Friends tab */}
      {activeTab === 2 && rankedList.length <= 1 && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>{'👥'}</div>
          <div style={{ fontSize: 14, color: '#9AA0B8' }}>
            No friends yet. Share FormForged to compete with friends!
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  screen: {
    background: '#0F1647',
    minHeight: '100%',
    padding: '16px 0 100px',
  },
  title: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 32,
    letterSpacing: 1,
    color: '#F4F1EB',
    padding: '8px 24px 16px',
  },
  socialCard: {
    margin: '0 20px 14px',
    padding: '14px',
    borderRadius: 14,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  socialHeader: {
    fontSize: 11,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    color: '#9AA0B8',
    marginBottom: 10,
    fontWeight: 700,
  },
  socialRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    color: '#F4F1EB',
    fontSize: 12,
    padding: '10px 12px',
    outline: 'none',
    fontFamily: "'DM Sans', sans-serif",
  },
  smallBtn: {
    background: 'rgba(232,83,58,0.15)',
    border: '1px solid rgba(232,83,58,0.35)',
    borderRadius: 10,
    color: '#E8533A',
    fontSize: 12,
    padding: '10px 12px',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    WebkitTapHighlightColor: 'transparent',
  },
  codePill: {
    flex: 1,
    borderRadius: 10,
    background: 'rgba(46,204,113,0.1)',
    border: '1px solid rgba(46,204,113,0.28)',
    color: '#2ECC71',
    fontWeight: 700,
    fontSize: 12,
    padding: '10px 12px',
    letterSpacing: 0.6,
  },
  notice: {
    fontSize: 11,
    color: '#9AA0B8',
    lineHeight: 1.4,
    marginTop: 2,
  },
  tabs: {
    display: 'flex',
    gap: 8,
    padding: '0 20px 16px',
  },
  tab: {
    padding: '8px 16px',
    borderRadius: 20,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#9AA0B8',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'all 0.2s',
  },
  tabActive: {
    background: 'rgba(232,83,58,0.12)',
    borderColor: 'rgba(232,83,58,0.3)',
    color: '#E8533A',
  },
  podium: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 16,
    padding: '0 20px 24px',
  },
  podiumItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  podiumFirst: {
    order: 0,
  },
  podiumAvatar: {
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadge: {
    marginTop: 4,
    padding: '2px 8px',
    borderRadius: 10,
    fontSize: 10,
    fontWeight: 700,
  },
  list: {
    padding: '0 20px',
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 14,
    marginBottom: 8,
  },
  listRank: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 18,
    color: '#9AA0B8',
    width: 32,
    textAlign: 'center',
  },
  listAvatar: {
    fontSize: 24,
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};
