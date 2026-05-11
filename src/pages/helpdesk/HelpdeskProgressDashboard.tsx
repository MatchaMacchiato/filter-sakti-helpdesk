import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart3, MapPin, Search, Users, Package, Calendar,
  ChevronDown, ChevronUp, Trash2, Loader2
} from 'lucide-react';
import type { HelpdeskProgressData, Segment } from '@/types/helpdesk';
import { SEGMENT_LIST, SEGMENT_LABELS, SEGMENT_COLORS, SOLVER_LIST } from '@/types/helpdesk';

interface HelpdeskProgressDashboardProps {
  progressData: HelpdeskProgressData[];
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
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());
  const [deletingBatch, setDeletingBatch] = useState<string | null>(null);

  // Stats per segment
  const segmentStats = useMemo(() => {
    const stats: Record<string, number> = { JAKTIM: 0, JAKSEL: 0, JAKPUS: 0 };
    progressData.forEach(d => { stats[d.segment] = (stats[d.segment] || 0) + 1; });
    return stats;
  }, [progressData]);

  // Unique solvers that have data
  const activeSolvers = useMemo(() => {
    return [...new Set(progressData.map(d => d.solver))].sort();
  }, [progressData]);

  // Group by batch
  const batches = useMemo(() => {
    const map = new Map<string, { items: HelpdeskProgressData[]; segment: Segment; solver: string; createdAt: string; filterMode: string; inputBy: string }>();
    progressData.forEach(d => {
      if (!map.has(d.batchId)) {
        map.set(d.batchId, {
          items: [],
          segment: d.segment,
          solver: d.solver,
          createdAt: d.createdAt,
          filterMode: d.filterMode,
          inputBy: d.inputBy,
        });
      }
      map.get(d.batchId)!.items.push(d);
    });
    // Sort by date desc
    return [...map.entries()].sort((a, b) => b[1].createdAt.localeCompare(a[1].createdAt));
  }, [progressData]);

  // Filtered batches
  const filteredBatches = useMemo(() => {
    return batches.filter(([, batch]) => {
      if (filterSegment !== 'all' && batch.segment !== filterSegment) return false;
      if (filterSolver !== 'all' && batch.solver !== filterSolver) return false;
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
  }, [batches, filterSegment, filterSolver, search]);

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
            Data keseluruhan dari semua segmen
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Total Data</p>
                <p className="text-2xl font-bold">{progressData.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {SEGMENT_LIST.map(seg => {
          const colors = SEGMENT_COLORS[seg];
          return (
            <Card key={seg}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: colors.bg }}>
                    <MapPin className="w-5 h-5" style={{ color: colors.text }} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">{seg}</p>
                    <p className="text-2xl font-bold">{segmentStats[seg] || 0}</p>
                  </div>
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
          <SelectTrigger className="w-[160px]">
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
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Solver" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Solver</SelectItem>
            {activeSolvers.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
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
              Data akan muncul setelah dikirim dari halaman Bulk Input.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredBatches.map(([batchId, batch]) => {
            const isExpanded = expandedBatches.has(batchId);
            const colors = SEGMENT_COLORS[batch.segment];

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
                      {getWIBDateString(batch.createdAt)}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {batch.inputBy || '-'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{batch.items.length} data</Badge>
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
                            <TableHead>Status</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Workzone</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {batch.items.map((item, idx) => (
                            <TableRow key={item.id}>
                              <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                              <TableCell className="font-mono text-xs">{item.workorder}</TableCell>
                              <TableCell className="font-mono text-xs">{item.scOrder}</TableCell>
                              <TableCell className="font-mono text-xs">{item.serviceNo}</TableCell>
                              <TableCell><Badge variant="outline" className="text-xs">{item.status}</Badge></TableCell>
                              <TableCell className="text-xs max-w-[150px] truncate">{item.customerName}</TableCell>
                              <TableCell className="text-xs">{item.workzone}</TableCell>
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
