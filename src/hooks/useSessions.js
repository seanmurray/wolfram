// Session history hooks — same shapes as before, now reading the on-device
// store. React Query stays as the cache/invalT layer so components didn't
// have to change.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSessions, deleteSession } from '../lib/localdb';

export function useSessions() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: () => getSessions(),
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId) => {
      deleteSession(sessionId);
      return sessionId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}
