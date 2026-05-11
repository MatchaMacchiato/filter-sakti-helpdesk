import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Send, CheckCircle, Package, MapPin, Users, Loader2, FileSpreadsheet,
  Search, Edit, AlertTriangle, Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import type { HelpdeskTask, Segment, StatusBima } from '@/types/helpdesk';
import {
  SOLVER_LIST, SEGMENT_LIST, SEGMENT_COLORS,
  STATUS_BIMA_OPTIONS, getStatusLabel
} from '@/types/helpdesk';

interface FilterTaskViewProps {
  tasks: HelpdeskTask[];
  onImportTasks: (tasks: Omit<HelpdeskTask, 'id'>[]) => Promise<void>;
  onUpdateTask: (task: HelpdeskTask) => Promise<void>;
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

export function FilterTaskView({ tasks, onImportTasks, onUpdateTask }: FilterTaskViewProps) {
  const [hasImportData, setHasImportData] = useState(false);
  const [importCount, setImportCount] = useState(0);
  const [importSegment, setImportSegment] = useState<Segment | ''>('');
  const [importMode, setImportMode] = useState('');
  const [importing, setImporting] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [filterSegment, setFilterSegment] = useState<Segment | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');

  // Edit dialog
  const [editTask, setEditTask] = useState<HelpdeskTask | null>(null);
  const [editSolver, setEditSolver] = useState('');
  const [editTiket, setEditTiket] = useState('');
  const [editFallout, setEditFallout] = useState('');
  const [editWonum, setEditWonum] = useState('');
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

      const items: Omit<HelpdeskTask, 'id'>[] = (parsed.data || []).map((row: Record<string, unknown>) => {
        const mapped: Record<string, string> = {};
        Object.entries(COL_MAP).forEach(([filterCol, targetCol]) => {
          const val = row[filterCol];
          mapped[targetCol] = val !== null && val !== undefined ? String(val) : '';
        });
        return {
          dateCreated: mapped.dateCreated || '',
          workorder: mapped.workorder || '',
          scOrder: mapped.scOrder || '',
          serviceNo: mapped.serviceNo || '',
          crmOrderType: mapped.crmOrderType || '',
          filterStatus: mapped.filterStatus || '',
          address: mapped.address || '',
          customerName: mapped.customerName || '',
          workzone: mapped.workzone || '',
          bookingDate: mapped.bookingDate || '',
          contactNumber: mapped.contactNumber || '',
          mitra: mapped.mitra || '',
          segment: importSegment as Segment,
          filterMode: parsed.mode || 'WSA',
          batchId,
          importedBy: '', // filled by HelpdeskApp
          importedAt: now,
          solver: '',
          tiket: '',
          fallout: '',
          wonum: '',
          statusBima: '' as const,
          taskStatus: 'pending' as const,
          updatedBy: '',
          updatedAt: '',
        };
      });

      await onImportTasks(items);
      localStorage.removeItem('filterSaktiExport');
      setHasImportData(false);
      toast.success(`${items.length} task berhasil diimport ke segmen ${importSegment}!`);
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
    setEditTiket(task.tiket);
    setEditFallout(task.fallout);
    setEditWonum(task.wonum);
    setEditStatusBima(task.statusBima);
  };

