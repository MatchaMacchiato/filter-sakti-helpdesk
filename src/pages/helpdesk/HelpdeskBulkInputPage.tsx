import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Send, CheckCircle, AlertTriangle, Trash2, Package,
  MapPin, Users, Loader2, FileSpreadsheet, Info
} from 'lucide-react';
import { toast } from 'sonner';
import type { Segment, HelpdeskProgressData } from '@/types/helpdesk';
import { SOLVER_LIST, SEGMENT_LIST, SEGMENT_LABELS, SEGMENT_COLORS } from '@/types/helpdesk';

interface HelpdeskBulkInputPageProps {
  onBulkAdd: (items: Omit<HelpdeskProgressData, 'id'>[]) => Promise<void>;
}

// Column mapping from Filter Sakti output
const COL_MAP: Record<string, string> = {
  'Date Created': 'dateCreated',
  'Workorder': 'workorder',
  'SC Order No/Track ID/CSRM No': 'scOrder',
  'Service No.': 'serviceNo',
  'CRM Order Type': 'crmOrderType',
  'Status': 'status',
  'Address': 'address',
  'Customer Name': 'customerName',
  'Workzone': 'workzone',
  'Booking Date': 'bookingDate',
  'Contact Number': 'contactNumber',
  'Mitra': 'mitra',
};

const DISPLAY_COLS = ['workorder', 'scOrder', 'serviceNo', 'status', 'customerName', 'workzone'];
const DISPLAY_LABELS: Record<string, string> = {
  workorder: 'Workorder',
  scOrder: 'SC Order',
  serviceNo: 'Service No',
  status: 'Status',
  customerName: 'Customer',
  workzone: 'Workzone',
};

