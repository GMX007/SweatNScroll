import React, { useContext, useMemo, useState } from 'react';
import Button from '../components/Button';
import { AppContext } from '../AppContext';
import {
  getAvailableExercises,
  getExerciseById,
  getEffective1RM,
  isWeighted,
  lbToDisplay,
  displayToLb,
} from '../services/programEngine';
import {
  PATTERN_MAP,
  PATTERN_LABELS,
  PROGRESSION_MODELS,
  BUILDER_MODELS,
  REP_RANGE_PRESETS,
  SETS_MIN,
  SETS_MAX,
  DEFAULT_PCT_1RM,
} from '../data/programs';

const MIN_DAYS = 2;
const MAX_DAYS = 6;

function newItem(exerciseId, model, goal) {
  return {
    exerciseId,
    sets: 3,
    setsMin: 2,
    setsMax: 4,
    repMin: 8,
    repMax: 12,
    weightLb: null,
    pct: model === 'percent1rm' ? (DEFAULT_PCT_1RM[goal] || 72) : null,
  };
}

/** Seed the builder from the current program so users edit, not start blank. */
function draftFromProgram(program, model, goal) {
  if (!program?.days?.length) {
    return [{ name: 'Day 1', items: [] }, { name: 'Day 2', items: [] }, { name: 'Day 3', items: [] }];
  }
  return program.days.map((day, i) => ({
    name: program.custom ? day.name : `Day ${i + 1} · ${day.name}`,
    items: day.items.map((it) => ({
      ...newItem(it.exerciseId, model, goal),
      sets: it.sets || 3,
      setsMin: it.setsMin ?? 2,
      setsMax: it.setsMax ?? Math.max(it.sets || 3, 2),
      repMin: it.repMin ?? 8,
      repMax: it.repMax ?? 12,
      weightLb: it.weightLb ?? null,
      pct: it.pct ?? (model === 'percent1rm' ? (DEFAULT_PCT_1RM[goal] || 72) : null),
    })),
  }));
}

