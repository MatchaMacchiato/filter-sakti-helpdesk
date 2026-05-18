import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { HelpdeskData, HelpdeskTask, StatusBima } from '@/types/helpdesk';
import { getStatusLabel } from '@/types/helpdesk';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ClipboardList, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  BarChart3,
  GraduationCap,
  Wrench,
  Ban,
  Eye,
  Search,
  Copy,
  Check,
  X,
  FileSpreadsheet,
  Trophy,
  ChevronDown,
  RotateCcw,
  Zap
} from 'lucide-react';

interface UnifiedData {
  id: string;
  namaInput: string;
  inet: string;
  scOrder: string;
  kendala: string;
  kategori: string;
  eskalasi: string;
  statusBima: StatusBima | string;
  createdAt: string;
  // Extra task fields for detail view
  workorder?: string;
  serviceNo?: string;
  customerName?: string;
  segment?: string;
  filterStatus?: string;
}

interface HelpdeskDashboardProps {
  helpdeskData: HelpdeskData[];
  tasks: HelpdeskTask[];
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'STARWORK': return 'bg-cyan-500';
    case 'COMPWORK': return 'bg-green-500';
    case 'WAPPR': return 'bg-yellow-500';
    case 'INSTCOMP': return 'bg-blue-500';
    case 'ACTCOMP': return 'bg-purple-500';
    case 'CANCLWORK': return 'bg-red-500';
    case 'WORKFAIL': return 'bg-gray-700';
    default: return 'bg-gray-500';
  }
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  STARWORK:  { label: 'STARWORK',  color: 'text-cyan-700',   bg: 'bg-cyan-100' },
  COMPWORK:  { label: 'COMPWORK',  color: 'text-green-700',  bg: 'bg-green-100' },
  WAPPR:     { label: 'WAPPR',     color: 'text-yellow-700', bg: 'bg-yellow-100' },
  INSTCOMP:  { label: 'INSTCOMP',  color: 'text-blue-700',   bg: 'bg-blue-100' },
  ACTCOMP:   { label: 'ACTCOMP',   color: 'text-purple-700', bg: 'bg-purple-100' },
  CANCLWORK: { label: 'CANCLWORK', color: 'text-red-700',    bg: 'bg-red-100' },
  WORKFAIL:  { label: 'WORKFAIL',  color: 'text-gray-700',   bg: 'bg-gray-200' },
};

