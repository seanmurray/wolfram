// Resolve which exercise a workout slot actually runs.
//
// Precedence:
//   1. today  — manual swap for this session only
//   2. always — the user's standing preference for this slot
//   3. equipment resolution — first variant their equipment covers
//
// The resolved result tells the slot component what to show, log, and badge.

import { EX, customKey } from '../data/exercises';
import { resolveVariant } from '../data/program';

// choice: { key } | { custom: 'Name' } | null
export function resolveSlot(slot, slotId, owned, todayChoice = null, alwaysChoice = null) {
  let choice = null;
  let source = null; // 'today' | 'always' | null (→ auto)
  if (todayChoice) { choice = todayChoice; source = 'today'; }
  else if (alwaysChoice) { choice = alwaysChoice; source = 'always'; }

  const autoKey = resolveVariant(slot.variants, owned);

  if (choice?.custom) {
    const name = choice.custom.trim();
    return {
      slotId,
      activeKey: customKey(name),
      isCustom: true,
      source,
      name,
      autoName: EX[autoKey]?.name ?? autoKey,
      roleLabel: slot.label,
    };
  }

  const activeKey = choice?.key ?? autoKey;
  return {
    slotId,
    activeKey,
    isCustom: false,
    source: source ?? 'auto',
    name: EX[activeKey]?.name ?? activeKey,
    autoName: EX[autoKey]?.name ?? autoKey,
    roleLabel: slot.label,
    isAuto: activeKey === autoKey && !source,
  };
}

// The saved exercise_name for a resolved slot.
export function savedNameFor(res) {
  if (res.isCustom) return `${res.name} (custom: ${res.roleLabel})`;
  return res.name;
}

// Short badge for the exercise header; null when the slot runs its automatic
// equipment-resolved pick.
export function badgeFor(res) {
  if (res.isCustom) return { text: `Custom · ${res.source === 'always' ? 'standing' : 'today'}`, tone: 'custom' };
  if (res.source === 'today')  return { text: 'Swapped · just today', tone: 'swap' };
  if (res.source === 'always') return { text: 'Your pick for this slot', tone: 'swap' };
  return null;
}
