import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import KategoriPage from "./pages/KategoriPage";
import AlatPage from "./pages/AlatPage";
import DaftarAlatPage from "./pages/DaftarAlatPage";
import AjukanPinjamPage from "./pages/AjukanPinjamPage";
import PeminjamanSayaPage from "./pages/PeminjamanSayaPage";
import PeminjamanPage from "./pages/PeminjamanPage";
import PersetujuanPage from "./pages/PersetujuanPage";
import PengembalianPage from "./pages/PengembalianPage";
import LogAktivitasPage from "./pages/LogAktivitasPage";
import UsersPage from "./pages/UsersPage";
import LaporanPage from "./pages/LaporanPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, role, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && role && !allowedRoles.includes(role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            
            {/* Admin routes */}
            <Route path="/users" element={<ProtectedRoute allowedRoles={['admin']}><UsersPage /></ProtectedRoute>} />
            <Route path="/kategori" element={<ProtectedRoute allowedRoles={['admin']}><KategoriPage /></ProtectedRoute>} />
            <Route path="/alat" element={<ProtectedRoute allowedRoles={['admin']}><AlatPage /></ProtectedRoute>} />
            <Route path="/peminjaman" element={<ProtectedRoute allowedRoles={['admin']}><PeminjamanPage /></ProtectedRoute>} />
            <Route path="/log" element={<ProtectedRoute allowedRoles={['admin']}><LogAktivitasPage /></ProtectedRoute>} />
            
            {/* Petugas routes */}
            <Route path="/persetujuan" element={<ProtectedRoute allowedRoles={['admin', 'petugas']}><PersetujuanPage /></ProtectedRoute>} />
            <Route path="/laporan" element={<ProtectedRoute allowedRoles={['admin', 'petugas']}><LaporanPage /></ProtectedRoute>} />
            
            {/* Shared routes */}
            <Route path="/pengembalian" element={<ProtectedRoute allowedRoles={['admin', 'petugas']}><PengembalianPage /></ProtectedRoute>} />
            
            {/* Peminjam routes */}
            <Route path="/daftar-alat" element={<ProtectedRoute allowedRoles={['peminjam']}><DaftarAlatPage /></ProtectedRoute>} />
            <Route path="/ajukan-pinjam" element={<ProtectedRoute allowedRoles={['peminjam']}><AjukanPinjamPage /></ProtectedRoute>} />
            <Route path="/peminjaman-saya" element={<ProtectedRoute allowedRoles={['peminjam']}><PeminjamanSayaPage /></ProtectedRoute>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
