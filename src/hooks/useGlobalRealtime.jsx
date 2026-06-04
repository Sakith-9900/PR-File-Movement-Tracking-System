import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';

export function useGlobalRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase.channel('global-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          const table = payload.table;
          // Map table names to the query keys used in the app
          const queryKeysMap = {
            users: 'users',
            pr_files: 'prFiles',
            employees: 'employees',
            file_assignments: 'assignments',
            delete_requests: 'deleteRequests',
            audit_logs: 'auditLogs',
          };

          const queryKey = queryKeysMap[table];
          
          if (queryKey) {
            // Invalidate the cache for this specific table so the UI fetches fresh data automatically
            queryClient.invalidateQueries({ queryKey: [queryKey] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
