import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function UsersPage() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<string>('peminjam');
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: users } = useQuery({
    queryKey: ['users-list'],
    queryFn: async () => {
      const { data: profiles, error: pErr } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (pErr) throw pErr;
      const { data: roles, error: rErr } = await supabase.from('user_roles').select('*');
      if (rErr) throw rErr;
      return (profiles || []).map(p => ({
        ...p,
        user_roles: (roles || []).filter(r => r.user_id === p.id),
      }));
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      // Use signUp to create user (will auto-create profile + role via trigger)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, role } },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users-list'] });
      toast({ title: 'User berhasil ditambahkan' });
      setOpen(false); setEmail(''); setPassword(''); setFullName(''); setRole('peminjam');
    },
    onError: (e: any) => toast({ title: 'Gagal', description: e.message, variant: 'destructive' }),
  });

  const roleColor = (r: string) => r === 'admin' ? 'destructive' as const : r === 'petugas' ? 'default' as const : 'secondary' as const;

  return (
    <DashboardLayout title="Kelola User">
      <div className="flex justify-end mb-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Tambah User</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Tambah User Baru</DialogTitle></DialogHeader>
            <form onSubmit={e => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
              <div className="space-y-2"><Label>Nama Lengkap</Label><Input value={fullName} onChange={e => setFullName(e.target.value)} required /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
              <div className="space-y-2"><Label>Password</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} /></div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="petugas">Petugas</SelectItem>
                    <SelectItem value="peminjam">Peminjam</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Terdaftar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map(u => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.full_name || '-'}</TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell>
                  {(u.user_roles as any)?.map((r: any) => (
                    <Badge key={r.role} variant={roleColor(r.role)}>{r.role}</Badge>
                  ))}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{new Date(u.created_at).toLocaleDateString('id-ID')}</TableCell>
              </TableRow>
            ))}
            {!users?.length && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Belum ada user</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </DashboardLayout>
  );
}
