import React, { useContext } from 'react';
import { AppContext } from '../AppContext';
import LevelAvatar from '../components/LevelAvatar';
import { getLevelForXP, getXPProgress } from '../data/levels';

export default function ProgressScreen() {
  const { state } = useContext(AppContext);
  const { xp, totalReps, streak, sessionsCompleted } = state;
  const { current, next, progress } = getXPProgress(xp);

  const StatCard = ({ value, label, color }) => (
    <div style={styles.statCard}>
      <div style={{ ...styles.statVal, color: color || '#F4F1EB' }}>{value}</div>
      <div style={styles.statKey}>{label}</div>
    </div>
  );

  return (
    <div style={styles.screen}>
      <div style={styles.title}>Your Progress</div>

      {/* Level progress */}
      <div style={styles.levelCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <LevelAvatar level={current.level} gender={state.gender} size={56} />
            <div>
              <div style={{ fontSize: 11, color: '#9AA0B8', textTransform: 'uppercase', letterSpacing: 1 }}>Current Level</div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: '#F0A500' }}>
                {current.emoji} {current.name}
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#9AA0B8' }}>XP</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: '#F4F1EB' }}>{xp}</div>
          </div>
        </div>

        {/* XP progress bar */}
        {next && (
          <>
            <div style={styles.xpBar}>
              <div style={{ ...styles.xpFill, width: `${progress * 100}%` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 10, color: '#9AA0B8' }}>Level {current.level}</span>
              <span style={{ fontSize: 10, color: '#F0A500' }}>Level {next.level} — {next.name}</span>
            </div>
          </>
        )}
      </div>

      {/* Stats grid */}
      <div style={styles.statsGrid}>
        <StatCard value={`🔥 ${streak}`} label="Day Streak" />
        <StatCard value={totalReps} label="Total Reps" />
        <StatCard value={sessionsCompleted || 0} label="Sessions" />
        <StatCard
          value={(() => {
            const entries = Object.values(state.formProfile || {});
            if (entries.length === 0) return '—';
            return `${Math.round(entries.reduce((s, e) => s + (e.avg || 0), 0) / entries.length)}%`;
          })()}
          label="Movement Quality"
          color="#E8533A"
        />
      </div>

      {/* Weekly chart — real data from dailyHistory */}
      <div style={styles.chartCard}>
        <div style={{ fontSize: 11, color: '#9AA0B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
          This Week
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: 120 }}>
          {(() => {
            const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
            const today = new Date();
            const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...
            const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

            // Get date strings for Mon-Sun of this week
            const weekDates = dayLabels.map((_, i) => {
              const d = new Date(today);
              d.setDate(today.getDate() + mondayOffset + i);
              return d.toISOString().split('T')[0];
            });

            // Get reps for each day, find max for scaling
            const dailyReps = weekDates.map(date => (state.dailyHistory?.[date]?.reps || 0));
            const maxReps = Math.max(...dailyReps, 1); // avoid divide by zero

            const todayStr = today.toISOString().split('T')[0];

            return dayLabels.map((day, i) => {
              const reps = dailyReps[i];
              const barHeight = reps > 0 ? Math.max((reps / maxReps) * 100, 8) : 4;
              const isToday = weekDates[i] === todayStr;
              return (
                <div key={i} style={{ textAlign: 'center' }}>
                  {reps > 0 && (
                    <div style={{ fontSize: 9, color: isToday ? '#E8533A' : '#9AA0B8', marginBottom: 4 }}>{reps}</div>
                  )}
                  <div style={{
                    width: 28, height: barHeight, borderRadius: 8,
                    background: reps > 0
                      ? (isToday ? 'linear-gradient(180deg, #E8533A, #F0A500)' : 'rgba(232,83,58,0.4)')
                      : 'rgba(255,255,255,0.08)',
                    marginBottom: 8,
                    transition: 'height 0.5s ease',
                  }} />
                  <span style={{ fontSize: 10, color: isToday ? '#E8533A' : '#9AA0B8', fontWeight: isToday ? 700 : 400 }}>{day}</span>
                </div>
              );
            });
          })()}
        </div>
      </div>
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
  levelCard: {
    margin: '0 20px 16px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 20,
  },
  xpBar: {
    height: 6,
    background: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #F0A500, #E8533A)',
    borderRadius: 3,
    transition: 'width 0.5s ease',
  },
  statsGrid: {
    margin: '0 20px',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
  },
  statCard: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
  },
  statVal: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 28,
    lineHeight: 1,
  },
  statKey: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#9AA0B8',
    marginTop: 4,
  },
  chartCard: {
    margin: '16px 20px 0',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 20,
  },
};
