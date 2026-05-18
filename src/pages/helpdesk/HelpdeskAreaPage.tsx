import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { HelpdeskTask, StatusBima } from '@/types/helpdesk';
import { SEGMENT_LIST, SEGMENT_COLORS, AREA_MAPPING, STATUS_BIMA_OPTIONS, getStatusLabel, ESKALASI_OPTIONS, FINAL_STATUSES, SOLVER_LIST } from '@/types/helpdesk';
import { MapPin, Search, CheckCircle, AlertCircle, Edit, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';

interface HelpdeskAreaPageProps {
  tasks: HelpdeskTask[];
  onUpdateTask: (task: HelpdeskTask) => Promise<void>;
}

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case 'STARWORK': return 'bg-cyan-100 text-cyan-700 border-cyan-300';
    case 'COMPWORK': return 'bg-green-100 text-green-700 border-green-300';
    case 'WAPPR': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    case 'INSTCOMP': return 'bg-blue-100 text-blue-700 border-blue-300';
    case 'ACTCOMP': return 'bg-purple-100 text-purple-700 border-purple-300';
    case 'CANCLWORK': return 'bg-red-100 text-red-700 border-red-300';
    case 'WORKFAIL': return 'bg-gray-200 text-gray-700 border-gray-400';
    default: return 'bg-slate-100 text-slate-700 border-slate-300';
  }
};

const getAreaCode = (workzone: string) => {
  if (!workzone) return '';
  const parts = workzone.split('-');
  return parts[parts.length - 1].toUpperCase().trim();
};

export function HelpdeskAreaPage({ tasks, onUpdateTask }: HelpdeskAreaPageProps) {
  const [activeTab, setActiveTab] = useState<string>('JAKTIM');
  const [searchTerm, setSearchTerm] = useState('');
  const [editTask, setEditTask] = useState<HelpdeskTask | null>(null);
  const [editKategori, setEditKategori] = useState<'Setting' | 'Non Setting' | ''>('');
  const [editSolver, setEditSolver] = useState('');
  const [editKendala, setEditKendala] = useState('');
  const [editEskalasi, setEditEskalasi] = useState('');
  const [editStatusBima, setEditStatusBima] = useState<StatusBima | ''>('');
  const [saving, setSaving] = useState(false);

  // Only show Setting tasks that are NOT final status
  const settingTasks = useMemo(() => {
    return tasks.filter(t => 
      t.kategori === 'Setting' && 
      !FINAL_STATUSES.includes(t.statusBima as StatusBima)
    );
  }, [tasks]);

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
      (t.statusBima || '').toLowerCase().includes(term) ||
      t.solver?.toLowerCase().includes(term)
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

  const openEditDialog = (task: HelpdeskTask) => {
    setEditTask(task);
    setEditKategori(task.kategori || '');
    setEditSolver(task.solver || '');
    setEditKendala(task.kendala || '');
    setEditEskalasi(task.eskalasi || '');
    setEditStatusBima(task.statusBima || '');
  };

  const handleSaveEdit = async () => {
    if (!editTask) return;
    setSaving(true);
    try {
      const isFinal = FINAL_STATUSES.includes(editStatusBima as StatusBima);
      await onUpdateTask({
        ...editTask,
        kategori: editKategori,
        solver: editSolver,
        kendala: editKendala,
        eskalasi: editEskalasi,
        statusBima: editStatusBima,
        taskStatus: isFinal ? 'completed' : 'pending',
        updatedAt: new Date().toISOString(),
      });
      setEditTask(null);
      
      if (editKategori === 'Non Setting') {
        toast.success('Order diupdate ke Non Setting — kembali ke Input Progress');
      } else if (isFinal) {
        toast.success('Order diupdate ke status final — pindah ke Status Final');
      } else {
        toast.success('Order berhasil diupdate!');
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengupdate order');
    } finally {
      setSaving(false);
    }
  };

  const solverGroups = useMemo(() => ({
    ish: SOLVER_LIST.filter(s => s.startsWith('HD ISH')),
    reg: SOLVER_LIST.filter(s => s.startsWith('HD REGULER')),
  }), []);

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
            placeholder="Cari workorder, SC Order, customer, solver..."
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
                <div className="space-y-4">
                  {expectedAreas.map(area => {
                    const areaTasks = groupedByArea[area] || [];

                    return (
                      <Card key={area} className="overflow-hidden border-l-4" style={{ borderLeftColor: colors.text }}>
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
                            <div className="overflow-auto">
                              <Table>
                                <TableHeader className="bg-slate-50">
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
                                    <TableHead className="w-16">Aksi</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {areaTasks.map((task, i) => (
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
                                          <Badge variant="outline" className={`text-[9px] px-1 py-0 h-5 border ${getStatusBadgeColor(task.statusBima)}`}>
                                            {task.statusBima}
                                          </Badge>
                                        ) : (
                                          <span className="text-xs text-muted-foreground">—</span>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(task)}>
                                          <Edit className="w-4 h-4" />
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
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

      {/* Edit Dialog */}
      <Dialog open={!!editTask} onOpenChange={() => setEditTask(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" /> Update Order Area
            </DialogTitle>
          </DialogHeader>
          {editTask && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg text-xs">
                <div><span className="text-muted-foreground">Workorder:</span> <span className="font-mono font-medium">{editTask.workorder}</span></div>
                <div><span className="text-muted-foreground">SC Order:</span> <span className="font-mono font-medium">{editTask.scOrder}</span></div>
                <div><span className="text-muted-foreground">Customer:</span> <span className="font-medium">{editTask.customerName}</span></div>
                <div><span className="text-muted-foreground">Workzone:</span> <span className="font-medium">{editTask.workzone}</span></div>
              </div>

              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select value={editKategori} onValueChange={v => setEditKategori(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Setting">Setting</SelectItem>
                    <SelectItem value="Non Setting">Non Setting</SelectItem>
                  </SelectContent>
                </Select>
                {editKategori === 'Non Setting' && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Order akan pindah kembali ke Input Progress di segmen masing-masing
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Solver</Label>
                <Select value={editSolver} onValueChange={setEditSolver}>
                  <SelectTrigger>
                    <Users className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Pilih solver..." />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-1 text-xs font-bold text-muted-foreground">HD ISH</div>
                    {solverGroups.ish.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    <div className="px-2 py-1 text-xs font-bold text-muted-foreground mt-1">HD REGULER</div>
                    {solverGroups.reg.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Kendala</Label>
                <Input value={editKendala} onChange={e => setEditKendala(e.target.value)} placeholder="Masukkan kendala" />
              </div>

              <div className="space-y-2">
                <Label>Eskalasi</Label>
                <Select value={editEskalasi} onValueChange={setEditEskalasi}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih eskalasi..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ESKALASI_OPTIONS.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status BIMA</Label>
                <Select value={editStatusBima} onValueChange={v => setEditStatusBima(v as StatusBima)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status..." />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_BIMA_OPTIONS.map(s => (
                      <SelectItem key={s} value={s}>{s} - {getStatusLabel(s)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editStatusBima && FINAL_STATUSES.includes(editStatusBima as StatusBima) && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Status final — order akan pindah ke Status Final
                  </p>
                )}
              </div>

              <Button className="w-full" onClick={handleSaveEdit} disabled={saving}>
                {saving
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</>
                  : <><CheckCircle className="w-4 h-4 mr-2" />Simpan Perubahan</>
                }
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