export default function ProgramBuilderScreen() {
  const { state, dispatch } = useContext(AppContext);
  const goal = state.userProfile?.goal || 'muscle';
  const units = state.settings?.units || 'lb';

  const [model, setModel] = useState(
    BUILDER_MODELS.includes(state.program?.model) ? state.program.model : 'double'
  );
  const [days, setDays] = useState(() => draftFromProgram(state.program, model, goal));
  const [pickerDay, setPickerDay] = useState(null); // day index with open exercise picker
  const [oneRMDraft, setOneRMDraft] = useState({}); // { exerciseId: lb }

  const available = useMemo(
    () => getAvailableExercises(state.userEquipment || []),
    [state.userEquipment]
  );
  const grouped = useMemo(() => {
    const g = {};
    for (const ex of available) {
      const pat = PATTERN_MAP[ex.id]?.pattern || 'other';
      (g[pat] = g[pat] || []).push(ex);
    }
    return g;
  }, [available]);

  const setDayCount = (n) => {
    const count = Math.min(MAX_DAYS, Math.max(MIN_DAYS, n));
    setDays((prev) => {
      const next = prev.slice(0, count);
      while (next.length < count) next.push({ name: `Day ${next.length + 1}`, items: [] });
      return next;
    });
  };

  const updateItem = (di, ii, patch) => {
    setDays((prev) => prev.map((d, i) =>
      i !== di ? d : { ...d, items: d.items.map((it, j) => (j !== ii ? it : { ...it, ...patch })) }
    ));
  };

  const removeItem = (di, ii) => {
    setDays((prev) => prev.map((d, i) =>
      i !== di ? d : { ...d, items: d.items.filter((_, j) => j !== ii) }
    ));
  };

  const addExercise = (di, exerciseId) => {
    setDays((prev) => prev.map((d, i) =>
      i !== di ? d : { ...d, items: [...d.items, newItem(exerciseId, model, goal)] }
    ));
    setPickerDay(null);
  };

  const totalExercises = days.reduce((s, d) => s + d.items.length, 0);
  const modelCfg = PROGRESSION_MODELS[model];

  const Stepper = ({ value, min, max, onChange, suffix = '' }) => (
    <span style={styles.stepper}>
      <button style={styles.stepBtn} onClick={() => onChange(Math.max(min, value - 1))}>−</button>
      <span style={styles.stepVal}>{value}{suffix}</span>
      <button style={styles.stepBtn} onClick={() => onChange(Math.min(max, value + 1))}>+</button>
    </span>
  );

  const WeightInput = ({ item, di, ii }) => (
    <input
      type="number"
      inputMode="decimal"
      placeholder={units}
      value={item.weightLb != null ? lbToDisplay(item.weightLb, units) : ''}
      onChange={(e) => updateItem(di, ii, { weightLb: displayToLb(e.target.value, units) })}
      style={styles.weightInput}
    />
  );

  return (
    <div style={styles.screen}>
      <div style={styles.header}>
        <span style={styles.logo}>FORMFORGE</span>
        <button style={styles.closeBtn} onClick={() => dispatch({ type: 'DISMISS_PROGRAM_BUILDER' })}>✕</button>
      </div>

      <div style={styles.title}>Program Builder 🛠️</div>
      <div style={styles.subtitle}>Design your own split. Your form data still gates every progression.</div>

      {/* Days per week */}
      <div style={styles.sectionLabel}>Training days ({MIN_DAYS}–{MAX_DAYS})</div>
      <div style={styles.card}>
        <div style={styles.rowBetween}>
          <span style={styles.rowLabel}>Days per week</span>
          <Stepper value={days.length} min={MIN_DAYS} max={MAX_DAYS} onChange={setDayCount} />
        </div>
      </div>

      {/* Progression model */}
      <div style={styles.sectionLabel}>Progression model</div>
      <div style={styles.chipRow}>
        {BUILDER_MODELS.map((id) => (
          <button
            key={id}
            onClick={() => setModel(id)}
            style={{ ...styles.chip, ...(model === id ? styles.chipActive : {}) }}
          >
            {PROGRESSION_MODELS[id].label}
          </button>
        ))}
      </div>
      {modelCfg && <div style={styles.modelHint}>{modelCfg.description}</div>}

      {/* Days */}
      {days.map((day, di) => (
        <div key={di}>
          <div style={styles.sectionLabel}>{day.name}</div>
          <div style={styles.card}>
            {day.items.length === 0 && (
              <div style={styles.emptyDay}>No exercises yet — add your first below.</div>
            )}
            {day.items.map((item, ii) => {
              const ex = getExerciseById(item.exerciseId);
              if (!ex) return null;
              const weighted = isWeighted(ex);
              const isHold = ex.type === 'hold';
              const known1RM = getEffective1RM(state.oneRMs, item.exerciseId);
              return (
                <div key={`${item.exerciseId}-${ii}`} style={styles.itemRow}>
                  <div style={styles.itemHead}>
                    <span style={{ fontSize: 18 }}>{ex.emoji}</span>
                    <span style={styles.itemName}>{ex.name}</span>
                    <span style={styles.itemPattern}>{PATTERN_LABELS[PATTERN_MAP[ex.id]?.pattern] || ''}</span>
                    <button style={styles.removeBtn} onClick={() => removeItem(di, ii)}>✕</button>
                  </div>

                  <div style={styles.itemControls}>
                    {/* Sets */}
                    {model === 'triple' ? (
                      <>
                        <span style={styles.ctrlLabel}>Sets {item.setsMin}→{item.setsMax}</span>
                        <Stepper value={item.setsMin} min={SETS_MIN} max={item.setsMax} onChange={(v) => updateItem(di, ii, { setsMin: v })} />
                        <Stepper value={item.setsMax} min={item.setsMin} max={SETS_MAX} onChange={(v) => updateItem(di, ii, { setsMax: v })} />
                      </>
                    ) : (
                      <>
                        <span style={styles.ctrlLabel}>Sets</span>
                        <Stepper value={item.sets} min={SETS_MIN} max={SETS_MAX} onChange={(v) => updateItem(di, ii, { sets: v })} />
                      </>
                    )}
                  </div>

                  <div style={styles.itemControls}>
                    <span style={styles.ctrlLabel}>{isHold ? 'Seconds' : 'Reps'}</span>
                    <Stepper value={item.repMin} min={1} max={item.repMax} onChange={(v) => updateItem(di, ii, { repMin: v })} />
                    <span style={{ color: '#9AA0B8', fontSize: 12 }}>to</span>
                    <Stepper value={item.repMax} min={item.repMin} max={isHold ? 120 : 30} onChange={(v) => updateItem(di, ii, { repMax: v })} />
                  </div>
                  {!isHold && (
                    <div style={styles.presetRow}>
                      {REP_RANGE_PRESETS.map((p) => (
                        <button
                          key={p.id}
                          style={{
                            ...styles.presetChip,
                            ...(item.repMin === p.min && item.repMax === p.max ? styles.chipActive : {}),
                          }}
                          onClick={() => updateItem(di, ii, { repMin: p.min, repMax: p.max })}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Load */}
                  {weighted && model !== 'percent1rm' && (
                    <div style={styles.itemControls}>
                      <span style={styles.ctrlLabel}>Weight ({units})</span>
                      <WeightInput item={item} di={di} ii={ii} />
                    </div>
                  )}
                  {weighted && model === 'percent1rm' && (
                    <>
                      <div style={styles.itemControls}>
                        <span style={styles.ctrlLabel}>Intensity</span>
                        <span style={styles.stepper}>
                          <button style={styles.stepBtn} onClick={() => updateItem(di, ii, { pct: Math.max(40, (item.pct || 70) - 2.5) })}>−</button>
                          <span style={styles.stepVal}>{item.pct || 70}%</span>
                          <button style={styles.stepBtn} onClick={() => updateItem(di, ii, { pct: Math.min(95, (item.pct || 70) + 2.5) })}>+</button>
                        </span>
                        <span style={{ fontSize: 11, color: '#9AA0B8' }}>of 1RM</span>
                      </div>
                      <div style={styles.itemControls}>
                        <span style={styles.ctrlLabel}>1RM ({units})</span>
                        <input
                          type="number"
                          inputMode="decimal"
                          placeholder={known1RM ? `est. ${lbToDisplay(known1RM, units)}` : 'enter'}
                          value={oneRMDraft[item.exerciseId] != null ? lbToDisplay(oneRMDraft[item.exerciseId], units) : ''}
                          onChange={(e) => setOneRMDraft((prev) => ({
                            ...prev,
                            [item.exerciseId]: displayToLb(e.target.value, units),
                          }))}
                          style={styles.weightInput}
                        />
                        {known1RM && oneRMDraft[item.exerciseId] == null && (
                          <span style={{ fontSize: 10, color: '#2ECC71' }}>using estimate</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}

            {/* Add exercise */}
            {pickerDay === di ? (
              <div style={styles.picker}>
                {Object.entries(grouped).map(([pat, list]) => (
                  <div key={pat}>
                    <div style={styles.pickerPattern}>{PATTERN_LABELS[pat] || pat}</div>
                    <div style={styles.pickerGrid}>
                      {list.map((ex) => (
                        <button key={ex.id} style={styles.pickerItem} onClick={() => addExercise(di, ex.id)}>
                          {ex.emoji} {ex.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <button style={styles.cancelAdd} onClick={() => setPickerDay(null)}>Cancel</button>
              </div>
            ) : (
              <button style={styles.addBtn} onClick={() => setPickerDay(di)}>+ Add exercise</button>
            )}
          </div>
        </div>
      ))}

      {/* Save */}
      <div style={{ margin: '20px 20px 40px' }}>
        <Button
          disabled={totalExercises === 0}
          onClick={() => dispatch({ type: 'SAVE_PROGRAM', payload: { days, model, oneRMs: oneRMDraft } })}
        >
          Save Program ({days.length} days · {totalExercises} exercises)
        </Button>
        <div style={{ marginTop: 8 }}>
          <Button variant="secondary" onClick={() => dispatch({ type: 'DISMISS_PROGRAM_BUILDER' })}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  screen: {
    background: '#0F1647',
    minHeight: '100%',
    padding: '16px 0 40px',
    overflowY: 'auto',
  },
  header: {
    padding: '8px 24px 0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 22,
    letterSpacing: 2,
    color: '#E8533A',
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: '6px 12px',
    color: '#F4F1EB',
    fontSize: 14,
    cursor: 'pointer',
  },
  title: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 32,
    letterSpacing: 1,
    color: '#F4F1EB',
    padding: '16px 24px 0',
  },
  subtitle: {
    fontSize: 12,
    color: '#9AA0B8',
    padding: '4px 24px 0',
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#9AA0B8',
    padding: '18px 24px 8px',
  },
  card: {
    margin: '0 20px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: '4px 0',
  },
  rowBetween: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
  },
  rowLabel: { fontSize: 14, color: '#F4F1EB' },
  chipRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    padding: '0 20px',
  },
  chip: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 999,
    color: '#F4F1EB',
    fontSize: 12,
    padding: '8px 14px',
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
  },
  chipActive: {
    background: 'rgba(232,83,58,0.15)',
    borderColor: 'rgba(232,83,58,0.5)',
    color: '#E8533A',
  },
  modelHint: {
    margin: '10px 24px 0',
    fontSize: 11,
    color: '#9AA0B8',
    lineHeight: 1.5,
  },
  emptyDay: {
    padding: '14px 16px',
    fontSize: 12,
    color: '#9AA0B8',
  },
  itemRow: {
    padding: '12px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  itemHead: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  itemName: { fontSize: 14, fontWeight: 600, color: '#F4F1EB', flex: 'none' },
  itemPattern: { fontSize: 10, color: '#9AA0B8', textTransform: 'uppercase', letterSpacing: 0.5, flex: 1 },
  removeBtn: {
    background: 'transparent',
    border: 'none',
    color: '#9AA0B8',
    fontSize: 13,
    cursor: 'pointer',
    padding: 4,
  },
  itemControls: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  ctrlLabel: { fontSize: 11, color: '#9AA0B8', width: 82 },
  stepper: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 0,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  stepBtn: {
    background: 'transparent',
    border: 'none',
    color: '#E8533A',
    fontSize: 16,
    width: 30,
    height: 30,
    cursor: 'pointer',
    lineHeight: 1,
  },
  stepVal: {
    minWidth: 34,
    textAlign: 'center',
    fontSize: 13,
    color: '#F4F1EB',
    fontWeight: 600,
  },
  presetRow: {
    display: 'flex',
    gap: 6,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  presetChip: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 999,
    color: '#9AA0B8',
    fontSize: 10,
    padding: '5px 10px',
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
  },
  weightInput: {
    width: 90,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10,
    color: '#F4F1EB',
    fontSize: 13,
    padding: '7px 10px',
    fontFamily: "'DM Sans', sans-serif",
    outline: 'none',
  },
  addBtn: {
    display: 'block',
    width: '100%',
    background: 'transparent',
    border: 'none',
    color: '#E8533A',
    fontSize: 13,
    fontWeight: 600,
    padding: '13px 16px',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: "'DM Sans', sans-serif",
  },
  picker: {
    padding: '10px 16px 14px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  pickerPattern: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#F0A500',
    margin: '10px 0 6px',
  },
  pickerGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  pickerItem: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    color: '#F4F1EB',
    fontSize: 12,
    padding: '7px 10px',
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
  },
  cancelAdd: {
    marginTop: 12,
    background: 'transparent',
    border: 'none',
    color: '#9AA0B8',
    fontSize: 12,
    cursor: 'pointer',
    textDecoration: 'underline',
    fontFamily: "'DM Sans', sans-serif",
  },
};
