import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { AdminData, HelpdeskTask } from '@/types/helpdesk';
import { FINAL_STATUSES } from '@/types/helpdesk';
import { PlusCircle, Trash2, UserCog, Search, AlertTriangle, DatabaseZap, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, writeBatch } from 'firebase/firestore';

interface HelpdeskAdminPageProps {
  adminData: AdminData[];
  tasks: HelpdeskTask[];
  onAddAdminData: (data: Omit<AdminData, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDeleteAdminData: (id: string) => void;
}

export function HelpdeskAdminPage({ adminData, tasks, onAddAdminData, onDeleteAdminData }: HelpdeskAdminPageProps) {
  const [formData, setFormData] = useState({
    inet: '',
    scOrder: '',
    note: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isPurging, setIsPurging] = useState(false);
  const [activeTab, setActiveTab] = useState('master');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.inet && formData.scOrder) {
      // Cek apakah inet sudah ada
      const exists = adminData.some(item => item.inet.toLowerCase() === formData.inet.toLowerCase());
      if (exists) {
        toast.error('Inet sudah ada dalam database!');
        return;
      }
      onAddAdminData(formData);
      setFormData({ inet: '', scOrder: '', note: '' });
      toast.success('Data berhasil ditambahkan!');
    }
  };

  const filteredData = adminData.filter(item => 
    item.inet.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.scOrder.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.note && item.note.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handlePurgeData = async () => {
    if (!window.confirm('PERINGATAN: Anda yakin ingin menghapus SEMUA data order yang berstatus Final (COMPWORK & CANCLWORK)? Aksi ini tidak dapat dibatalkan.')) return;
    
    setIsPurging(true);
    try {
      const q = query(
        collection(db, 'helpdeskTasks'),
        where('statusBima', 'in', FINAL_STATUSES)
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        toast.info('Tidak ada data Final yang bisa dihapus.');
        setIsPurging(false);
        return;
      }

      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      toast.success(`Berhasil menghapus ${snapshot.size} data Final.`);
    } catch (error) {
      console.error(error);
      toast.error('Gagal menghapus data Final.');
    } finally {
      setIsPurging(false);
    }
  };

  const finalTasksCount = tasks.filter(t => FINAL_STATUSES.includes(t.statusBima as any)).length;
  const pendingTasksCount = tasks.length - finalTasksCount;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <UserCog className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold">Admin Command Center</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="master">Data Master</TabsTrigger>
          <TabsTrigger value="system">Sistem & Pembersihan</TabsTrigger>
        </TabsList>

        <TabsContent value="master" className="space-y-6 mt-6">
          <Card className="w-full border-primary/20">
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-lg flex items-center gap-2">
                <PlusCircle className="w-5 h-5" />
                Input Data Inet & SC ORDER
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="inet">Inet</Label>
                    <Input
                      id="inet"
                      placeholder="Masukkan Inet"
                      value={formData.inet}
                      onChange={(e) => setFormData({ ...formData, inet: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="scOrder">SC ORDER</Label>
                    <Input
                      id="scOrder"
                      placeholder="Masukkan SC ORDER"
                      value={formData.scOrder}
                      onChange={(e) => setFormData({ ...formData, scOrder: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="note">Catatan (Opsional)</Label>
                    <Input
                      id="note"
                      placeholder="Masukkan catatan khusus untuk Inet ini..."
                      value={formData.note}
                      onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    />
                  </div>
                </div>
                
                <Button type="submit" className="w-full">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Simpan Data Master
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Cari data (inet, SC ORDER...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Daftar Data Master (Inet & SC ORDER)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto max-h-[420px] rounded-md border">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                    <TableRow>
                      <TableHead>No</TableHead>
                      <TableHead>Inet</TableHead>
                      <TableHead>SC ORDER</TableHead>
                      <TableHead>Catatan</TableHead>
                      <TableHead>Tanggal Input</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Belum ada data master
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredData.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">{item.inet}</TableCell>
                          <TableCell>{item.scOrder}</TableCell>
                          <TableCell className="text-muted-foreground">{item.note || '-'}</TableCell>
                          <TableCell>{new Date(item.createdAt).toLocaleDateString('id-ID')}</TableCell>
                          <TableCell>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => onDeleteAdminData(item.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Task Sistem</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tasks.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Semua task yang ada di database.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Task Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{pendingTasksCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Sedang / Belum dikerjakan.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Task Final</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{finalTasksCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Sudah COMPWORK/CANCLWORK.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-red-200">
            <CardHeader className="bg-red-50/50">
              <CardTitle className="text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Zona Berbahaya (Danger Zone)
              </CardTitle>
              <CardDescription>
                Aksi di bawah ini bersifat permanen dan tidak dapat dibatalkan.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 border rounded-lg bg-white">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-red-100 text-red-600 rounded-full">
                    <DatabaseZap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Purge Data Final (Pembersihan Penyimpanan)</h3>
                    <p className="text-sm text-gray-500 mt-1 max-w-xl">
                      Hapus semua task yang sudah memiliki status BIMA `COMPWORK` atau `CANCLWORK`. 
                      Gunakan fitur ini di akhir bulan atau ketika sistem terasa lambat untuk membersihkan database dari data lama yang sudah selesai.
                    </p>
                  </div>
                </div>
                <Button 
                  variant="destructive" 
                  onClick={handlePurgeData}
                  disabled={isPurging || finalTasksCount === 0}
                  className="whitespace-nowrap"
                >
                  {isPurging ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menghapus...</>
                  ) : (
                    <><Trash2 className="w-4 h-4 mr-2" /> Hapus {finalTasksCount} Data Final</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
