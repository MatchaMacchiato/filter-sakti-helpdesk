import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Send, CheckCircle, Package, MapPin, Users, Loader2, FileSpreadsheet,
  Search, Edit, AlertTriangle, Trash2, RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import type { HelpdeskTask, Segment, StatusBima } from '@/types/helpdesk';
import {
  SOLVER_LIST, SEGMENT_LIST, SEGMENT_COLORS,
  STATUS_BIMA_OPTIONS, getStatusLabel, ESKALASI_OPTIONS, FINAL_STATUSES
} from '@/types/helpdesk';
import { useAuth } from '@/contexts/AuthContext';

interface FilterTaskViewProps {
  tasks: HelpdeskTask[];
  onImportTasks: (tasks: Omit<HelpdeskTask, 'id'>[]) => Promise<void>;
  onUpdateTask: (task: HelpdeskTask) => Promise<void>;
  onDeleteTask?: (id: string) => Promise<void>;
}

const COL_MAP: Record<string, string> = {
  'Date Created': 'dateCreated',
  'Workorder': 'workorder',
  'SC Order No/Track ID/CSRM No': 'scOrder',
  'Service No.': 'serviceNo',
  'CRM Order Type': 'crmOrderType',
  'Status': 'filterStatus',
  'Address': 'address',
  'Customer Name': 'customerName',
  'Workzone': 'workzone',
  'Booking Date': 'bookingDate',
  'Contact Number': 'contactNumber',
  'Mitra': 'mitra',
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'STARWORK': return 'bg-cyan-500 hover:bg-cyan-600';
    case 'COMPWORK': return 'bg-green-500 hover:bg-green-600';
    case 'WAPPR': return 'bg-yellow-500 hover:bg-yellow-600';
    case 'INSTCOMP': return 'bg-blue-500 hover:bg-blue-600';
    case 'ACTCOMP': return 'bg-purple-500 hover:bg-purple-600';
    case 'CANCLWORK': return 'bg-red-500 hover:bg-red-600';
    case 'WORKFAIL': return 'bg-gray-700 hover:bg-gray-800';
    default: return 'bg-gray-400 hover:bg-gray-500';
  }
};

