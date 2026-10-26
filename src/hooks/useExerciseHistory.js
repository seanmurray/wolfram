// Last N sessions for one exercise, from the on-device store.
//
// kind = 'sets' — set-table exercises (grouped set rows per session)
// kind = 'perf' — minutes/notes entries (Move day cardio)
//
// Shapes match the original UI contract:
//   sets: [{ sessionId, performedAt, sets: [{ set_num, actual_reps,
//            actual_weight, rpe }] }]
//   perf: [{ sessionId, performedAt, exerciseName, effortRpe, notes }]

import { useQuery } from '@tanstack/react-query';
import { getSetHistory, getPerfHistory } from '../lib/localdb';

const DEFAULT_LIMIT = 3;

export function useExerciseHistory(exerciseKey, kind, limit = DEFAULT_LIMIT) {
  return useQuery({
    queryKey: ['exercise_history', kind, exerciseKey, limit],
    enabled: !!exerciseKey && (kind === 'sets' || kind === 'perf'),
    queryFn: () =>
      kind === 'sets' ? getSetHistory(exerciseKey, limit) : getPerfHistory(exerciseKey, limit),
  });
}
