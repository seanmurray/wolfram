// Persistent per-exercise form-cue notes, stored on-device.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotes, setNote } from '../lib/localdb';

const KEY = ['exercise_notes'];

export function useExerciseNotes() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => getNotes(),
  });
}

// Returns { note, save, isSaving } for a specific exercise key.
export function useExerciseNote(exerciseKey, exerciseName) {
  const queryClient = useQueryClient();
  const { data: notesMap } = useExerciseNotes();
  const note = notesMap?.[exerciseKey]?.note ?? '';

  const mutation = useMutation({
    mutationFn: async (newNote) => {
      setNote(exerciseKey, exerciseName, newNote);
      return newNote;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });

  return { note, save: mutation.mutate, isSaving: mutation.isPending };
}