export function FilterTaskView({ tasks, onImportTasks, onUpdateTask, onDeleteTask }: FilterTaskViewProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [hasImportData, setHasImportData] = useState(false);
  const [importCount, setImportCount] = useState(0);
  const [importSegment, setImportSegment] = useState<Segment | ''>('');
  const [importMode, setImportMode] = useState('');
  const [importing, setImporting] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [activeSegmentTab, setActiveSegmentTab] = useState<Segment>('JAKTIM');

  // Edit dialog
  const [editTask, setEditTask] = useState<HelpdeskTask | null>(null);
  const [editSolver, setEditSolver] = useState('');
  const [editKendala, setEditKendala] = useState('');
  const [editKategori, setEditKategori] = useState<'Setting' | 'Non Setting' | ''>('');
  const [editEskalasi, setEditEskalasi] = useState('');
  const [editStatusBima, setEditStatusBima] = useState<StatusBima | ''>('');
  const [saving, setSaving] = useState(false);

  // Check localStorage for import data
  useEffect(() => {
    const raw = localStorage.getItem('filterSaktiExport');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.data && parsed.data.length > 0) {
          setHasImportData(true);
          setImportCount(parsed.data.length);
          setImportSegment(parsed.segment || '');
          setImportMode(parsed.mode || 'WSA');
        }
      } catch { /* ignore */ }
    }
  }, []);

  const handleImport = async () => {
    if (!importSegment) {
      toast.error('Segmen tidak ditemukan!');
      return;
    }
    const raw = localStorage.getItem('filterSaktiExport');
    if (!raw) return;

    setImporting(true);
    try {
      const parsed = JSON.parse(raw);
      const now = new Date().toISOString();
      const batchId = `${importSegment}-${Date.now()}`;

      // Get existing workorders and scOrders for duplicate check
      const existingWorkorders = new Set(tasks.map(t => t.workorder.toLowerCase()));
      const existingScOrders = new Set(tasks.map(t => t.scOrder.toLowerCase()));

      const mapFilterStatus = (status: string): StatusBima => {
        const s = status.toUpperCase();
        if (s.includes('COMPWORK')) return 'COMPWORK';
        if (s.includes('CANCLWORK')) return 'CANCLWORK';
        if (s.includes('WAPPR')) return 'WAPPR';
        if (s.includes('INSTCOMP')) return 'INSTCOMP';
        if (s.includes('ACTCOMP')) return 'ACTCOMP';
        if (s.includes('WORKFAIL')) return 'WORKFAIL';
        return 'STARWORK';
      };

      const allItems: Omit<HelpdeskTask, 'id'>[] = (parsed.data || []).map((row: Record<string, unknown>) => {
        const mapped: Record<string, string> = {};
        Object.entries(COL_MAP).forEach(([filterCol, targetCol]) => {
          const val = row[filterCol];
          mapped[targetCol] = val !== null && val !== undefined ? String(val) : '';
        });
        const fs = mapped.filterStatus || '';
        return {
          dateCreated: mapped.dateCreated || '',
          workorder: mapped.workorder || '',
          scOrder: mapped.scOrder || '',
          serviceNo: mapped.serviceNo || '',
          crmOrderType: mapped.crmOrderType || '',
          filterStatus: fs,
          address: mapped.address || '',
          customerName: mapped.customerName || '',
          workzone: mapped.workzone || '',
          bookingDate: mapped.bookingDate || '',
          contactNumber: mapped.contactNumber || '',
          mitra: mapped.mitra || '',
          segment: importSegment as Segment,
          filterMode: parsed.mode || 'WSA',
          batchId,
          importedBy: '',
          importedAt: now,
          solver: '',
          kendala: '',
          kategori: '' as const,
          eskalasi: '',
          statusBima: mapFilterStatus(fs),
          taskStatus: 'pending' as const,
          updatedBy: '',
          updatedAt: '',
        };
      });

      // Filter out duplicates
      const items = allItems.filter(item => {
        const woDup = item.workorder && existingWorkorders.has(item.workorder.toLowerCase());
        const scDup = item.scOrder && existingScOrders.has(item.scOrder.toLowerCase());
        return !woDup && !scDup;
      });

      const skipped = allItems.length - items.length;

      if (items.length === 0) {
        toast.warning(`Semua ${allItems.length} data sudah ada (duplikat). Tidak ada yang diimport.`);
        localStorage.removeItem('filterSaktiExport');
        setHasImportData(false);
        return;
      }

      await onImportTasks(items);
      localStorage.removeItem('filterSaktiExport');
      setHasImportData(false);
      
      if (skipped > 0) {
        toast.success(`${items.length} task diimport, ${skipped} data duplikat dilewati.`);
      } else {
        toast.success(`${items.length} task berhasil diimport ke segmen ${importSegment}!`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengimport data');
    } finally {
      setImporting(false);
    }
  };

  const openEditDialog = (task: HelpdeskTask) => {
    setEditTask(task);
    setEditSolver(task.solver);
    setEditKendala(task.kendala || '');
    setEditKategori(task.kategori || '');
    setEditEskalasi(task.eskalasi || '');
    setEditStatusBima(task.statusBima);
  };

  const handleClearAction = async () => {
    if (!editTask) return;
    setSaving(true);
    try {
      await onUpdateTask({
        ...editTask,
        solver: '',
        kendala: '',
        kategori: '',
        eskalasi: '',
        statusBima: '',
        taskStatus: 'pending',
        updatedAt: new Date().toISOString(),
      });
      setEditTask(null);
      toast.success('Aksi berhasil dikosongkan. Task kembali ke status awal.');
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengosongkan aksi');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTask = async () => {
    if (!editTask) return;
    if (!editSolver) {
      toast.error('Pilih nama solver terlebih dahulu!');
      return;
    }
    setSaving(true);
    try {
      const isFinal = FINAL_STATUSES.includes(editStatusBima as StatusBima);
      await onUpdateTask({
        ...editTask,
        solver: editSolver,
        kendala: editKendala,
        kategori: editKategori,
        eskalasi: editEskalasi,
        statusBima: editStatusBima,
        taskStatus: isFinal ? 'completed' : 'pending',
        updatedAt: new Date().toISOString(),
      });
      setEditTask(null);
      toast.success('Task berhasil diupdate!');
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengupdate task');
    } finally {
      setSaving(false);
    }
  };

  // Filter out final status tasks — they go to Status Final page
  const activeTasks = useMemo(() => {
    return tasks.filter(t => !FINAL_STATUSES.includes(t.statusBima as StatusBima));
  }, [tasks]);

  // Filter tasks by segment and search
  const getSegmentTasks = (segment: Segment) => {
    return activeTasks.filter(t => {
      if (t.segment !== segment) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          t.workorder.toLowerCase().includes(s) ||
          t.scOrder.toLowerCase().includes(s) ||
          t.serviceNo.toLowerCase().includes(s) ||
          t.customerName.toLowerCase().includes(s) ||
          t.solver.toLowerCase().includes(s)
        );
      }
      return true;
    });
  };

  // Stats per segment
  const segmentStats = useMemo(() => {
    const stats: Record<Segment, { total: number; withStatus: number; noStatus: number }> = {
      JAKTIM: { total: 0, withStatus: 0, noStatus: 0 },
      JAKSEL: { total: 0, withStatus: 0, noStatus: 0 },
      JAKPUS: { total: 0, withStatus: 0, noStatus: 0 },
    };
    activeTasks.forEach(t => {
      stats[t.segment].total++;
      if (t.statusBima) stats[t.segment].withStatus++;
      else stats[t.segment].noStatus++;
    });
    return stats;
  }, [activeTasks]);

  const solverGroups = useMemo(() => ({
    ish: SOLVER_LIST.filter(s => s.startsWith('HD ISH')),
    reg: SOLVER_LIST.filter(s => s.startsWith('HD REGULER')),
  }), []);

  return (
    <div className="space-y-4">
      {/* Import Banner */}
      {hasImportData && (
        <Card className="border-2 border-blue-200 bg-blue-50/50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-semibold text-sm">
                    {importCount} data dari Filter Sakti siap diimport
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Mode: {importMode} · Segmen: <Badge variant="outline" className="ml-1">{importSegment}</Badge>
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleImport} disabled={importing}>
                  {importing
                    ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Mengimport...</>
                    : <><Send className="w-4 h-4 mr-1" />Import Sekarang</>
                  }
                </Button>
                <Button size="sm" variant="ghost" onClick={() => {
                  localStorage.removeItem('filterSaktiExport');
                  setHasImportData(false);
                }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {SEGMENT_LIST.map(seg => {
          const s = segmentStats[seg];
          const colors = SEGMENT_COLORS[seg];
          return (
            <Card key={seg} style={{ borderLeft: `4px solid ${colors.text}` }}>
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-4 h-4" style={{ color: colors.text }} />
                  <span className="font-bold text-sm">{seg}</span>
                </div>
                <div className="flex gap-3 text-xs">
                  <span>Total: <strong>{s.total}</strong></span>
                  <span className="text-green-600">Aktif: <strong>{s.withStatus}</strong></span>
                  <span className="text-muted-foreground">Belum: <strong>{s.noStatus}</strong></span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input placeholder="Cari workorder, customer, solver..." value={search}
          onChange={e => setSearch(e.target.value)} className="pl-10 h-9" />
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
                    <Package className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="font-semibold mb-1">Belum Ada Task di {segment}</p>
                    <p className="text-sm text-muted-foreground">
                      Kirim data dari Filter Sakti untuk membuat task baru.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <span style={{ color: colors.text }}>{segment}</span>
                      — {segTasks.length} Task
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
                            <TableHead>Status BIMA</TableHead>
                            <TableHead className="w-16">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {segTasks.slice(0, 300).map((task, i) => (
                            <TableRow key={task.id} className={task.statusBima ? 'bg-blue-50/30' : ''}>
                              <TableCell className="text-muted-foreground text-xs">{i + 1}</TableCell>
                              <TableCell className="font-mono text-xs">{task.workorder}</TableCell>
                              <TableCell className="font-mono text-xs">{task.scOrder}</TableCell>
                              <TableCell className="font-mono text-xs">{task.serviceNo}</TableCell>
                              <TableCell className="text-xs">{task.crmOrderType}</TableCell>
                              <TableCell className="text-xs">{task.filterStatus}</TableCell>
                              <TableCell className="text-xs max-w-[120px] truncate">{task.customerName}</TableCell>
                              <TableCell className="text-xs">{task.workzone}</TableCell>
                              <TableCell className="text-xs">
                                {task.solver
                                  ? <span className="font-medium">{task.solver.replace('HD ISH - ', '').replace('HD REGULER - ', '')}</span>
                                  : <span className="text-muted-foreground italic">—</span>
                                }
                              </TableCell>
                              <TableCell>
                                {task.statusBima
                                  ? <Badge className={`text-[10px] ${getStatusColor(task.statusBima)}`}>
                                      {task.statusBima}
                                    </Badge>
                                  : <span className="text-muted-foreground text-xs italic">—</span>
                                }
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(task)}>
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  {isAdmin && onDeleteTask && (
                                    <Button variant="ghost" size="sm" onClick={() => onDeleteTask(task.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
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

      {/* Edit Task Dialog */}
      <Dialog open={!!editTask} onOpenChange={() => setEditTask(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" /> Update Task
            </DialogTitle>
          </DialogHeader>
          {editTask && (
            <div className="space-y-4">
              {/* Task Info (read-only) */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg text-xs">
                <div><span className="text-muted-foreground">Workorder:</span> <span className="font-mono font-medium">{editTask.workorder}</span></div>
                <div><span className="text-muted-foreground">SC Order:</span> <span className="font-mono font-medium">{editTask.scOrder}</span></div>
                <div><span className="text-muted-foreground">Service No:</span> <span className="font-mono font-medium">{editTask.serviceNo}</span></div>
                <div><span className="text-muted-foreground">Customer:</span> <span className="font-medium">{editTask.customerName}</span></div>
                <div><span className="text-muted-foreground">Segmen:</span> <Badge variant="outline" className="ml-1">{editTask.segment}</Badge></div>
                <div><span className="text-muted-foreground">Status Filter:</span> <span className="font-medium">{editTask.filterStatus}</span></div>
              </div>

              {/* Solver */}
              <div className="space-y-2">
                <Label>Solver / Helpdesk</Label>
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

              {/* Progress Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2 col-span-2">
                  <Label>Kendala</Label>
                  <Input value={editKendala} onChange={e => setEditKendala(e.target.value)} placeholder="Masukkan kendala" />
                </div>
                <div className="space-y-2">
                  <Label>Kategori</Label>
                  <Select value={editKategori} onValueChange={v => setEditKategori(v as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Setting">Setting</SelectItem>
                      <SelectItem value="Non Setting">Non Setting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Eskalasi</Label>
                  <Select value={editEskalasi} onValueChange={v => setEditEskalasi(v)}>
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
                <div className="space-y-2 col-span-2">
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
                      <AlertTriangle className="w-3 h-3" />
                      Status final — task akan pindah ke halaman Status Final
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleSaveTask} disabled={saving}>
                  {saving
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</>
                    : <><CheckCircle className="w-4 h-4 mr-2" />Simpan & Update Task</>
                  }
                </Button>
                <Button variant="outline" onClick={handleClearAction} disabled={saving} className="gap-1 text-orange-600 border-orange-300 hover:bg-orange-50">
                  <RotateCcw className="w-4 h-4" />
                  Kosongkan
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
