'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, UserCircle, Mail, Calendar } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Badge } from '@/components/ui/Badge';
import { Table, Thead, Tbody, Th, Td, Tr } from '@/components/ui/Table';
import { AdminGuard } from '@/components/layout/AdminGuard';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';

function UserAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const colors = [
    'bg-primary-100 text-primary-700',
    'bg-emerald-100 text-emerald-700',
    'bg-violet-100 text-violet-700',
    'bg-orange-100 text-orange-700',
    'bg-rose-100 text-rose-700',
  ];
  const color = colors[name.charCodeAt(0) % colors.length];

  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${color}`}>
      {initials || <UserCircle size={16} />}
    </div>
  );
}

export default function UsersPage() {
  const [search, setSearch] = useState('');

  // Query Supabase profiles table directly (admin view)
  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: async () => {
      let q = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(100);

      if (search.trim()) {
        q = q.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data, error, count } = await q;
      if (error) throw error;
      return { users: data ?? [], total: count ?? 0 };
    },
  });

  const users = data?.users ?? [];

  return (
    <AdminGuard>
    <div className="flex flex-col min-h-full">
      <Header title="Users" subtitle={`${data?.total ?? 0} registered users`} />

      <main className="flex-1 p-6 overflow-y-auto">
        {/* Search */}
        <div className="flex gap-3 mb-5">
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="pl-9 pr-4 py-2 w-full text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <Table>
            <Thead>
              <tr>
                <Th>User</Th>
                <Th>Email</Th>
                <Th>Bio</Th>
                <Th>Joined</Th>
                <Th>Status</Th>
              </tr>
            </Thead>
            <Tbody>
              {isLoading ? (
                <Tr>
                  <Td className="py-12 text-center text-slate-400" colSpan={5 as any}>
                    Loading users…
                  </Td>
                </Tr>
              ) : users.length === 0 ? (
                <Tr>
                  <Td className="py-12 text-center text-slate-400" colSpan={5 as any}>
                    {search ? `No users matching "${search}"` : 'No users found'}
                  </Td>
                </Tr>
              ) : (
                users.map((user: any) => (
                  <Tr key={user.id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <UserAvatar name={user.name ?? user.email ?? '?'} />
                        <p className="font-medium text-slate-900">
                          {user.name ?? 'No name'}
                        </p>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Mail size={13} />
                        {user.email ?? '—'}
                      </div>
                    </Td>
                    <Td>
                      <p className="text-slate-500 text-xs line-clamp-1">
                        {user.bio ?? '—'}
                      </p>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                        <Calendar size={12} />
                        {user.created_at ? formatDate(user.created_at) : '—'}
                      </div>
                    </Td>
                    <Td>
                      <Badge variant="success">Active</Badge>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
          <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
            {data?.total ?? 0} user{data?.total !== 1 ? 's' : ''} total
          </div>
        </div>
      </main>
    </div>
    </AdminGuard>
  );
}
