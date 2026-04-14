import { DashboardLayout } from '@/components/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

export default function LaporanPage() {
  const { data: peminjaman } = useQuery({
    queryKey: ['laporan-peminjaman'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('peminjaman')
        .select('*, alat(nama, kode_alat), profiles:peminjam_id(full_name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: pengembalian } = useQuery({
    queryKey: ['laporan-pengembalian'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pengembalian')
        .select('*, peminjaman(*, alat(nama), profiles:peminjam_id(full_name))')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const totalDenda = pengembalian?.reduce((sum, r) => sum + Number(r.denda), 0) ?? 0;

  const handlePrint = () => window.print();

  return (
    <DashboardLayout title="Laporan">
      <div className="flex justify-end mb-4">
        <Button onClick={handlePrint} variant="outline"><Printer className="w-4 h-4 mr-2" />Cetak Laporan</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Peminjaman</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{peminjaman?.length ?? 0}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Pengembalian</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{pengembalian?.length ?? 0}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Denda</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">Rp {totalDenda.toLocaleString('id-ID')}</p></CardContent></Card>
      </div>

      <h2 className="text-lg font-semibold mb-4">Rekap Peminjaman</h2>
      <div className="bg-card rounded-lg border mb-8">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Peminjam</TableHead>
              <TableHead>Alat</TableHead>
              <TableHead>Tgl Pinjam</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {peminjaman?.slice(0, 20).map(p => (
              <TableRow key={p.id}>
                <TableCell>{(p.profiles as any)?.full_name}</TableCell>
                <TableCell>{(p.alat as any)?.nama}</TableCell>
                <TableCell>{new Date(p.tanggal_pinjam).toLocaleDateString('id-ID')}</TableCell>
                <TableCell><Badge variant="secondary">{p.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </DashboardLayout>
  );
}
