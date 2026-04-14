import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AlatPage() {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ nama: '', kode_alat: '', kategori_id: '', deskripsi: '', kondisi: 'baik', jumlah: 1 });
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: alatList } = useQuery({
    queryKey: ['alat'],
    queryFn: async () => {
      const { data, error } = await supabase.from('alat').select('*, kategori(nama)').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: kategoriList } = useQuery({
    queryKey: ['kategori'],
    queryFn: async () => {
      const { data } = await supabase.from('kategori').select('*');
      return data ?? [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, kategori_id: form.kategori_id || null, jumlah: Number(form.jumlah) };
      if (editId) {
        const { error } = await supabase.from('alat').update(payload).eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('alat').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alat'] });
      toast({ title: editId ? 'Alat diperbarui' : 'Alat ditambahkan' });
      resetForm();
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('alat').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['alat'] }); toast({ title: 'Alat dihapus' }); },
  });

  const resetForm = () => { setOpen(false); setEditId(null); setForm({ nama: '', kode_alat: '', kategori_id: '', deskripsi: '', kondisi: 'baik', jumlah: 1 }); };

  const openEdit = (a: any) => {
    setEditId(a.id);
    setForm({ nama: a.nama, kode_alat: a.kode_alat, kategori_id: a.kategori_id || '', deskripsi: a.deskripsi || '', kondisi: a.kondisi, jumlah: a.jumlah });
    setOpen(true);
  };

  return (
    <DashboardLayout title="Kelola Alat">
      <div className="flex justify-end mb-4">
        <Dialog open={open} onOpenChange={v => { if (!v) resetForm(); else setOpen(true); }}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Tambah Alat</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? 'Edit' : 'Tambah'} Alat</DialogTitle></DialogHeader>
            <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nama Alat</Label><Input value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))} required /></div>
                <div className="space-y-2"><Label>Kode Alat</Label><Input value={form.kode_alat} onChange={e => setForm(f => ({ ...f, kode_alat: e.target.value }))} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kategori</Label>
                  <Select value={form.kategori_id} onValueChange={v => setForm(f => ({ ...f, kategori_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                    <SelectContent>{kategoriList?.map(k => <SelectItem key={k.id} value={k.id}>{k.nama}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Jumlah</Label><Input type="number" min={1} value={form.jumlah} onChange={e => setForm(f => ({ ...f, jumlah: parseInt(e.target.value) || 1 }))} /></div>
              </div>
              <div className="space-y-2">
                <Label>Kondisi</Label>
                <Select value={form.kondisi} onValueChange={v => setForm(f => ({ ...f, kondisi: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baik">Baik</SelectItem>
                    <SelectItem value="rusak_ringan">Rusak Ringan</SelectItem>
                    <SelectItem value="rusak_berat">Rusak Berat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Deskripsi</Label><Textarea value={form.deskripsi} onChange={e => setForm(f => ({ ...f, deskripsi: e.target.value }))} /></div>
              <Button type="submit" className="w-full">Simpan</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead>Kondisi</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alatList?.map(a => (
              <TableRow key={a.id}>
                <TableCell className="font-mono text-sm">{a.kode_alat}</TableCell>
                <TableCell className="font-medium">{a.nama}</TableCell>
                <TableCell className="text-muted-foreground">{(a.kategori as any)?.nama || '-'}</TableCell>
                <TableCell>{a.jumlah}</TableCell>
                <TableCell><Badge variant="secondary">{a.kondisi}</Badge></TableCell>
                <TableCell><Badge variant={a.tersedia ? 'default' : 'destructive'}>{a.tersedia ? 'Tersedia' : 'Dipinjam'}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(a.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!alatList?.length && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Belum ada alat</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </DashboardLayout>
  );
}
