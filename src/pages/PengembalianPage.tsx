import { DashboardLayout } from '@/components/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { RotateCcw } from 'lucide-react';

const DENDA_PER_HARI = 5000;

export default function PengembalianPage() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [kondisi, setKondisi] = useState('baik');
  const [keterangan, setKeterangan] = useState('');

  const { data: peminjamanList } = useQuery({
    queryKey: ['peminjaman-aktif'],
    queryFn: async () => {
      const query = supabase
        .from('peminjaman')
        .select('*, alat(nama, kode_alat), profiles:peminjam_id(full_name, email)')
        .in('status', ['disetujui', 'dipinjam'])
        .order('tanggal_kembali_rencana');
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: pengembalianList } = useQuery({
    queryKey: ['pengembalian'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pengembalian')
        .select('*, peminjaman(*, alat(nama), profiles:peminjam_id(full_name))')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const returnMutation = useMutation({
    mutationFn: async () => {
      if (!selected) return;
      const now = new Date();
      const rencana = new Date(selected.tanggal_kembali_rencana);
      const hariTerlambat = Math.max(0, Math.ceil((now.getTime() - rencana.getTime()) / (1000 * 60 * 60 * 24)));
      const denda = hariTerlambat * DENDA_PER_HARI;

      const { error: e1 } = await supabase.from('pengembalian').insert({
        peminjaman_id: selected.id,
        kondisi_alat: kondisi,
        denda,
        keterangan: keterangan || null,
        diterima_oleh: user!.id,
      });
      if (e1) throw e1;

      const { error: e2 } = await supabase.from('peminjaman').update({ status: 'dikembalikan' }).eq('id', selected.id);
      if (e2) throw e2;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['peminjaman-aktif'] });
      qc.invalidateQueries({ queryKey: ['pengembalian'] });
      toast({ title: 'Pengembalian dicatat' });
      setOpen(false); setSelected(null); setKondisi('baik'); setKeterangan('');
    },
    onError: (e: any) => toast({ title: 'Gagal', description: e.message, variant: 'destructive' }),
  });

  const openReturn = (p: any) => { setSelected(p); setOpen(true); };

  const calcDenda = () => {
    if (!selected) return 0;
    const now = new Date();
    const rencana = new Date(selected.tanggal_kembali_rencana);
    const hari = Math.max(0, Math.ceil((now.getTime() - rencana.getTime()) / (1000 * 60 * 60 * 24)));
    return hari * DENDA_PER_HARI;
  };

  return (
    <DashboardLayout title="Pengembalian">
      <h2 className="text-lg font-semibold mb-4">Peminjaman Aktif</h2>
      <div className="bg-card rounded-lg border mb-8">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Peminjam</TableHead>
              <TableHead>Alat</TableHead>
              <TableHead>Tgl Pinjam</TableHead>
              <TableHead>Rencana Kembali</TableHead>
              <TableHead>Status</TableHead>
              {(role === 'admin' || role === 'petugas') && <TableHead className="w-24">Aksi</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {peminjamanList?.map(p => (
              <TableRow key={p.id}>
                <TableCell>{(p.profiles as any)?.full_name || (p.profiles as any)?.email}</TableCell>
                <TableCell className="font-medium">{(p.alat as any)?.nama}</TableCell>
                <TableCell>{new Date(p.tanggal_pinjam).toLocaleDateString('id-ID')}</TableCell>
                <TableCell>{new Date(p.tanggal_kembali_rencana).toLocaleDateString('id-ID')}</TableCell>
                <TableCell>
                  <Badge variant={new Date() > new Date(p.tanggal_kembali_rencana) ? 'destructive' : 'secondary'}>
                    {new Date() > new Date(p.tanggal_kembali_rencana) ? 'Terlambat' : p.status}
                  </Badge>
                </TableCell>
                {(role === 'admin' || role === 'petugas') && (
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => openReturn(p)}><RotateCcw className="w-4 h-4 mr-1" />Kembalikan</Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {!peminjamanList?.length && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Tidak ada peminjaman aktif</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

      <h2 className="text-lg font-semibold mb-4">Riwayat Pengembalian</h2>
      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Peminjam</TableHead>
              <TableHead>Alat</TableHead>
              <TableHead>Tgl Kembali</TableHead>
              <TableHead>Kondisi</TableHead>
              <TableHead>Denda</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pengembalianList?.map(r => (
              <TableRow key={r.id}>
                <TableCell>{(r.peminjaman as any)?.profiles?.full_name}</TableCell>
                <TableCell>{(r.peminjaman as any)?.alat?.nama}</TableCell>
                <TableCell>{new Date(r.tanggal_kembali).toLocaleDateString('id-ID')}</TableCell>
                <TableCell><Badge variant="secondary">{r.kondisi_alat}</Badge></TableCell>
                <TableCell className="font-medium">{Number(r.denda) > 0 ? `Rp ${Number(r.denda).toLocaleString('id-ID')}` : '-'}</TableCell>
              </TableRow>
            ))}
            {!pengembalianList?.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Belum ada pengembalian</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Proses Pengembalian</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <p className="text-sm">Alat: <strong>{(selected.alat as any)?.nama}</strong></p>
              <p className="text-sm">Peminjam: <strong>{(selected.profiles as any)?.full_name}</strong></p>
              {calcDenda() > 0 && (
                <div className="p-3 bg-destructive/10 rounded-lg">
                  <p className="text-sm font-medium text-destructive">Denda keterlambatan: Rp {calcDenda().toLocaleString('id-ID')}</p>
                  <p className="text-xs text-muted-foreground">Rp {DENDA_PER_HARI.toLocaleString('id-ID')} / hari</p>
                </div>
              )}
              <div className="space-y-2">
                <Label>Kondisi Alat</Label>
                <Select value={kondisi} onValueChange={setKondisi}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baik">Baik</SelectItem>
                    <SelectItem value="rusak_ringan">Rusak Ringan</SelectItem>
                    <SelectItem value="rusak_berat">Rusak Berat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Keterangan</Label><Textarea value={keterangan} onChange={e => setKeterangan(e.target.value)} /></div>
              <Button className="w-full" onClick={() => returnMutation.mutate()}>Proses Pengembalian</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
