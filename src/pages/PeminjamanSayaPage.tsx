import { DashboardLayout } from '@/components/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  menunggu: 'secondary',
  disetujui: 'default',
  ditolak: 'destructive',
  dipinjam: 'outline',
  dikembalikan: 'default',
};

export default function PeminjamanSayaPage() {
  const { user } = useAuth();

  const { data: list } = useQuery({
    queryKey: ['peminjaman-saya'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('peminjaman')
        .select('*, alat(nama, kode_alat)')
        .eq('peminjam_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return (
    <DashboardLayout title="Peminjaman Saya">
      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Alat</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead>Tgl Pinjam</TableHead>
              <TableHead>Rencana Kembali</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list?.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{(p.alat as any)?.nama}</TableCell>
                <TableCell>{p.jumlah}</TableCell>
                <TableCell>{new Date(p.tanggal_pinjam).toLocaleDateString('id-ID')}</TableCell>
                <TableCell>{new Date(p.tanggal_kembali_rencana).toLocaleDateString('id-ID')}</TableCell>
                <TableCell><Badge variant={statusColors[p.status] || 'secondary'}>{p.status}</Badge></TableCell>
              </TableRow>
            ))}
            {!list?.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Belum ada peminjaman</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </DashboardLayout>
  );
}