export function HelpdeskDashboard({ helpdeskData, tasks }: HelpdeskDashboardProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [showViewAll, setShowViewAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  const [expandedNames, setExpandedNames] = useState<Set<string>>(new Set());
  const [statusDetailDialog, setStatusDetailDialog] = useState<string | null>(null);
  const [leaderboardResetDate, setLeaderboardResetDate] = useState<string>('');

  // Load leaderboard reset date
  useEffect(() => {
    const loadResetDate = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'leaderboard'));
        if (settingsDoc.exists()) {
          setLeaderboardResetDate(settingsDoc.data().resetDate || '');
        } else {
          // Initialize with start of current month
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
          setLeaderboardResetDate(startOfMonth);
        }
      } catch (err) {
        console.error('Failed to load leaderboard reset date:', err);
      }
    };
    loadResetDate();
  }, []);

  const handleResetLeaderboard = async () => {
    if (!isAdmin) return;
    if (!confirm('Apakah Anda yakin ingin mereset leaderboard? Perhitungan akan mulai dari sekarang.')) return;
    try {
      const now = new Date().toISOString();
      await setDoc(doc(db, 'settings', 'leaderboard'), { resetDate: now });
      setLeaderboardResetDate(now);
    } catch (err) {
      console.error('Failed to reset leaderboard:', err);
    }
  };

  const toggleExpand = (name: string) => {
    setExpandedNames(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const unifiedData = useMemo(() => {
    const list: UnifiedData[] = [];
    helpdeskData.forEach(d => {
      list.push({
        id: d.id,
        namaInput: d.namaInput,
        inet: d.inet,
        scOrder: d.scOrder,
        kendala: d.kendala,
        kategori: d.kategori,
        eskalasi: d.eskalasi,
        statusBima: d.statusBima,
        createdAt: d.createdAt
      });
    });
    tasks.forEach(t => {
      if (t.statusBima) {
        list.push({
          id: t.id,
          namaInput: t.solver,
          inet: t.serviceNo,
          scOrder: t.scOrder,
          kendala: t.kendala,
          kategori: t.kategori,
          eskalasi: t.eskalasi,
          statusBima: t.statusBima,
          createdAt: t.updatedAt || t.importedAt,
          workorder: t.workorder,
          serviceNo: t.serviceNo,
          customerName: t.customerName,
          segment: t.segment,
          filterStatus: t.filterStatus,
        });
      }
    });
    return list;
  }, [helpdeskData, tasks]);

  const totalHelpdeskData = unifiedData.length;
  
  // Status counts
  const starworkCount = unifiedData.filter((d: UnifiedData) => d.statusBima === 'STARWORK').length;
  const compworkCount = unifiedData.filter((d: UnifiedData) => d.statusBima === 'COMPWORK').length;
  const wapprCount = unifiedData.filter((d: UnifiedData) => d.statusBima === 'WAPPR').length;
  const instcompCount = unifiedData.filter((d: UnifiedData) => d.statusBima === 'INSTCOMP').length;
  const actcompCount = unifiedData.filter((d: UnifiedData) => d.statusBima === 'ACTCOMP').length;
  const canclworkCount = unifiedData.filter((d: UnifiedData) => d.statusBima === 'CANCLWORK').length;
  const workfailCount = unifiedData.filter((d: UnifiedData) => d.statusBima === 'WORKFAIL').length;

  const agentStats = [
    { title: 'Total Progress', value: totalHelpdeskData, icon: ClipboardList, color: 'bg-blue-500', textColor: 'text-blue-500', statusKey: '' },
    { title: 'STARWORK', value: starworkCount, icon: Zap, color: 'bg-cyan-500', textColor: 'text-cyan-500', statusKey: 'STARWORK' },
    { title: 'COMPWORK', value: compworkCount, icon: CheckCircle, color: 'bg-green-500', textColor: 'text-green-500', statusKey: 'COMPWORK' },
    { title: 'WAPPR', value: wapprCount, icon: Clock, color: 'bg-yellow-500', textColor: 'text-yellow-500', statusKey: 'WAPPR' },
    { title: 'INSTCOMP', value: instcompCount, icon: Wrench, color: 'bg-blue-500', textColor: 'text-blue-500', statusKey: 'INSTCOMP' },
    { title: 'ACTCOMP', value: actcompCount, icon: CheckCircle, color: 'bg-purple-500', textColor: 'text-purple-500', statusKey: 'ACTCOMP' },
    { title: 'CANCLWORK', value: canclworkCount, icon: Ban, color: 'bg-red-500', textColor: 'text-red-500', statusKey: 'CANCLWORK' },
    { title: 'WORKFAIL', value: workfailCount, icon: AlertCircle, color: 'bg-gray-700', textColor: 'text-gray-700', statusKey: 'WORKFAIL' },
  ];

  const filteredData = unifiedData.filter((item: UnifiedData) => 
    (item.kendala || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.kategori || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.eskalasi || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.inet || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.scOrder || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.statusBima || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Leaderboard: count only COMPWORK + CANCLWORK, filtered by reset date
  const leaderboardMap = unifiedData.reduce<Record<string, { displayName: string; count: number; statusBreakdown: Record<string, number> }>>((acc, item: UnifiedData) => {
    // Only count COMPWORK and CANCLWORK
    if (item.statusBima !== 'COMPWORK' && item.statusBima !== 'CANCLWORK') return acc;
    // Filter by reset date
    if (leaderboardResetDate && item.createdAt && item.createdAt < leaderboardResetDate) return acc;

    const raw = item.namaInput?.trim();
    // Exclude tasks that have no solver assigned
    if (!raw || raw === 'Tidak Diketahui') return acc;
    
    const key = raw.toLowerCase();
    if (!acc[key]) {
      const titleCase = raw.replace(/\b\w/g, (c: string) => c.toUpperCase());
      acc[key] = { displayName: titleCase, count: 0, statusBreakdown: {} };
    }
    acc[key].count += 1;
    const s = item.statusBima || 'UNKNOWN';
    acc[key].statusBreakdown[s] = (acc[key].statusBreakdown[s] || 0) + 1;
    return acc;
  }, {});

  const leaderboard = Object.values(leaderboardMap)
    .sort((a, b) => b.count - a.count);

  const maxCount = leaderboard[0]?.count || 1;

  const handleCopyToClipboard = () => {
    const headers = ['No', 'Nama', 'Inet', 'SC ORDER', 'Kendala', 'Kategori', 'Eskalasi', 'STATUS BIMA', 'Tanggal'];
    const rows = filteredData.map((item: UnifiedData, index: number) => [
      index + 1,
      item.namaInput || '-',
      item.inet || '-',
      item.scOrder || '-',
      item.kendala || '-',
      item.kategori || '-',
      item.eskalasi || '-',
      item.statusBima || '-',
      item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID') : '-'
    ]);
    
    const csvContent = [headers.join('\t'), ...rows.map((r: any[]) => r.join('\t'))].join('\n');
    navigator.clipboard.writeText(csvContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Orders for a specific status (for clickable cards)
  const getOrdersByStatus = (statusKey: string) => {
    if (!statusKey) return unifiedData;
    return unifiedData.filter(d => d.statusBima === statusKey);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      {/* Agent Stats with clickable cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Data Agent Helpdesk (Progress)
          </h2>
          <Button 
            onClick={() => setShowViewAll(true)} 
            variant="outline"
            className="gap-2"
          >
            <Eye className="w-4 h-4" />
            View All
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {agentStats.map((stat, index) => (
            <Card 
              key={index} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setStatusDetailDialog(stat.statusKey)}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.color} bg-opacity-10`}>
                  <stat.icon className={`w-5 h-5 ${stat.textColor}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                {stat.statusKey && (
                  <p className="text-xs text-muted-foreground mt-1">Klik untuk detail</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Leaderboard Agent Helpdesk
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Peringkat berdasarkan total COMPWORK + CANCLWORK</p>
              {leaderboardResetDate && (
                <p className="text-xs text-muted-foreground">
                  Mulai dari: {new Date(leaderboardResetDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetLeaderboard}
                className="gap-2 text-orange-600 border-orange-300 hover:bg-orange-50"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Leaderboard
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {leaderboard.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">Belum ada data progress Helpdesk</p>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry) => {
                const rank = leaderboard.findIndex((e: any) => e.count === entry.count) + 1;
                const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;
                const barColor =
                  rank === 1 ? 'bg-yellow-400' :
                  rank === 2 ? 'bg-gray-400' :
                  rank === 3 ? 'bg-amber-600' :
                  'bg-primary';
                const isTopRank = rank <= 3;
                const isExpanded = expandedNames.has(entry.displayName);
                const breakdown = Object.entries(entry.statusBreakdown as Record<string, number>).sort((a, b) => b[1] - a[1]);
                return (
                  <div key={entry.displayName} className="border rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleExpand(entry.displayName)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="w-8 text-center font-bold text-sm shrink-0">
                        {medal ?? <span className="text-muted-foreground">#{rank}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className={`text-sm truncate ${isTopRank ? 'font-semibold' : 'font-medium'}`}>
                            {entry.displayName}
                          </span>
                          <span className="text-sm font-bold ml-2 shrink-0">{entry.count}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div
                            className={`${barColor} h-1.5 rounded-full transition-all duration-500`}
                            style={{ width: `${(entry.count / maxCount) * 100}%` }}
                          />
                        </div>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 shrink-0 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-3 pt-1 bg-muted/30 border-t">
                        <p className="text-xs text-muted-foreground mb-2">Breakdown per status:</p>
                        <div className="flex flex-wrap gap-2">
                          {breakdown.map(([status, cnt]) => {
                            const cfg = STATUS_CONFIG[status];
                            return (
                              <span
                                key={status}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                  cfg ? `${cfg.bg} ${cfg.color}` : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {status}
                                <span className="font-bold">{cnt as React.ReactNode}</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ringkasan — Only COMPWORK percentage */}
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Status Progress Helpdesk</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {totalHelpdeskData > 0 ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Persentase Complete Work (COMPWORK)</span>
                  <span className="font-medium text-green-600">
                    {((compworkCount / totalHelpdeskData) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${(compworkCount / totalHelpdeskData) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {compworkCount} dari {totalHelpdeskData} order sudah Complete Work
                </p>
              </>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                Belum ada data progress Helpdesk untuk ditampilkan
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status Detail Dialog (clickable status cards) */}
      <Dialog open={statusDetailDialog !== null} onOpenChange={() => setStatusDetailDialog(null)}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              {statusDetailDialog ? `Order dengan status ${statusDetailDialog}` : 'Semua Order'}
              <Badge variant="outline">{getOrdersByStatus(statusDetailDialog || '').length} order</Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-auto flex-1 border rounded-lg">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow>
                  <TableHead className="w-10">No</TableHead>
                  <TableHead>Nama / Solver</TableHead>
                  <TableHead>Inet / Service No</TableHead>
                  <TableHead>SC Order</TableHead>
                  <TableHead>Kendala</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Eskalasi</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getOrdersByStatus(statusDetailDialog || '').length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Tidak ada data
                    </TableCell>
                  </TableRow>
                ) : (
                  getOrdersByStatus(statusDetailDialog || '').map((item, idx) => (
                    <TableRow key={item.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell className="font-medium text-primary">{item.namaInput || '-'}</TableCell>
                      <TableCell className="font-mono text-xs">{item.inet || '-'}</TableCell>
                      <TableCell className="font-mono text-xs">{item.scOrder || '-'}</TableCell>
                      <TableCell className="text-xs">{item.kendala || '-'}</TableCell>
                      <TableCell className="text-xs">{item.kategori || '-'}</TableCell>
                      <TableCell className="text-xs">{item.eskalasi || '-'}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(item.statusBima)}>
                          {item.statusBima}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog View All */}
      <Dialog open={showViewAll} onOpenChange={setShowViewAll}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                Semua Data Progress Helpdesk
              </span>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={handleCopyToClipboard} 
                  variant="outline" 
                  size="sm"
                  className="gap-2"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Tersalin!' : 'Copy ke Spreadsheet'}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowViewAll(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 overflow-hidden flex flex-col">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Cari data..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="overflow-auto flex-1 border rounded-lg">
              <Table>
                <TableHeader className="sticky top-0 bg-white">
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Inet</TableHead>
                    <TableHead>SC ORDER</TableHead>
                    <TableHead>Kendala</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Eskalasi</TableHead>
                    <TableHead>STATUS BIMA</TableHead>
                    <TableHead>Tanggal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        Tidak ada data
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((item: UnifiedData, index: number) => (
                      <TableRow key={item.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium text-primary">{item.namaInput || '-'}</TableCell>
                        <TableCell className="font-medium">{item.inet}</TableCell>
                        <TableCell>{item.scOrder}</TableCell>
                        <TableCell>{item.kendala}</TableCell>
                        <TableCell>{item.kategori}</TableCell>
                        <TableCell>{item.eskalasi}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(item.statusBima)}>
                            {item.statusBima}
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {getStatusLabel(item.statusBima as StatusBima)}
                          </div>
                        </TableCell>
                        <TableCell>{item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID') : '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            <div className="text-sm text-muted-foreground text-center">
              Total: {filteredData.length} data
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