export function HelpdeskBulkInputPage({ onBulkAdd }: HelpdeskBulkInputPageProps) {
  const [importedData, setImportedData] = useState<Record<string, unknown>[]>([]);
  const [filterMode, setFilterMode] = useState<string>('');
  const [solver, setSolver] = useState<string>('');
  const [selectedSegment, setSelectedSegment] = useState<Segment | ''>('');
  const [sending, setSending] = useState<Segment | null>(null);
  const [sentSegments, setSentSegments] = useState<Set<Segment>>(new Set());

  // Load data from localStorage on mount
  useEffect(() => {
    const raw = localStorage.getItem('filterSaktiExport');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setImportedData(parsed.data || []);
        setFilterMode(parsed.mode || 'WSA');
      } catch {
        toast.error('Data dari Filter Sakti tidak valid');
      }
    }
  }, []);

  // Map raw rows to structured data
  const mappedData = useMemo(() => {
    return importedData.map(row => {
      const mapped: Record<string, string> = {};
      Object.entries(COL_MAP).forEach(([filterCol, targetCol]) => {
        const val = row[filterCol];
        mapped[targetCol] = val !== null && val !== undefined ? String(val) : '';
      });
      return mapped;
    });
  }, [importedData]);

  const handleClearData = () => {
    localStorage.removeItem('filterSaktiExport');
    setImportedData([]);
    setFilterMode('');
    setSentSegments(new Set());
    toast.info('Data berhasil dihapus');
  };

  const handleSendSegment = async (segment: Segment) => {
    if (!solver) {
      toast.error('Pilih nama Solver/Helpdesk terlebih dahulu!');
      return;
    }
    if (mappedData.length === 0) {
      toast.error('Tidak ada data untuk dikirim!');
      return;
    }

    setSending(segment);
    const batchId = `${segment}-${Date.now()}`;
    const now = new Date().toISOString();

    try {
      const items: Omit<HelpdeskProgressData, 'id'>[] = mappedData.map(row => ({
        dateCreated: row.dateCreated || '',
        workorder: row.workorder || '',
        scOrder: row.scOrder || '',
        serviceNo: row.serviceNo || '',
        crmOrderType: row.crmOrderType || '',
        status: row.status || '',
        address: row.address || '',
        customerName: row.customerName || '',
        workzone: row.workzone || '',
        bookingDate: row.bookingDate || '',
        contactNumber: row.contactNumber || '',
        mitra: row.mitra || '',
        segment,
        solver,
        inputBy: '', // Will be filled by HelpdeskApp
        filterMode,
        batchId,
        createdAt: now,
      }));

      await onBulkAdd(items);
      setSentSegments(prev => new Set(prev).add(segment));
      toast.success(`${mappedData.length} data berhasil dikirim ke segmen ${SEGMENT_LABELS[segment]}!`);
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengirim data');
    } finally {
      setSending(null);
    }
  };

  const solverGroups = useMemo(() => {
    const ish = SOLVER_LIST.filter(s => s.startsWith('HD ISH'));
    const reg = SOLVER_LIST.filter(s => s.startsWith('HD REGULER'));
    return { ish, reg };
  }, []);

  if (importedData.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Package className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Bulk Input Progress</h1>
        </div>
        <Card>
          <CardContent className="py-16 text-center">
            <FileSpreadsheet className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Belum Ada Data</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
              Proses data di <strong>Filter Sakti</strong> terlebih dahulu, lalu klik tombol 
              <strong> "Kirim ke Helpdesk Tracker"</strong> untuk mengirim data ke halaman ini.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Info className="w-4 h-4" />
              Data akan otomatis muncul setelah dikirim dari Filter Sakti
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Package className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Bulk Input Progress</h1>
            <p className="text-sm text-muted-foreground">
              {mappedData.length} data dari Filter Sakti · Mode: <Badge variant="outline">{filterMode}</Badge>
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleClearData}>
          <Trash2 className="w-4 h-4 mr-2" /> Hapus Data Import
        </Button>
      </div>

      {/* Solver Selection */}
      <Card className="border-primary/20">
        <CardHeader className="bg-primary/5 pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Pilih Solver / Helpdesk
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <Select value={solver} onValueChange={setSolver}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Pilih nama Solver / Helpdesk..." />
            </SelectTrigger>
            <SelectContent>
              <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground">HD ISH</div>
              {solverGroups.ish.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
              <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground mt-1">HD REGULER</div>
              {solverGroups.reg.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {solver && (
            <p className="text-sm text-muted-foreground mt-2">
              Solver: <span className="font-semibold text-foreground">{solver}</span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Data Preview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Preview Data ({mappedData.length} baris)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto max-h-[350px] rounded-md border">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                <TableRow>
                  <TableHead className="w-12">No</TableHead>
                  {DISPLAY_COLS.map(col => (
                    <TableHead key={col}>{DISPLAY_LABELS[col]}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappedData.slice(0, 100).map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                    {DISPLAY_COLS.map(col => (
                      <TableCell key={col} className="text-xs font-mono max-w-[200px] truncate" title={row[col]}>
                        {row[col] || '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                {mappedData.length > 100 && (
                  <TableRow>
                    <TableCell colSpan={DISPLAY_COLS.length + 1} className="text-center text-muted-foreground py-3">
                      ... dan {mappedData.length - 100} baris lainnya
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Segment Selection & Input */}
      <Card className="border-2 border-dashed border-primary/30">
        <CardHeader className="bg-primary/5 pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Pilih Segmen & Kirim Data
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Pilih segmen tujuan lalu klik tombol "Kirim" untuk mengirim semua {mappedData.length} data ke segmen tersebut.
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Segment Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SEGMENT_LIST.map(seg => {
              const colors = SEGMENT_COLORS[seg];
              const isSent = sentSegments.has(seg);
              const isSending = sending === seg;

              return (
                <div
                  key={seg}
                  className="rounded-xl p-5 border-2 transition-all"
                  style={{
                    borderColor: isSent ? '#BBF7D0' : selectedSegment === seg ? colors.border : '#E5E7EB',
                    backgroundColor: isSent ? '#F0FDF4' : selectedSegment === seg ? colors.bg : '#FAFAFA',
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg" style={{ color: colors.text }}>{seg}</h3>
                      <p className="text-xs text-muted-foreground">{SEGMENT_LABELS[seg]}</p>
                    </div>
                    {isSent && <CheckCircle className="w-6 h-6 text-green-500" />}
                  </div>

                  <div className="text-sm text-muted-foreground mb-4">
                    {mappedData.length} data akan dikirim
                  </div>

                  <Button
                    className="w-full"
                    variant={isSent ? 'outline' : 'default'}
                    disabled={isSending || !solver}
                    onClick={() => {
                      setSelectedSegment(seg);
                      handleSendSegment(seg);
                    }}
                  >
                    {isSending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Mengirim...</>
                    ) : isSent ? (
                      <><CheckCircle className="w-4 h-4 mr-2" />Sudah Terkirim</>
                    ) : (
                      <><Send className="w-4 h-4 mr-2" />Kirim ke {seg}</>
                    )}
                  </Button>

                  {!solver && !isSent && (
                    <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Pilih solver terlebih dahulu
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
