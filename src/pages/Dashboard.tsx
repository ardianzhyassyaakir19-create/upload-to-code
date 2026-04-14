import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, ClipboardList, Users, RotateCcw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function Dashboard() {
  const { role, user } = useAuth();

  const { data: alatCount } = useQuery({
    queryKey: ['alat-count'],
    queryFn: async () => {
      const { count } = await supabase.from('alat').select('*', { count: 'exact', head: true });
      return count ?? 0;
    },
  });

  const { data: peminjamanCount } = useQuery({
    queryKey: ['peminjaman-count'],
    queryFn: async () => {
      const query = supabase.from('peminjaman').select('*', { count: 'exact', head: true });
      if (role === 'peminjam') query.eq('peminjam_id', user!.id);
      const { count } = await query;
      return count ?? 0;
    },
    enabled: !!user,
  });

  const { data: pendingCount } = useQuery({
    queryKey: ['pending-count'],
    queryFn: async () => {
      const query = supabase.from('peminjaman').select('*', { count: 'exact', head: true }).eq('status', 'menunggu');
      const { count } = await query;
      return count ?? 0;
    },
    enabled: role === 'admin' || role === 'petugas',
  });

  const stats = [
    { title: 'Total Alat', value: alatCount ?? 0, icon: Package, color: 'text-primary' },
    { title: role === 'peminjam' ? 'Peminjaman Saya' : 'Total Peminjaman', value: peminjamanCount ?? 0, icon: ClipboardList, color: 'text-info' },
    ...(role !== 'peminjam' ? [{ title: 'Menunggu Persetujuan', value: pendingCount ?? 0, icon: Users, color: 'text-warning' }] : []),
  ];

  return (
    <DashboardLayout title="Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
