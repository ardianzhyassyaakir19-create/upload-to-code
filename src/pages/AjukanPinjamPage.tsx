import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function AjukanPinjamPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [alatId, setAlatId] = useState('');
  const [jumlah, setJumlah] = useState(1);
  const [tanggalKembali, setTanggalKembali] = useState('');
  const [catatan, setCatatan] = useState('');

  const { data: alatList } = useQuery({
    queryKey: ['alat-tersedia'],
    queryFn: async () => {
      const { data } = await supabase.from('alat').select('*').eq('tersedia', true).order('nama');
      return data ?? [];
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('peminjaman').insert({
        peminjam_id: user!.id,
        alat_id: alatId,
        jumlah,
        tanggal_kembali_rencana: new Date(tanggalKembali).toISOString(),
        catatan: catatan || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Peminjaman diajukan', description: 'Menunggu persetujuan petugas.' });
      qc.invalidateQueries({ queryKey: ['peminjaman'] });
      setAlatId(''); setJumlah(1); setTanggalKembali(''); setCatatan('');
    },
    onError: (e: any) => toast({ title: 'Gagal', description: e.message, variant: 'destructive' }),
  });

  return (
    <DashboardLayout title="Ajukan Peminjaman">
      <Card className="max-w-lg">
        <CardHeader><CardTitle>Form Peminjaman</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={e => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Pilih Alat</Label>
              <Select value={alatId} onValueChange={setAlatId}>
                <SelectTrigger><SelectValue placeholder="Pilih alat" /></SelectTrigger>
                <SelectContent>{alatList?.map(a => <SelectItem key={a.id} value={a.id}>{a.nama} ({a.kode_alat})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Jumlah</Label><Input type="number" min={1} value={jumlah} onChange={e => setJumlah(parseInt(e.target.value) || 1)} /></div>
            <div className="space-y-2"><Label>Tanggal Pengembalian Rencana</Label><Input type="date" value={tanggalKembali} onChange={e => setTanggalKembali(e.target.value)} required /></div>
            <div className="space-y-2"><Label>Catatan (opsional)</Label><Textarea value={catatan} onChange={e => setCatatan(e.target.value)} /></div>
            <Button type="submit" className="w-full" disabled={!alatId || !tanggalKembali || mutation.isPending}>
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Ajukan Peminjaman
            </Button>
          </form>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
