import { ExerciseBlock } from './ExerciseBlock';
import { SetTable } from './SetTable';
import { ExerciseHistoryInline } from './ExerciseHistoryInline';
import { SlotSwapControl } from './SlotSwapControl';
import { EX } from '../data/exercises';
import { useSlotStore } from '../stores/slotStore';
import { useSettingsStore } from '../stores/settingsStore';
import { resolveSlot, savedNameFor, badgeFor } from '../lib/resolveSlot';

// One workout slot: resolves the exercise (today swap > standing preference >
// equipment), renders the card with set logging, recent history, and the
// swap picker.

const DEFAULT_RX = { sets: 2, reps: 8 };

// "2×8", "3×30 sec", "2×8 each" → { sets, reps }
function parseTarget(target) {
  const m = String(target ?? '').match(/(\d+)\s*[×x]\s*(\d+)/);
  return m ? { sets: Number(m[1]), reps: Number(m[2]) } : null;
}

export function SlotCard({ slot, dayId }) {
  const slotId = `${dayId}:${slot.role}`;
  const todayChoice = useSlotStore((s) => s.today[slotId]);
  const alwaysChoice = useSlotStore((s) => s.always[slotId]);
  const equipment = useSettingsStore((s) => s.equipment);

  const res = resolveSlot(slot, slotId, equipment, todayChoice, alwaysChoice);
  const activeEx = res.isCustom ? null : EX[res.activeKey];
  const savedName = savedNameFor(res);
  const badge = badgeFor(res);

  const target = activeEx?.target ?? `${DEFAULT_RX.sets}×${DEFAULT_RX.reps}`;
  const prescription = parseTarget(target) ?? DEFAULT_RX;
  const showWeight = res.isCustom ? true : !activeEx?.bodyweight;

  return (
    <ExerciseBlock
      exerciseKey={res.activeKey}
      name={res.name}
      badge={badge}
      originalName={res.name}
      target={`${slot.label} · ${target}`}
      cue={activeEx?.cue}
      url={activeEx?.url}
    >
      <SetTable
        exerciseKey={res.activeKey}
        exerciseName={savedName}
        prescription={prescription}
        role={slot.role}
        context="strength"
        showWeight={showWeight}
      />
      <ExerciseHistoryInline exerciseKey={res.activeKey} kind="sets" />
      <SlotSwapControl slot={slot} slotId={slotId} activeKey={res.activeKey} isCustom={res.isCustom} />
    </ExerciseBlock>
  );
}
