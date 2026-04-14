import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Users,
  Package,
  Tags,
  ClipboardList,
  RotateCcw,
  Activity,
  FileText,
  LogOut,
  Wrench,
  Send,
} from 'lucide-react';

const adminMenu = [
  { title: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { title: 'Kelola User', icon: Users, path: '/users' },
  { title: 'Kategori', icon: Tags, path: '/kategori' },
  { title: 'Alat', icon: Package, path: '/alat' },
  { title: 'Peminjaman', icon: ClipboardList, path: '/peminjaman' },
  { title: 'Pengembalian', icon: RotateCcw, path: '/pengembalian' },
  { title: 'Log Aktivitas', icon: Activity, path: '/log' },
];

const petugasMenu = [
  { title: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { title: 'Persetujuan', icon: ClipboardList, path: '/persetujuan' },
  { title: 'Pengembalian', icon: RotateCcw, path: '/pengembalian' },
  { title: 'Laporan', icon: FileText, path: '/laporan' },
];

const peminjamMenu = [
  { title: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { title: 'Daftar Alat', icon: Wrench, path: '/daftar-alat' },
  { title: 'Ajukan Peminjaman', icon: Send, path: '/ajukan-pinjam' },
  { title: 'Peminjaman Saya', icon: ClipboardList, path: '/peminjaman-saya' },
];

export function AppSidebar() {
  const { role, user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menu = role === 'admin' ? adminMenu : role === 'petugas' ? petugasMenu : peminjamMenu;
  const roleLabel = role === 'admin' ? 'Administrator' : role === 'petugas' ? 'Petugas' : 'Peminjam';

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Package className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-sidebar-foreground">Peminjaman Alat</h2>
            <p className="text-xs text-sidebar-foreground/60">{roleLabel}</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menu.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={location.pathname === item.path}
                    onClick={() => navigate(item.path)}
                    tooltip={item.title}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="text-xs text-sidebar-foreground/60 mb-2 truncate">{user?.email}</div>
        <SidebarMenuButton onClick={() => signOut().then(() => navigate('/login'))}>
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
