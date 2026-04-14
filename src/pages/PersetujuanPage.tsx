import { DashboardLayout } from '@/components/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PersetujuanPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: list } = useQuery({
    queryKey: ['peminjaman-pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('peminjaman')
        .select('*, alat(nama, kode_alat), profiles:peminjam_id(full_name, email)')
        .eq('status', 'menunggu')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, approve }: { id: string; approve: boolean }) => {
      const { error } = await supabase
        .from('peminjaman')
        .update({
          status: approve ? 'disetujui' : 'ditolak',
          disetujui_oleh: user!.id,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { approve }) => {
      qc.invalidateQueries({ queryKey: ['peminjaman-pending'] });
      toast({ title: approve ? 'Peminjaman disetujui' : 'Peminjaman ditolak' });
    },
  });

  return (
    <DashboardLayout title="Persetujuan Peminjaman">
      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Peminjam</TableHead>
              <TableHead>Alat</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead>Tgl Pinjam</TableHead>
              <TableHead>Rencana Kembali</TableHead>
              <TableHead>Catatan</TableHead>
              <TableHead className="w-32">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list?.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{(p.profiles as any)?.full_name || (p.profiles as any)?.email}</TableCell>
                <TableCell>{(p.alat as any)?.nama}</TableCell>
                <TableCell>{p.jumlah}</TableCell>
                <TableCell>{new Date(p.tanggal_pinjam).toLocaleDateString('id-ID')}</TableCell>
                <TableCell>{new Date(p.tanggal_kembali_rencana).toLocaleDateString('id-ID')}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{p.catatan || '-'}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="default" onClick={() => approveMutation.mutate({ id: p.id, approve: true })}><Check className="w-4 h-4" /></Button>
                    <Button size="sm" variant="destructive" onClick={() => approveMutation.mutate({ id: p.id, approve: false })}><X className="w-4 h-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!list?.length && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Tidak ada peminjaman menunggu persetujuan</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </DashboardLayout>
  );
}
