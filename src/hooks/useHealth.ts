/**
 * React Query v5 examples â object form only.
 * Forbidden (v4): useQuery(key, fn, opts) / invalidateQueries(key)
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchHealth } from "@/lib/api/exampleService";

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
  });
}

/** Template for mutations â copy this shape for create/update/delete hooks. */
export function useRefreshHealth() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => fetchHealth(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["health"] });
    },
  });
}
