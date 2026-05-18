import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  ClipboardList,
  CalendarDays,
  Menu,
  X,
  Settings,
  ArrowLeft,
  BarChart3,
  MapPin,
  FlagTriangleRight,
  AlertTriangle
} from 'lucide-react';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';

interface HelpdeskLayoutProps {
  children: React.ReactNode;
}

export function HelpdeskLayout({ children }: HelpdeskLayoutProps) {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const mainNavItems = [
    { path: '/helpdesk', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/helpdesk/input', label: 'Input Progres', icon: ClipboardList },
    { path: '/helpdesk/daily', label: 'Progres Harian', icon: CalendarDays },
    { path: '/helpdesk/progress-dashboard', label: 'Dashboard Monitoring', icon: BarChart3 },
    { path: '/helpdesk/area', label: 'Area', icon: MapPin },
    { path: '/helpdesk/status-final', label: 'Status Final', icon: FlagTriangleRight },
    { path: '/helpdesk/eskalasi', label: 'Eskalasi', icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 bg-white border-r flex-col">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-primary">Helpdesk Tracker</h1>
          <p className="text-xs text-muted-foreground mt-1">Sistem Input Data Helpdesk</p>
        </div>
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {mainNavItems.map((item) => (
            <Link key={item.path} to={item.path}>
              <Button
                variant={location.pathname === item.path ? 'default' : 'ghost'}
                className="w-full justify-start gap-3"
                size="sm"
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>

        {/* Admin Menu di bawah dengan ikon Settings - ADMIN ONLY */}
        {isAdmin && (
          <div className="p-4 border-t">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-3" size="sm">
                  <Settings className="w-4 h-4" />
                  Admin Settings
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <Link to="/helpdesk/admin">
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="w-4 h-4 mr-2" />
                    Mode Admin (Input Data Master)
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Back to Landing */}
        <div className="p-4 border-t">
          <Link to="/">
            <Button variant="outline" className="w-full justify-start gap-3" size="sm">
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Menu Utama
            </Button>
          </Link>
        </div>

        <div className="p-4 border-t text-xs text-center text-muted-foreground">
          © 2026 Helpdesk Tracker
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b z-50">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-lg font-bold text-primary">Helpdesk Tracker</h1>
          <div className="flex items-center gap-2">
            {/* Settings untuk mobile - ADMIN ONLY */}
            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Settings className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <Link to="/helpdesk/admin" onClick={() => setIsSidebarOpen(false)}>
                    <DropdownMenuItem className="cursor-pointer">
                      <Settings className="w-4 h-4 mr-2" />
                      Mode Admin
                    </DropdownMenuItem>
                  </Link>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isSidebarOpen && (
          <nav className="border-t p-4 space-y-1.5 bg-white max-h-[70vh] overflow-y-auto">
            {mainNavItems.map((item) => (
              <Link key={item.path} to={item.path} onClick={() => setIsSidebarOpen(false)}>
                <Button
                  variant={location.pathname === item.path ? 'default' : 'ghost'}
                  className="w-full justify-start gap-3"
                  size="sm"
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
            <Link to="/" onClick={() => setIsSidebarOpen(false)}>
              <Button variant="outline" className="w-full justify-start gap-3 mt-2" size="sm">
                <ArrowLeft className="w-4 h-4" />
                Menu Utama
              </Button>
            </Link>
          </nav>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 mt-16 md:mt-0 overflow-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
