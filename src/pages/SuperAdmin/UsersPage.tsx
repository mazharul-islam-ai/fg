import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import EmptyState from '@/components/layout/EmptyState';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type UserRoleRow = {
  id: string;
  user_id: string;
  role: string;
  clinic_id?: string | null;
  created_at?: string;
  profiles?: { id: string; email?: string } | null;
};

export default function UsersPage() {
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ['superadmin', 'users'],
    queryFn: async () => {
      // select user_roles with related profile info
      const { data, error } = await supabase
        .from<UserRoleRow>('user_roles')
        .select('id, user_id, role, clinic_id, created_at, profiles(id, email)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('user_roles').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin', 'users'] });
      toast.success('User role removed');
    },
    onError: (err: any) => {
      console.error(err);
      toast.error('Failed to remove user role');
    },
  });

  return (
    <PageLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="text-sm text-muted-foreground">Manage platform users and their assigned roles.</p>
        </header>

        <section>
          <h2 className="text-lg font-medium mb-4">All Users</h2>

          {usersQuery.isLoading && <p>Loading users...</p>}
          {usersQuery.error && <p className="text-destructive">Failed to load users: {(usersQuery.error as any)?.message}</p>}

          {!usersQuery.isLoading && usersQuery.data && usersQuery.data.length === 0 ? (
            <EmptyState title="No users yet" description="No user accounts found." />
          ) : (
            <div className="space-y-3">
              {usersQuery.data?.map((row) => (
                <div key={row.id} className="p-3 border rounded-md flex justify-between items-center">
                  <div>
                    <div className="font-medium">{row.profiles?.email ?? row.user_id}</div>
                    <div className="text-sm text-muted-foreground">Role: {row.role}</div>
                    {row.clinic_id && <div className="text-sm text-muted-foreground">Clinic: {row.clinic_id}</div>}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        // Navigate to profile or user edit - basic behavior for now
                        window.location.href = `/super-admin/users/${row.id}`;
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={async () => {
                        if (!confirm('Remove this role assignment?')) return;
                        try {
                          await deleteRoleMutation.mutateAsync(row.id);
                        } catch (err) {
                          // handled by mutation
                        }
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </PageLayout>
  );
}
