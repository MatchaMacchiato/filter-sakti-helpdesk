import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart3, MapPin, Search, Users, Package, Calendar,
  ChevronDown, ChevronUp, Trash2, Loader2, CheckCircle, AlertTriangle
} from 'lucide-react';
import type { HelpdeskTask, Segment } from '@/types/helpdesk';
import { SEGMENT_LIST, SEGMENT_COLORS } from '@/types/helpdesk';

interface HelpdeskProgressDashboardProps {
  progressData: HelpdeskTask[];
  onDeleteBatch: (batchId: string) => Promise<void>;
}

// Get WIB date string
const getWIBDateString = (isoString?: string): string => {
  if (!isoString) return 'Unknown';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return 'Invalid';
  return date.toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  });
};

export function HelpdeskProgressDashboard({ progressData, onDeleteBatch }: HelpdeskProgressDashboardProps) {
  const [search, setSearch] = useState('');
  const [filterSegment, setFilterSegment] = useState<Segment | 'all'>('all');
  const [filterSolver, setFilterSolver] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());
  const [deletingBatch, setDeletingBatch] = useState<string | null>(null);

  // Stats
  const stats = useMemo(() => {
    const segStats: Record<string, number> = { JAKTIM: 0, JAKSEL: 0, JAKPUS: 0 };
    let pending = 0, completed = 0;
    progressData.forEach(d => {
      segStats[d.segment] = (segStats[d.segment] || 0) + 1;
      if (d.taskStatus === 'completed') completed++; else pending++;
    });
    return { segments: segStats, pending, completed, total: progressData.length };
  }, [progressData]);

  // Unique solvers that have data
  const activeSolvers = useMemo(() => {
    return [...new Set(progressData.filter(d => d.solver).map(d => d.solver))].sort();
  }, [progressData]);

  // Group by batch
  const batches = useMemo(() => {
    const map = new Map<string, {
      items: HelpdeskTask[]; segment: Segment; solver: string;
      importedAt: string; filterMode: string; importedBy: string;
      completedCount: number;
    }>();
    progressData.forEach(d => {
      if (!map.has(d.batchId)) {
        map.set(d.batchId, {
          items: [], segment: d.segment, solver: d.solver || '—',
          importedAt: d.importedAt, filterMode: d.filterMode,
          importedBy: d.importedBy, completedCount: 0,
        });
      }
      const batch = map.get(d.batchId)!;
      batch.items.push(d);
      if (d.taskStatus === 'completed') batch.completedCount++;
    });
    return [...map.entries()].sort((a, b) => b[1].importedAt.localeCompare(a[1].importedAt));
  }, [progressData]);

  // Filtered batches
  const filteredBatches = useMemo(() => {
    return batches.filter(([, batch]) => {
      if (filterSegment !== 'all' && batch.segment !== filterSegment) return false;
      if (filterSolver !== 'all' && batch.solver !== filterSolver) return false;
      if (filterStatus !== 'all') {
        const allCompleted = batch.completedCount === batch.items.length;
        if (filterStatus === 'completed' && !allCompleted) return false;
        if (filterStatus === 'pending' && allCompleted) return false;
      }
      if (search) {
        const term = search.toLowerCase();
        const matchItems = batch.items.some(item =>
          item.workorder.toLowerCase().includes(term) ||
          item.scOrder.toLowerCase().includes(term) ||
          item.serviceNo.toLowerCase().includes(term) ||
          item.customerName.toLowerCase().includes(term)
        );
        if (!matchItems && !batch.solver.toLowerCase().includes(term)) return false;
      }
      return true;
    });
  }, [batches, filterSegment, filterSolver, filterStatus, search]);

  const toggleBatch = (batchId: string) => {
    setExpandedBatches(prev => {
      const next = new Set(prev);
      if (next.has(batchId)) next.delete(batchId); else next.add(batchId);
      return next;
    });
  };

  const handleDeleteBatch = async (batchId: string) => {
    setDeletingBatch(batchId);
    try {
      await onDeleteBatch(batchId);
    } finally {
      setDeletingBatch(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart3 className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Dashboard Progress</h1>
          <p className="text-sm text-muted-foreground">
            Monitoring data keseluruhan yang sudah diupdate oleh solver
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Card>
          <CardContent className="py-3 px-4 flex items-center gap-3">
            <Package className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-[10px] text-muted-foreground font-semibold">Total</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <div>
              <p className="text-[10px] text-muted-foreground font-semibold">Pending</p>
              <p className="text-xl font-bold">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-[10px] text-muted-foreground font-semibold">Done</p>
              <p className="text-xl font-bold">{stats.completed}</p>
            </div>
          </CardContent>
        </Card>
        {SEGMENT_LIST.map(seg => {
          const colors = SEGMENT_COLORS[seg];
          return (
            <Card key={seg}>
              <CardContent className="py-3 px-4 flex items-center gap-3">
                <MapPin className="w-5 h-5" style={{ color: colors.text }} />
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold">{seg}</p>
                  <p className="text-xl font-bold">{stats.segments[seg] || 0}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Cari workorder, SC Order, customer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterSegment} onValueChange={v => setFilterSegment(v as Segment | 'all')}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Segmen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Segmen</SelectItem>
            {SEGMENT_LIST.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterSolver} onValueChange={setFilterSolver}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Solver" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Solver</SelectItem>
            {activeSolvers.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={v => setFilterStatus(v as 'all' | 'pending' | 'completed')}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Batch List */}
      {filteredBatches.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Package className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Belum Ada Data Progress</h3>
            <p className="text-muted-foreground text-sm">
              Data akan muncul setelah solver mengupdate task dari Input Progres.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredBatches.map(([batchId, batch]) => {
            const isExpanded = expandedBatches.has(batchId);
            const colors = SEGMENT_COLORS[batch.segment];
            const progress = Math.round((batch.completedCount / batch.items.length) * 100);

            return (
              <Card key={batchId} className="overflow-hidden">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => toggleBatch(batchId)}
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge
                      className="text-xs font-bold"
                      style={{ backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
                    >
                      {batch.segment}
                    </Badge>
                    <span className="font-semibold text-sm">{batch.solver}</span>
                    <Badge variant="outline" className="text-xs">{batch.filterMode}</Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {getWIBDateString(batch.importedAt)}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {batch.importedBy || '-'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{batch.completedCount}/{batch.items.length}</span>
                    </div>
                    <Button
                      variant="ghost" size="sm"
                      onClick={e => { e.stopPropagation(); handleDeleteBatch(batchId); }}
                      disabled={deletingBatch === batchId}
                    >
                      {deletingBatch === batchId
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4 text-destructive" />
                      }
                    </Button>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {isExpanded && (
                  <CardContent className="pt-0 pb-4">
                    <div className="overflow-auto max-h-[300px] rounded-md border">
                      <Table>
                        <TableHeader className="sticky top-0 bg-background z-10">
                          <TableRow>
                            <TableHead className="w-10">No</TableHead>
                            <TableHead>Workorder</TableHead>
                            <TableHead>SC Order</TableHead>
                            <TableHead>Service No</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Solver</TableHead>
                            <TableHead>Status BIMA</TableHead>
                            <TableHead>Task</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {batch.items.map((item, idx) => (
                            <TableRow key={item.id} className={item.taskStatus === 'completed' ? 'bg-green-50/50' : ''}>
                              <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                              <TableCell className="font-mono text-xs">{item.workorder}</TableCell>
                              <TableCell className="font-mono text-xs">{item.scOrder}</TableCell>
                              <TableCell className="font-mono text-xs">{item.serviceNo}</TableCell>
                              <TableCell className="text-xs max-w-[150px] truncate">{item.customerName}</TableCell>
                              <TableCell className="text-xs font-medium">
                                {item.solver ? item.solver.replace('HD ISH - ', '').replace('HD REGULER - ', '') : '—'}
                              </TableCell>
                              <TableCell>
                                {item.statusBima
                                  ? <Badge variant="outline" className="text-xs">{item.statusBima}</Badge>
                                  : <span className="text-muted-foreground text-xs">—</span>
                                }
                              </TableCell>
                              <TableCell>
                                {item.taskStatus === 'completed'
                                  ? <Badge className="bg-green-100 text-green-700 border-green-300 text-[10px]">
                                      <CheckCircle className="w-3 h-3 mr-1" />Done
                                    </Badge>
                                  : <Badge variant="outline" className="text-amber-600 border-amber-300 text-[10px]">
                                      Pending
                                    </Badge>
                                }
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
