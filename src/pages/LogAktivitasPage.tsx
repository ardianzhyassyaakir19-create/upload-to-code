import { DashboardLayout } from '@/components/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function LogAktivitasPage() {
  const { data: logs } = useQuery({
    queryKey: ['log-aktivitas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('log_aktivitas')
        .select('*, profiles:user_id(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  return (
    <DashboardLayout title="Log Aktivitas">
      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Waktu</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Aksi</TableHead>
              <TableHead>Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs?.map(l => (
              <TableRow key={l.id}>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{new Date(l.created_at).toLocaleString('id-ID')}</TableCell>
                <TableCell className="font-medium">{(l.profiles as any)?.full_name || (l.profiles as any)?.email || '-'}</TableCell>
                <TableCell>{l.aksi}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{l.detail || '-'}</TableCell>
              </TableRow>
            ))}
            {!logs?.length && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Belum ada log aktivitas</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </DashboardLayout>
  );
}
