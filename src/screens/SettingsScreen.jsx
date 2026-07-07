import React, { useContext, useState } from 'react';
import { AppContext } from '../AppContext';
import { GOALS, PROGRESSION_MODELS } from '../data/programs';

export default function SettingsScreen() {
  const { state, dispatch } = useContext(AppContext);
  const [confirmReset, setConfirmReset] = useState(false);
  const [updateStatus, setUpdateStatus] = useState(null); // null | 'checking' | 'updated' | 'fresh'

  const handleReset = async () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    // Clear app data
    localStorage.clear();
    // Clear service worker caches so new version loads
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(key => caches.delete(key)));
    }
    // Unregister service worker so it re-installs fresh
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(reg => reg.unregister()));
    }
    window.location.reload(true);
  };

  const handleCheckForUpdate = async () => {
    setUpdateStatus('checking');
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(reg => reg.update()));
      }
      setUpdateStatus('updated');
      setTimeout(() => window.location.reload(true), 1000);
    } catch {
      setUpdateStatus('fresh');
      setTimeout(() => setUpdateStatus(null), 3000);
    }
  };

  const SettingRow = ({ label, value, onClick }) => (
    <div style={styles.row} onClick={onClick}>
      <span style={styles.rowLabel}>{label}</span>
      <span style={styles.rowValue}>{value} {'›'}</span>
    </div>
  );

  const Toggle = ({ label, enabled, onToggle }) => (
    <div style={styles.row} onClick={onToggle}>
      <span style={styles.rowLabel}>{label}</span>
      <div style={{
        width: 44, height: 24, borderRadius: 12,
        background: enabled ? '#E8533A' : 'rgba(255,255,255,0.15)',
        padding: 2, cursor: 'pointer', transition: 'background 0.2s',
      }}>
        <div style={{
          width: 20, height: 20, borderRadius: 10,
          background: 'white',
          transform: enabled ? 'translateX(20px)' : 'translateX(0)',
          transition: 'transform 0.2s',
        }} />
      </div>
    </div>
  );

  return (
    <div style={styles.screen}>
      <div style={styles.title}>Settings</div>

      {/* Account */}
      <div style={styles.sectionLabel}>Account</div>
      <div style={styles.card}>
        <SettingRow
          label="Avatar"
          value={state.gender === 'female' ? '🙋‍♀️ Female' : '🙋‍♂️ Male'}
          onClick={() => dispatch({ type: 'TOGGLE_GENDER' })}
        />
      </div>

      {/* Training program */}
      <div style={styles.sectionLabel}>Training Program</div>
      <div style={styles.card}>
        <SettingRow
          label="Goal"
          value={GOALS[state.userProfile?.goal]?.label || 'Build Muscle'}
          onClick={() => {
            const ids = Object.keys(GOALS);
            const next = ids[(ids.indexOf(state.userProfile?.goal || 'muscle') + 1) % ids.length];
            dispatch({ type: 'SET_GOAL', payload: next });
          }}
        />
        <SettingRow
          label="Progression Model"
          value={PROGRESSION_MODELS[state.userProfile?.progressionModel]?.label || 'Form-Gated'}
          onClick={() => {
            const ids = Object.keys(PROGRESSION_MODELS);
            const next = ids[(ids.indexOf(state.userProfile?.progressionModel || 'form-gated') + 1) % ids.length];
            dispatch({ type: 'SET_PROGRESSION_MODEL', payload: next });
          }}
        />
        <SettingRow
          label="My Equipment"
          value={state.userEquipment?.length > 0 ? `${state.userEquipment.length} selected` : 'Bodyweight only'}
          onClick={() => dispatch({ type: 'SHOW_EQUIPMENT_SETUP' })}
        />
        <SettingRow
          label="Design Program"
          value="Open builder"
          onClick={() => dispatch({ type: 'SHOW_PROGRAM_BUILDER' })}
        />
        <SettingRow
          label="Rebuild Program"
          value="Auto-generate"
          onClick={() => dispatch({ type: 'REGENERATE_PROGRAM' })}
        />
        <SettingRow
          label="Weight Units"
          value={(state.settings?.units || 'lb') === 'kg' ? 'Kilograms (kg)' : 'Pounds (lb)'}
          onClick={() => dispatch({ type: 'TOGGLE_SETTING', payload: 'units' })}
        />
      </div>
      {PROGRESSION_MODELS[state.userProfile?.progressionModel] && (
        <div style={styles.modelHint}>
          {PROGRESSION_MODELS[state.userProfile.progressionModel].description}
        </div>
      )}

      {/* Exercise */}
      <div style={styles.sectionLabel}>Exercise</div>
      <div style={styles.card}>
        <Toggle
          label="Audio coaching cues"
          enabled={state.settings?.audioEnabled ?? true}
          onToggle={() => dispatch({ type: 'TOGGLE_SETTING', payload: 'audioEnabled' })}
        />
        <Toggle
          label="Vibration feedback"
          enabled={state.settings?.vibrationEnabled ?? true}
          onToggle={() => dispatch({ type: 'TOGGLE_SETTING', payload: 'vibrationEnabled' })}
        />
        <SettingRow
          label="Camera"
          value={state.settings?.camera || 'Front'}
          onClick={() => dispatch({
            type: 'TOGGLE_SETTING',
            payload: 'camera',
          })}
        />
      </div>

      {/* Notifications */}
      <div style={styles.sectionLabel}>Notifications</div>
      <div style={styles.card}>
        <Toggle
          label="Push notifications"
          enabled={state.settings?.notificationsEnabled ?? true}
          onToggle={() => dispatch({ type: 'TOGGLE_SETTING', payload: 'notificationsEnabled' })}
        />
        <Toggle
          label="Daily reminder"
          enabled={state.settings?.dailyReminder ?? false}
          onToggle={() => dispatch({ type: 'TOGGLE_SETTING', payload: 'dailyReminder' })}
        />
      </div>

      {/* Honor system message */}
      <div style={styles.honorCard}>
        <div style={{ fontSize: 20, marginBottom: 8 }}>{'🎯'}</div>
        <div style={{ fontSize: 13, color: 'rgba(244,241,235,0.8)', lineHeight: 1.6, textAlign: 'center' }}>
          FormForge only counts reps your form earns. Quality first — strength follows.
        </div>
      </div>

      {/* About */}
      <div style={styles.sectionLabel}>About</div>
      <div style={styles.card}>
        <SettingRow label="Version" value="1.0.0" />
        <SettingRow label="Privacy Policy" value="" onClick={() => dispatch({ type: 'SHOW_LEGAL', payload: 'privacy' })} />
        <SettingRow label="Terms of Service" value="" onClick={() => dispatch({ type: 'SHOW_LEGAL', payload: 'terms' })} />
        {/* Check for Update */}
        <div style={styles.row} onClick={updateStatus ? undefined : handleCheckForUpdate}>
          <span style={styles.rowLabel}>
            {updateStatus === 'checking' ? '⏳ Checking...' :
             updateStatus === 'updated'  ? '✅ Reloading...' :
             updateStatus === 'fresh'    ? '✅ Already up to date' :
             '🔁 Check for Update'}
          </span>
          {!updateStatus && <span style={styles.rowValue}>{'›'}</span>}
        </div>
      </div>

      {/* Reset */}
      <div style={styles.sectionLabel}>Danger Zone</div>
      <button
        onClick={handleReset}
        style={{
          ...styles.resetBtn,
          background: confirmReset ? 'rgba(231,76,60,0.15)' : 'rgba(255,255,255,0.04)',
          borderColor: confirmReset ? 'rgba(231,76,60,0.5)' : 'rgba(255,255,255,0.08)',
          color: confirmReset ? '#E74C3C' : '#9AA0B8',
        }}
      >
        {confirmReset ? '⚠️ Tap again to confirm — this cannot be undone' : '🔄 Reset App & Start Over'}
      </button>
      {confirmReset && (
        <button onClick={() => setConfirmReset(false)} style={styles.cancelBtn}>
          Cancel
        </button>
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
  sectionLabel: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#9AA0B8',
    padding: '16px 24px 8px',
  },
  card: {
    margin: '0 20px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    cursor: 'pointer',
  },
  rowLabel: {
    fontSize: 14,
    color: '#F4F1EB',
  },
  rowValue: {
    fontSize: 13,
    color: '#9AA0B8',
  },
  resetBtn: {
    display: 'block',
    width: 'calc(100% - 40px)',
    margin: '0 20px',
    padding: '14px 16px',
    border: '1px solid',
    borderRadius: 16,
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    textAlign: 'left',
    transition: 'all 0.2s',
  },
  cancelBtn: {
    display: 'block',
    margin: '10px auto',
    background: 'transparent',
    border: 'none',
    color: '#9AA0B8',
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    textDecoration: 'underline',
  },
  modelHint: {
    margin: '8px 24px 0',
    fontSize: 11,
    color: '#9AA0B8',
    lineHeight: 1.5,
  },
  honorCard: {
    margin: '20px 20px',
    background: 'rgba(232,83,58,0.06)',
    border: '1px solid rgba(232,83,58,0.15)',
    borderRadius: 16,
    padding: '20px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
};
