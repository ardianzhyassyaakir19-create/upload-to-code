import { DashboardLayout } from '@/components/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DaftarAlatPage() {
  const { data: alatList } = useQuery({
    queryKey: ['alat-public'],
    queryFn: async () => {
      const { data, error } = await supabase.from('alat').select('*, kategori(nama)').order('nama');
      if (error) throw error;
      return data;
    },
  });

  return (
    <DashboardLayout title="Daftar Alat">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {alatList?.map(a => (
          <Card key={a.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">{(a.kategori as any)?.nama || 'Umum'}</Badge>
                <Badge variant={a.tersedia ? 'default' : 'destructive'}>{a.tersedia ? 'Tersedia' : 'Dipinjam'}</Badge>
              </div>
              <CardTitle className="text-lg mt-2">{a.nama}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">{a.deskripsi || 'Tidak ada deskripsi'}</p>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Kode: <span className="font-mono">{a.kode_alat}</span></span>
                <span className="text-muted-foreground">Stok: {a.jumlah}</span>
              </div>
            </CardContent>
          </Card>
        ))}
        {!alatList?.length && <p className="col-span-full text-center text-muted-foreground py-8">Belum ada alat tersedia</p>}
      </div>
    </DashboardLayout>
  );
}