  const handleSaveTask = async () => {
    if (!editTask) return;
    if (!editSolver) {
      toast.error('Pilih nama solver terlebih dahulu!');
      return;
    }
    setSaving(true);
    try {
      await onUpdateTask({
        ...editTask,
        solver: editSolver,
        tiket: editTiket,
        fallout: editFallout,
        wonum: editWonum,
        statusBima: editStatusBima,
        taskStatus: editStatusBima ? 'completed' : 'pending',
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

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (filterSegment !== 'all' && t.segment !== filterSegment) return false;
      if (filterStatus !== 'all' && t.taskStatus !== filterStatus) return false;
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
  }, [tasks, filterSegment, filterStatus, search]);

  // Stats
  const stats = useMemo(() => ({
    total: tasks.length,
    pending: tasks.filter(t => t.taskStatus === 'pending').length,
    completed: tasks.filter(t => t.taskStatus === 'completed').length,
  }), [tasks]);

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
        <Card>
          <CardContent className="py-3 px-4 flex items-center gap-3">
            <Package className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Total Task</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <div>
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-xl font-bold">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="text-xl font-bold">{stats.completed}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input placeholder="Cari workorder, customer, solver..." value={search}
            onChange={e => setSearch(e.target.value)} className="pl-10 h-9" />
        </div>
        <Select value={filterSegment} onValueChange={v => setFilterSegment(v as Segment | 'all')}>
          <SelectTrigger className="w-[130px] h-9">
            <MapPin className="w-3 h-3 mr-1" /><SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            {SEGMENT_LIST.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={v => setFilterStatus(v as 'all' | 'pending' | 'completed')}>
          <SelectTrigger className="w-[130px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task Table */}
      {filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="font-semibold mb-1">Belum Ada Task</p>
            <p className="text-sm text-muted-foreground">
              Kirim data dari Filter Sakti untuk membuat task baru.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              {filteredTasks.length} Task
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto max-h-[400px] rounded-md border">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="w-10">No</TableHead>
                    <TableHead>Segmen</TableHead>
                    <TableHead>Workorder</TableHead>
                    <TableHead>SC Order</TableHead>
                    <TableHead>Service No</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Solver</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-16">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.slice(0, 200).map((task, i) => {
                    const segColor = SEGMENT_COLORS[task.segment];
                    return (
                      <TableRow key={task.id} className={task.taskStatus === 'completed' ? 'bg-green-50/50' : ''}>
                        <TableCell className="text-muted-foreground text-xs">{i + 1}</TableCell>
                        <TableCell>
                          <Badge className="text-[10px]" style={{
                            backgroundColor: segColor.bg, color: segColor.text,
                            border: `1px solid ${segColor.border}`,
                          }}>{task.segment}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{task.workorder}</TableCell>
                        <TableCell className="font-mono text-xs">{task.scOrder}</TableCell>
                        <TableCell className="font-mono text-xs">{task.serviceNo}</TableCell>
                        <TableCell className="text-xs max-w-[120px] truncate">{task.customerName}</TableCell>
                        <TableCell className="text-xs">
                          {task.solver
                            ? <span className="font-medium">{task.solver.replace('HD ISH - ', '').replace('HD REGULER - ', '')}</span>
                            : <span className="text-muted-foreground italic">—</span>
                          }
                        </TableCell>
                        <TableCell>
                          {task.taskStatus === 'completed'
                            ? <Badge className="bg-green-100 text-green-700 border-green-300 text-[10px]">
                                <CheckCircle className="w-3 h-3 mr-1" />Done
                              </Badge>
                            : <Badge variant="outline" className="text-amber-600 border-amber-300 text-[10px]">
                                Pending
                              </Badge>
                          }
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(task)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

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
                <div className="space-y-2">
                  <Label>Tiket</Label>
                  <Input value={editTiket} onChange={e => setEditTiket(e.target.value)} placeholder="Nomor tiket" />
                </div>
                <div className="space-y-2">
                  <Label>Fallout</Label>
                  <Input value={editFallout} onChange={e => setEditFallout(e.target.value)} placeholder="Fallout" />
                </div>
                <div className="space-y-2">
                  <Label>WONUM</Label>
                  <Input value={editWonum} onChange={e => setEditWonum(e.target.value)} placeholder="WONUM" />
                </div>
                <div className="space-y-2">
                  <Label>Status BIMA</Label>
                  <Select value={editStatusBima} onValueChange={v => setEditStatusBima(v as StatusBima)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih status..." />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_BIMA_OPTIONS.map(s => (
                        <SelectItem key={s} value={s}>{getStatusLabel(s)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button className="w-full" onClick={handleSaveTask} disabled={saving}>
                {saving
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</>
                  : <><CheckCircle className="w-4 h-4 mr-2" />Simpan & Update Task</>
                }
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
