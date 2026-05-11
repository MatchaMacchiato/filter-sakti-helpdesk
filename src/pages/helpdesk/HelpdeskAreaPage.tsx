import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HelpdeskTask, SEGMENT_LIST, SEGMENT_COLORS, AREA_MAPPING, StatusBima, getStatusLabel } from '@/types/helpdesk';
import { MapPin, Search, CheckCircle, Clock, Ban, AlertCircle, Wrench } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface HelpdeskAreaPageProps {
  tasks: HelpdeskTask[];
}

export function HelpdeskAreaPage({ tasks }: HelpdeskAreaPageProps) {
  const [activeTab, setActiveTab] = useState<string>('JAKTIM');
  const [searchTerm, setSearchTerm] = useState('');

  // Hanya ambil data Setting
  const settingTasks = useMemo(() => {
    return tasks.filter(t => t.kategori === 'Setting');
  }, [tasks]);

  // Extract area code from workzone (misal "JKT-CWA" -> "CWA", atau jika hanya "CWA" ya "CWA")
  const getAreaCode = (workzone: string) => {
    if (!workzone) return '';
    // Kadang workzone formatnya "JKT-CWA", kadang cuma "CWA"
    const parts = workzone.split('-');
    return parts[parts.length - 1].toUpperCase().trim();
  };

  // Filter tasks based on search
  const filteredTasks = useMemo(() => {
    if (!searchTerm) return settingTasks;
    const term = searchTerm.toLowerCase();
    return settingTasks.filter(t => 
      t.workorder.toLowerCase().includes(term) ||
      t.scOrder.toLowerCase().includes(term) ||
      t.serviceNo.toLowerCase().includes(term) ||
      t.customerName.toLowerCase().includes(term) ||
      t.kendala?.toLowerCase().includes(term) ||
      (t.statusBima || '').toLowerCase().includes(term)
    );
  }, [settingTasks, searchTerm]);

  // Group by Area
  const groupedByArea = useMemo(() => {
    const map: Record<string, HelpdeskTask[]> = {};
    
    filteredTasks.forEach(task => {
      const area = getAreaCode(task.workzone);
      if (!map[area]) map[area] = [];
      map[area].push(task);
    });
    
    return map;
  }, [filteredTasks]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPWORK': return 'bg-green-100 text-green-700 border-green-300';
      case 'WAPPR': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'INSTCOMP': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'ACTCOMP': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'CANCLWORK': return 'bg-red-100 text-red-700 border-red-300';
      case 'WORKFAIL': return 'bg-gray-200 text-gray-700 border-gray-400';
      default: return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <MapPin className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Dashboard Area</h1>
          <p className="text-sm text-muted-foreground">
            Monitoring data Kategori "Setting" berdasarkan Area Workzone
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Cari workorder, SC Order, kendala..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md mb-6">
          {SEGMENT_LIST.map(seg => (
            <TabsTrigger key={seg} value={seg}>{seg}</TabsTrigger>
          ))}
        </TabsList>

        {SEGMENT_LIST.map(segment => {
          const colors = SEGMENT_COLORS[segment];
          const expectedAreas = AREA_MAPPING[segment] || [];
          
          // Total task di segment ini
          let totalSegmentTasks = 0;
          expectedAreas.forEach(a => {
            totalSegmentTasks += (groupedByArea[a]?.length || 0);
          });
          
          return (
            <TabsContent key={segment} value={segment} className="mt-0">
              <div className="mb-4 flex items-center justify-between bg-white p-4 rounded-lg border shadow-sm" style={{ borderLeft: `4px solid ${colors.text}` }}>
                <h2 className="text-xl font-semibold flex items-center gap-2" style={{ color: colors.text }}>
                  Segmen {segment}
                </h2>
                <Badge variant="outline" className="text-sm font-bold">
                  Total Data Setting: {totalSegmentTasks}
                </Badge>
              </div>

              {expectedAreas.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground bg-white rounded-lg border">
                  Belum ada mapping area untuk segmen ini
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {expectedAreas.map(area => {
                    const areaTasks = groupedByArea[area] || [];
                    
                    const compwork = areaTasks.filter(t => t.statusBima === 'COMPWORK').length;
                    const wappr = areaTasks.filter(t => t.statusBima === 'WAPPR').length;
                    const canclwork = areaTasks.filter(t => t.statusBima === 'CANCLWORK').length;
                    const other = areaTasks.length - (compwork + wappr + canclwork);

                    return (
                      <Card key={area} className="overflow-hidden hover:shadow-md transition-all border-l-4" style={{ borderLeftColor: colors.text }}>
                        <CardHeader className="bg-slate-50 py-3 pb-2 flex flex-row items-center justify-between border-b">
                          <CardTitle className="text-lg font-bold">AREA {area}</CardTitle>
                          <Badge className="font-bold text-sm" variant={areaTasks.length > 0 ? "default" : "secondary"}>
                            {areaTasks.length}
                          </Badge>
                        </CardHeader>
                        <CardContent className="p-0">
                          {areaTasks.length === 0 ? (
                            <div className="py-6 text-center text-xs text-muted-foreground bg-white">
                              Tidak ada data
                            </div>
                          ) : (
                            <div className="flex flex-col">
                              {/* Summary Stats */}
                              <div className="grid grid-cols-4 divide-x border-b bg-white">
                                <div className="p-2 flex flex-col items-center justify-center text-center">
                                  <span className="text-[10px] text-muted-foreground font-semibold mb-1">DONE</span>
                                  <span className="text-green-600 font-bold text-sm flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" /> {compwork}
                                  </span>
                                </div>
                                <div className="p-2 flex flex-col items-center justify-center text-center">
                                  <span className="text-[10px] text-muted-foreground font-semibold mb-1">WAPPR</span>
                                  <span className="text-yellow-600 font-bold text-sm flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {wappr}
                                  </span>
                                </div>
                                <div className="p-2 flex flex-col items-center justify-center text-center">
                                  <span className="text-[10px] text-muted-foreground font-semibold mb-1">CANCEL</span>
                                  <span className="text-red-600 font-bold text-sm flex items-center gap-1">
                                    <Ban className="w-3 h-3" /> {canclwork}
                                  </span>
                                </div>
                                <div className="p-2 flex flex-col items-center justify-center text-center">
                                  <span className="text-[10px] text-muted-foreground font-semibold mb-1">OTHER</span>
                                  <span className="text-slate-600 font-bold text-sm flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> {other}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Task List Preview */}
                              <div className="max-h-[200px] overflow-y-auto bg-slate-50 p-2 space-y-2">
                                {areaTasks.map(task => (
                                  <div key={task.id} className="bg-white p-2 rounded border text-xs flex flex-col gap-1.5 shadow-sm">
                                    <div className="flex items-start justify-between gap-2">
                                      <span className="font-mono font-medium truncate" title={task.workorder}>
                                        {task.workorder}
                                      </span>
                                      <Badge variant="outline" className={`text-[9px] px-1 py-0 h-4 border ${getStatusColor(task.statusBima || '')}`}>
                                        {task.statusBima || 'PENDING'}
                                      </Badge>
                                    </div>
                                    
                                    <div className="text-muted-foreground flex items-center justify-between gap-1">
                                      <span className="truncate max-w-[120px]" title={task.customerName}>{task.customerName}</span>
                                      <span className="font-medium text-slate-700 truncate" title={task.solver}>
                                        {task.solver?.replace('HD ISH - ', '').replace('HD REGULER - ', '') || '-'}
                                      </span>
                                    </div>
                                    
                                    {task.kendala && (
                                      <div className="mt-1 pt-1 border-t text-[10px] text-slate-600 line-clamp-2" title={task.kendala}>
                                        <span className="font-semibold mr-1">Kendala:</span> 
                                        {task.kendala}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
