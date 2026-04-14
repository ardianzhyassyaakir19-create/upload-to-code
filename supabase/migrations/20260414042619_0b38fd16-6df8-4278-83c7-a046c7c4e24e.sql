
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'petugas', 'peminjam');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'peminjam',
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Get user role function
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Create kategori table
CREATE TABLE public.kategori (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  deskripsi TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.kategori ENABLE ROW LEVEL SECURITY;

-- Create alat table
CREATE TABLE public.alat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  kategori_id UUID REFERENCES public.kategori(id) ON DELETE SET NULL,
  kode_alat TEXT NOT NULL UNIQUE,
  deskripsi TEXT,
  kondisi TEXT NOT NULL DEFAULT 'baik',
  tersedia BOOLEAN NOT NULL DEFAULT true,
  jumlah INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.alat ENABLE ROW LEVEL SECURITY;

-- Create peminjaman table
CREATE TABLE public.peminjaman (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  peminjam_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alat_id UUID NOT NULL REFERENCES public.alat(id) ON DELETE CASCADE,
  jumlah INTEGER NOT NULL DEFAULT 1,
  tanggal_pinjam TIMESTAMPTZ NOT NULL DEFAULT now(),
  tanggal_kembali_rencana TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'menunggu' CHECK (status IN ('menunggu', 'disetujui', 'ditolak', 'dipinjam', 'dikembalikan')),
  catatan TEXT,
  disetujui_oleh UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.peminjaman ENABLE ROW LEVEL SECURITY;

-- Create pengembalian table
CREATE TABLE public.pengembalian (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  peminjaman_id UUID NOT NULL REFERENCES public.peminjaman(id) ON DELETE CASCADE,
  tanggal_kembali TIMESTAMPTZ NOT NULL DEFAULT now(),
  kondisi_alat TEXT NOT NULL DEFAULT 'baik',
  denda DECIMAL(12,2) NOT NULL DEFAULT 0,
  keterangan TEXT,
  diterima_oleh UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pengembalian ENABLE ROW LEVEL SECURITY;

-- Create log_aktivitas table
CREATE TABLE public.log_aktivitas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  aksi TEXT NOT NULL,
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.log_aktivitas ENABLE ROW LEVEL SECURITY;

-- Trigger for auto-creating profile and role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'peminjam'));
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_alat_updated_at BEFORE UPDATE ON public.alat FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_peminjaman_updated_at BEFORE UPDATE ON public.peminjaman FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS POLICIES

-- Profiles: everyone can read, users update own
CREATE POLICY "Profiles viewable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- User roles: admins can manage, users can read own
CREATE POLICY "Users read own role" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Kategori: all authenticated can read, admin can manage
CREATE POLICY "All read kategori" ON public.kategori FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert kategori" ON public.kategori FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update kategori" ON public.kategori FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete kategori" ON public.kategori FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Alat: all authenticated can read, admin can manage
CREATE POLICY "All read alat" ON public.alat FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert alat" ON public.alat FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update alat" ON public.alat FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete alat" ON public.alat FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Peminjaman
CREATE POLICY "Peminjam read own peminjaman" ON public.peminjaman FOR SELECT TO authenticated USING (auth.uid() = peminjam_id);
CREATE POLICY "Staff read all peminjaman" ON public.peminjaman FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas'));
CREATE POLICY "Peminjam create peminjaman" ON public.peminjaman FOR INSERT TO authenticated WITH CHECK (auth.uid() = peminjam_id);
CREATE POLICY "Admin update peminjaman" ON public.peminjaman FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete peminjaman" ON public.peminjaman FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Petugas update peminjaman" ON public.peminjaman FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'petugas'));

-- Pengembalian
CREATE POLICY "Read own pengembalian" ON public.pengembalian FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.peminjaman p WHERE p.id = peminjaman_id AND p.peminjam_id = auth.uid())
);
CREATE POLICY "Staff read all pengembalian" ON public.pengembalian FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas'));
CREATE POLICY "Staff insert pengembalian" ON public.pengembalian FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas'));
CREATE POLICY "Staff update pengembalian" ON public.pengembalian FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas'));
CREATE POLICY "Admin delete pengembalian" ON public.pengembalian FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Log aktivitas: admin only read, authenticated insert own
CREATE POLICY "Admin read log" ON public.log_aktivitas FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated insert log" ON public.log_aktivitas FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Log function helper
CREATE OR REPLACE FUNCTION public.log_activity(_user_id UUID, _aksi TEXT, _detail TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.log_aktivitas (user_id, aksi, detail)
  VALUES (_user_id, _aksi, _detail);
$$;
