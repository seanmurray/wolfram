// Single React Query client for the app. The personal-use scope means we keep
// caches generous and don't bother with retries — a failed read just
// surface in the UI.

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,      // 5 min
      gcTime:    1000 * 60 * 30,     // 30 min
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
