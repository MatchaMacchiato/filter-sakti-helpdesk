import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { HelpdeskTask, Segment } from '@/types/helpdesk';
import { SEGMENT_LIST, SEGMENT_COLORS, ESKALASI_OPTIONS } from '@/types/helpdesk';
import { Search, Package, AlertTriangle, MapPin } from 'lucide-react';

interface HelpdeskEskalasiPageProps {
  tasks: HelpdeskTask[];
}

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


export function HelpdeskEskalasiPage({ tasks }: HelpdeskEskalasiPageProps) {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<string>(ESKALASI_OPTIONS[0]);

  // Group tasks by eskalasi type
  const eskalasiGroups = useMemo(() => {
    const groups: Record<string, HelpdeskTask[]> = {};
    ESKALASI_OPTIONS.forEach(e => { groups[e] = []; });
    
    tasks.forEach(t => {
      if (t.eskalasi && groups[t.eskalasi] !== undefined) {
        groups[t.eskalasi].push(t);
      }
    });
    return groups;
  }, [tasks]);

  // Get tasks for current tab filtered by search and grouped by segment
  const getFilteredTasks = (eskalasi: string) => {
    const eskTasks = eskalasiGroups[eskalasi] || [];
    if (!search) return eskTasks;
    const s = search.toLowerCase();
    return eskTasks.filter(t =>
      t.workorder.toLowerCase().includes(s) ||
      t.scOrder.toLowerCase().includes(s) ||
      t.serviceNo.toLowerCase().includes(s) ||
      t.customerName.toLowerCase().includes(s) ||
      t.solver?.toLowerCase().includes(s)
    );
  };

  const getSegmentTasks = (eskalasi: string, segment: Segment) => {
    return getFilteredTasks(eskalasi).filter(t => t.segment === segment);
  };

  // Count per eskalasi
  const eskalasiCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    ESKALASI_OPTIONS.forEach(e => {
      counts[e] = eskalasiGroups[e]?.length || 0;
    });
    return counts;
  }, [eskalasiGroups]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Eskalasi</h1>
          <p className="text-sm text-muted-foreground">
            Monitoring order berdasarkan jenis eskalasi per segmen
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input placeholder="Cari workorder, customer, solver..."
          value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      {/* Eskalasi Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto pb-2">
          <TabsList className="inline-flex w-auto gap-1 h-auto flex-wrap">
            {ESKALASI_OPTIONS.map(esk => (
              <TabsTrigger 
                key={esk} 
                value={esk}
                className="text-xs px-3 py-1.5 whitespace-nowrap"
              >
                {esk}
                {eskalasiCounts[esk] > 0 && (
                  <Badge variant="destructive" className="text-[9px] h-4 px-1 ml-1">
                    {eskalasiCounts[esk]}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {ESKALASI_OPTIONS.map(eskalasi => {
          const allTasks = getFilteredTasks(eskalasi);

          return (
            <TabsContent key={eskalasi} value={eskalasi} className="space-y-4">
              {/* Summary */}
              <div className="flex items-center gap-4 p-4 bg-white rounded-lg border shadow-sm">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <div>
                  <h2 className="font-bold text-lg">{eskalasi}</h2>
                  <p className="text-sm text-muted-foreground">
                    Total: {allTasks.length} order
                    {SEGMENT_LIST.map(seg => {
                      const count = getSegmentTasks(eskalasi, seg).length;
                      return count > 0 ? (
                        <span key={seg} className="ml-3" style={{ color: SEGMENT_COLORS[seg].text }}>
                          {seg}: {count}
                        </span>
                      ) : null;
                    })}
                  </p>
                </div>
              </div>

              {allTasks.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Package className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="font-semibold">Tidak ada order dengan eskalasi ini</p>
                  </CardContent>
                </Card>
              ) : (
                // Per segment sections
                SEGMENT_LIST.map(segment => {
                  const segTasks = getSegmentTasks(eskalasi, segment);
                  if (segTasks.length === 0) return null;
                  const colors = SEGMENT_COLORS[segment];

                  return (
                    <Card key={segment} className="overflow-hidden" style={{ borderLeft: `4px solid ${colors.text}` }}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <MapPin className="w-4 h-4" style={{ color: colors.text }} />
                          <span style={{ color: colors.text }}>{segment}</span>
                          — {segTasks.length} Order
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-auto max-h-[400px] rounded-md border">
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
                                <TableHead>Status BIMA</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {segTasks.map((task, i) => (
                                <TableRow key={task.id}>
                                  <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
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
                                    {task.statusBima ? (
                                      <Badge className={`text-[10px] ${getStatusBadgeColor(task.statusBima)}`}>
                                        {task.statusBima}
                                      </Badge>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">—</span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
