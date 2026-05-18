import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  BarChart3, MapPin, Search, Package,
  CheckCircle, Zap, Clock, Wrench, Ban, AlertCircle
} from 'lucide-react';
import type { HelpdeskTask, Segment } from '@/types/helpdesk';
import { SEGMENT_LIST, SEGMENT_COLORS, AREA_MAPPING, STATUS_BIMA_OPTIONS } from '@/types/helpdesk';

interface HelpdeskProgressDashboardProps {
  progressData: HelpdeskTask[];
}

const STATUS_DISPLAY: Record<string, { icon: typeof Zap; color: string; bgColor: string }> = {
  STARWORK:  { icon: Zap,          color: 'text-cyan-600',   bgColor: 'bg-cyan-50' },
  COMPWORK:  { icon: CheckCircle,  color: 'text-green-600',  bgColor: 'bg-green-50' },
  WAPPR:     { icon: Clock,        color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
  INSTCOMP:  { icon: Wrench,       color: 'text-blue-600',   bgColor: 'bg-blue-50' },
  ACTCOMP:   { icon: CheckCircle,  color: 'text-purple-600', bgColor: 'bg-purple-50' },
  CANCLWORK: { icon: Ban,          color: 'text-red-600',    bgColor: 'bg-red-50' },
  WORKFAIL:  { icon: AlertCircle,  color: 'text-gray-600',   bgColor: 'bg-gray-50' },
};

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case 'STARWORK': return 'bg-cyan-500';
    case 'COMPWORK': return 'bg-green-500';
    case 'WAPPR': return 'bg-yellow-500';
    case 'INSTCOMP': return 'bg-blue-500';
    case 'ACTCOMP': return 'bg-purple-500';
    case 'CANCLWORK': return 'bg-red-500';
    case 'WORKFAIL': return 'bg-gray-700';
    default: return 'bg-gray-400';
  }
};

const getAreaCode = (workzone: string) => {
  if (!workzone) return '';
  const parts = workzone.split('-');
  return parts[parts.length - 1].toUpperCase().trim();
};

