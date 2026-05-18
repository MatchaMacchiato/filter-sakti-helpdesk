import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import type { HelpdeskTask, Segment, StatusBima } from '@/types/helpdesk';
import { SEGMENT_LIST, SEGMENT_COLORS, FINAL_STATUSES, getStatusLabel } from '@/types/helpdesk';
import { CheckCircle, Ban, Search, Package, FlagTriangleRight, Copy, Check } from 'lucide-react';

interface StatusFinalPageProps {
  tasks: HelpdeskTask[];
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'COMPWORK': return 'bg-green-500';
    case 'CANCLWORK': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

export function HelpdeskStatusFinalPage({ tasks }: StatusFinalPageProps) {
  const [search, setSearch] = useState('');
  const [activeSegmentTab, setActiveSegmentTab] = useState<Segment>('JAKTIM');
  const [filterStatus, setFilterStatus] = useState<'all' | 'COMPWORK' | 'CANCLWORK'>('all');
  const [copied, setCopied] = useState(false);

  // Only show tasks with final status
  const finalTasks = useMemo(() => {
    return tasks.filter(t => FINAL_STATUSES.includes(t.statusBima as StatusBima));
  }, [tasks]);

  const getSegmentTasks = (segment: Segment) => {
    return finalTasks.filter(t => {
      if (t.segment !== segment) return false;
      if (filterStatus !== 'all' && t.statusBima !== filterStatus) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          t.workorder.toLowerCase().includes(s) ||
          t.scOrder.toLowerCase().includes(s) ||
          t.serviceNo.toLowerCase().includes(s) ||
          t.customerName.toLowerCase().includes(s) ||
          t.solver.toLowerCase().includes(s) ||
          t.kendala?.toLowerCase().includes(s)
        );
      }
      return true;
    });
  };

  // Stats
  const stats = useMemo(() => {
    const result: Record<Segment, { compwork: number; canclwork: number; total: number }> = {
      JAKTIM: { compwork: 0, canclwork: 0, total: 0 },
      JAKSEL: { compwork: 0, canclwork: 0, total: 0 },
      JAKPUS: { compwork: 0, canclwork: 0, total: 0 },
    };
    finalTasks.forEach(t => {
      result[t.segment].total++;
      if (t.statusBima === 'COMPWORK') result[t.segment].compwork++;
      if (t.statusBima === 'CANCLWORK') result[t.segment].canclwork++;
    });
    return result;
  }, [finalTasks]);

  const totalCompwork = finalTasks.filter(t => t.statusBima === 'COMPWORK').length;
  const totalCanclwork = finalTasks.filter(t => t.statusBima === 'CANCLWORK').length;

  const handleCopy = () => {
    const segTasks = getSegmentTasks(activeSegmentTab);
    const headers = ['No', 'Workorder', 'SC Order', 'Service No', 'Order Type', 'Customer', 'Workzone', 'Solver', 'Kendala', 'Kategori', 'Eskalasi', 'Status'];
    const rows = segTasks.map((t, i) => [
      i + 1, t.workorder, t.scOrder, t.serviceNo, t.crmOrderType,
      t.customerName, t.workzone,
      t.solver?.replace('HD ISH - ', '').replace('HD REGULER - ', '') || '-',
      t.kendala || '-', t.kategori || '-', t.eskalasi || '-', t.statusBima
    ]);
    const csv = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    navigator.clipboard.writeText(csv);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FlagTriangleRight className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Status Final</h1>
          <p className="text-sm text-muted-foreground">
            Order yang sudah berstatus COMPWORK atau CANCLWORK
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-blue-200">
          <CardContent className="py-3 px-4 flex items-center gap-3">
            <Package className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-[10px] text-muted-foreground font-semibold">Total Final</p>
              <p className="text-xl font-bold">{finalTasks.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="py-3 px-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-[10px] text-muted-foreground font-semibold">COMPWORK</p>
              <p className="text-xl font-bold text-green-600">{totalCompwork}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="py-3 px-4 flex items-center gap-3">
            <Ban className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-[10px] text-muted-foreground font-semibold">CANCLWORK</p>
              <p className="text-xl font-bold text-red-600">{totalCanclwork}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <p className="text-[10px] text-muted-foreground font-semibold mb-1">Per Segmen</p>
            <div className="flex gap-2 text-xs">
              {SEGMENT_LIST.map(seg => (
                <span key={seg} className="font-medium" style={{ color: SEGMENT_COLORS[seg].text }}>
                  {seg}: {stats[seg].total}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input placeholder="Cari workorder, customer, solver..." value={search}
            onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {(['all', 'COMPWORK', 'CANCLWORK'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                filterStatus === s ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {s === 'all' ? 'Semua' : s}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Tersalin!' : 'Copy'}
        </Button>
      </div>

      {/* Segment Tabs */}
      <Tabs value={activeSegmentTab} onValueChange={v => setActiveSegmentTab(v as Segment)}>
        <TabsList className="grid w-full grid-cols-3">
          {SEGMENT_LIST.map(seg => (
            <TabsTrigger key={seg} value={seg} className="gap-1">
              {seg}
              <Badge variant="outline" className="text-[10px] ml-1 h-5 px-1.5">
                {getSegmentTasks(seg).length}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {SEGMENT_LIST.map(segment => {
          const segTasks = getSegmentTasks(segment);
          const colors = SEGMENT_COLORS[segment];

          return (
            <TabsContent key={segment} value={segment}>
              {segTasks.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FlagTriangleRight className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="font-semibold mb-1">Belum ada order final di {segment}</p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <span style={{ color: colors.text }}>{segment}</span>
                      — {segTasks.length} Order Final
                      <span className="text-green-600 text-xs ml-2">✓ {stats[segment].compwork} COMPWORK</span>
                      <span className="text-red-600 text-xs">✕ {stats[segment].canclwork} CANCLWORK</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-auto max-h-[500px] rounded-md border">
                      <Table>
                        <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                          <TableRow>
                            <TableHead className="w-10">No</TableHead>
                            <TableHead>Workorder</TableHead>
                            <TableHead>SC Order</TableHead>
                            <TableHead>Service No</TableHead>
                            <TableHead>Order Type</TableHead>
                            <TableHead>Status Filter</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Workzone</TableHead>
                            <TableHead>Solver</TableHead>
                            <TableHead>Kendala</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {segTasks.map((task, i) => (
                            <TableRow key={task.id} className={task.statusBima === 'COMPWORK' ? 'bg-green-50/50' : 'bg-red-50/30'}>
                              <TableCell className="text-muted-foreground text-xs">{i + 1}</TableCell>
                              <TableCell className="font-mono text-xs">{task.workorder}</TableCell>
                              <TableCell className="font-mono text-xs">{task.scOrder}</TableCell>
                              <TableCell className="font-mono text-xs">{task.serviceNo}</TableCell>
                              <TableCell className="text-xs">{task.crmOrderType}</TableCell>
                              <TableCell className="text-xs">{task.filterStatus}</TableCell>
                              <TableCell className="text-xs max-w-[120px] truncate">{task.customerName}</TableCell>
                              <TableCell className="text-xs">{task.workzone}</TableCell>
                              <TableCell className="text-xs font-medium">
                                {task.solver?.replace('HD ISH - ', '').replace('HD REGULER - ', '') || '—'}
                              </TableCell>
                              <TableCell className="text-xs">{task.kendala || '—'}</TableCell>
                              <TableCell>
                                <Badge className={`text-[10px] ${getStatusColor(task.statusBima || '')}`}>
                                  {task.statusBima}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
