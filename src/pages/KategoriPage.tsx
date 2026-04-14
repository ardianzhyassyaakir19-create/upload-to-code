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
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function KategoriPage() {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [nama, setNama] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: kategoriList } = useQuery({
    queryKey: ['kategori'],
    queryFn: async () => {
      const { data, error } = await supabase.from('kategori').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editId) {
        const { error } = await supabase.from('kategori').update({ nama, deskripsi }).eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('kategori').insert({ nama, deskripsi });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kategori'] });
      toast({ title: editId ? 'Kategori diperbarui' : 'Kategori ditambahkan' });
      resetForm();
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('kategori').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kategori'] });
      toast({ title: 'Kategori dihapus' });
    },
  });

  const resetForm = () => { setOpen(false); setEditId(null); setNama(''); setDeskripsi(''); };

  const openEdit = (k: any) => { setEditId(k.id); setNama(k.nama); setDeskripsi(k.deskripsi || ''); setOpen(true); };

  return (
    <DashboardLayout title="Kelola Kategori">
      <div className="flex justify-end mb-4">
        <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); else setOpen(true); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Tambah Kategori</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? 'Edit' : 'Tambah'} Kategori</DialogTitle></DialogHeader>
            <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
              <div className="space-y-2"><Label>Nama</Label><Input value={nama} onChange={e => setNama(e.target.value)} required /></div>
              <div className="space-y-2"><Label>Deskripsi</Label><Textarea value={deskripsi} onChange={e => setDeskripsi(e.target.value)} /></div>
              <Button type="submit" className="w-full">Simpan</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Deskripsi</TableHead>
              <TableHead className="w-24">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {kategoriList?.map(k => (
              <TableRow key={k.id}>
                <TableCell className="font-medium">{k.nama}</TableCell>
                <TableCell className="text-muted-foreground">{k.deskripsi || '-'}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(k)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(k.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!kategoriList?.length && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">Belum ada kategori</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </DashboardLayout>
  );
}