export function HelpdeskProgressDashboard({ progressData }: HelpdeskProgressDashboardProps) {
  const [search, setSearch] = useState('');
  const [filterSegment, setFilterSegment] = useState<Segment | 'all'>('all');
  const [detailDialog, setDetailDialog] = useState<{ segment: Segment; area: string; status: string } | null>(null);

  // Build per-segment, per-area, per-status counts
  const segmentAreaData = useMemo(() => {
    const data: Record<Segment, Record<string, Record<string, HelpdeskTask[]>>> = {
      JAKTIM: {}, JAKSEL: {}, JAKPUS: {},
    };

    progressData.forEach(task => {
      const segment = task.segment;
      const area = getAreaCode(task.workzone) || 'UNKNOWN';
      if (!data[segment][area]) data[segment][area] = {};
      const status = task.statusBima || 'NO_STATUS';
      if (!data[segment][area][status]) data[segment][area][status] = [];
      data[segment][area][status].push(task);
    });

    return data;
  }, [progressData]);

  // Overall stats per segment
  const segmentStats = useMemo(() => {
    const stats: Record<Segment, Record<string, number>> = {
      JAKTIM: {}, JAKSEL: {}, JAKPUS: {},
    };
    progressData.forEach(task => {
      const s = task.statusBima || 'NO_STATUS';
      stats[task.segment][s] = (stats[task.segment][s] || 0) + 1;
    });
    return stats;
  }, [progressData]);

  const totalBySegment = useMemo(() => {
    const totals: Record<Segment, number> = { JAKTIM: 0, JAKSEL: 0, JAKPUS: 0 };
    progressData.forEach(t => totals[t.segment]++);
    return totals;
  }, [progressData]);

  // Get orders for detail dialog
  const detailOrders = useMemo(() => {
    if (!detailDialog) return [];
    const { segment, area, status } = detailDialog;
    return segmentAreaData[segment]?.[area]?.[status] || [];
  }, [detailDialog, segmentAreaData]);

  const segmentsToShow = filterSegment === 'all' ? SEGMENT_LIST : [filterSegment as Segment];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart3 className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Dashboard Monitoring</h1>
          <p className="text-sm text-muted-foreground">
            Monitoring status order per segmen dan area
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="py-3 px-4 flex items-center gap-3">
            <Package className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-[10px] text-muted-foreground font-semibold">Total Order</p>
              <p className="text-xl font-bold">{progressData.length}</p>
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
                  <p className="text-xl font-bold">{totalBySegment[seg]}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
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
      </div>

      {/* Segment Tables */}
      {segmentsToShow.map(segment => {
        const colors = SEGMENT_COLORS[segment];
        const expectedAreas = AREA_MAPPING[segment] || [];
        const segData = segmentAreaData[segment];

        return (
          <Card key={segment} className="overflow-hidden" style={{ borderLeft: `4px solid ${colors.text}` }}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="w-5 h-5" style={{ color: colors.text }} />
                  Segmen {segment}
                </CardTitle>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-sm font-bold">
                    Total: {totalBySegment[segment]}
                  </Badge>
                  {/* Status summary badges */}
                  {STATUS_BIMA_OPTIONS.map(status => {
                    const count = segmentStats[segment]?.[status] || 0;
                    if (count === 0) return null;
                    return (
                      <Badge key={status} className={`${getStatusBadgeColor(status)} text-[10px]`}>
                        {status}: {count}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="overflow-auto rounded-md border">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-20 font-bold">Area</TableHead>
                      <TableHead className="text-center w-14 font-bold">Total</TableHead>
                      {STATUS_BIMA_OPTIONS.map(s => (
                        <TableHead key={s} className="text-center w-20">
                          <span className="text-[10px] font-bold">{s}</span>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expectedAreas.map(area => {
                      const areaData = segData?.[area] || {};
                      const totalArea = Object.values(areaData).reduce((sum, arr) => sum + arr.length, 0);

                      return (
                        <TableRow key={area} className="hover:bg-muted/30">
                          <TableCell className="font-bold text-sm">{area}</TableCell>
                          <TableCell className="text-center font-bold">{totalArea}</TableCell>
                          {STATUS_BIMA_OPTIONS.map(status => {
                            const count = areaData[status]?.length || 0;
                            const cfg = STATUS_DISPLAY[status];
                            return (
                              <TableCell key={status} className="text-center">
                                {count > 0 ? (
                                  <button
                                    onClick={() => setDetailDialog({ segment, area, status })}
                                    className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm transition-all hover:scale-110 ${cfg?.bgColor || 'bg-gray-50'} ${cfg?.color || 'text-gray-600'}`}
                                    title={`${area} - ${status}: ${count} order`}
                                  >
                                    {count}
                                  </button>
                                ) : (
                                  <span className="text-muted-foreground text-xs">—</span>
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })}
                    {/* Total row */}
                    <TableRow className="bg-muted/50 font-bold border-t-2">
                      <TableCell className="font-bold">TOTAL</TableCell>
                      <TableCell className="text-center font-bold">{totalBySegment[segment]}</TableCell>
                      {STATUS_BIMA_OPTIONS.map(status => {
                        const count = segmentStats[segment]?.[status] || 0;
                        return (
                          <TableCell key={status} className="text-center font-bold text-sm">
                            {count > 0 ? count : '—'}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {progressData.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <Package className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Belum Ada Data</h3>
            <p className="text-muted-foreground text-sm">
              Data akan muncul setelah order diimport dari Filter Sakti.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Detail Dialog — show orders for specific area + status */}
      <Dialog open={!!detailDialog} onOpenChange={() => setDetailDialog(null)}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              {detailDialog && (
                <>
                  Area {detailDialog.area} — 
                  <Badge className={`${getStatusBadgeColor(detailDialog.status)} ml-1`}>
                    {detailDialog.status}
                  </Badge>
                  <span className="text-muted-foreground text-sm ml-2">({detailOrders.length} order)</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-auto flex-1 border rounded-lg">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow>
                  <TableHead className="w-10">No</TableHead>
                  <TableHead>Workorder</TableHead>
                  <TableHead>SC Order</TableHead>
                  <TableHead>Service No</TableHead>
                  <TableHead>Order Type</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Kendala</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Eskalasi</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detailOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      Tidak ada data
                    </TableCell>
                  </TableRow>
                ) : (
                  detailOrders.map((task, i) => (
                    <TableRow key={task.id}>
                      <TableCell className="text-xs">{i + 1}</TableCell>
                      <TableCell className="font-mono text-xs">{task.workorder}</TableCell>
                      <TableCell className="font-mono text-xs">{task.scOrder}</TableCell>
                      <TableCell className="font-mono text-xs">{task.serviceNo}</TableCell>
                      <TableCell className="text-xs">{task.crmOrderType}</TableCell>
                      <TableCell className="text-xs max-w-[120px] truncate">{task.customerName}</TableCell>
                      <TableCell className="text-xs max-w-[150px] truncate">{task.address}</TableCell>
                      <TableCell className="text-xs">{task.kendala || '—'}</TableCell>
                      <TableCell className="text-xs">{task.kategori || '—'}</TableCell>
                      <TableCell className="text-xs">{task.eskalasi || '—'}</TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] ${getStatusBadgeColor(task.statusBima || '')}`}>
                          {task.statusBima || '—'}
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
    </div>
  );
}
