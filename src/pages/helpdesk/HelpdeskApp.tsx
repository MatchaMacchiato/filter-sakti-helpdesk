import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, orderBy, query, getDocs, where, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { HelpdeskLayout } from '@/components/helpdesk/HelpdeskLayout';
import { HelpdeskDashboard } from '@/pages/helpdesk/HelpdeskDashboard';
import { HelpdeskAdminPage } from '@/pages/helpdesk/HelpdeskAdminPage';
import { HelpdeskSiswaPage } from '@/pages/helpdesk/HelpdeskSiswaPage';
import { HelpdeskDailyProgressPage } from '@/pages/helpdesk/HelpdeskDailyProgressPage';
import { HelpdeskProgressDashboard } from '@/pages/helpdesk/HelpdeskProgressDashboard';
import { HelpdeskAreaPage } from '@/pages/helpdesk/HelpdeskAreaPage';
import type { AdminData, HelpdeskData, HelpdeskTask } from '@/types/helpdesk';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

export function HelpdeskApp() {
  const { user } = useAuth();
  const [adminData, setAdminData] = useState<AdminData[]>([]);
  const [helpdeskData, setHelpdeskData] = useState<HelpdeskData[]>([]);
  const [tasks, setTasks] = useState<HelpdeskTask[]>([]);

  // Listen to Firestore real-time updates for AdminData
  useEffect(() => {
    const q = query(collection(db, 'adminData'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AdminData[];
      setAdminData(data);
    }, (error) => {
      console.error("Error fetching adminData:", error);
      toast.error("Gagal sinkronisasi data Admin");
    });

    return () => unsubscribe();
  }, []);

  // Listen to Firestore real-time updates for HelpdeskData
  useEffect(() => {
    const q = query(collection(db, 'pklData'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as HelpdeskData[];
      setHelpdeskData(data);
    }, (error) => {
      console.error("Error fetching helpdeskData:", error);
      toast.error("Gagal sinkronisasi data Helpdesk");
    });

    return () => unsubscribe();
  }, []);

  // Listen to Firestore real-time updates for HelpdeskTasks
  useEffect(() => {
    const q = query(collection(db, 'helpdeskTasks'), orderBy('importedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as HelpdeskTask[];
      setTasks(data);
    }, (error) => {
      console.error("Error fetching tasks:", error);
      toast.error("Gagal sinkronisasi data Task");
    });

    return () => unsubscribe();
  }, []);

  // Handler untuk Admin
  const handleAddAdminData = async (newData: Omit<AdminData, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    try {
      await addDoc(collection(db, 'adminData'), {
        ...newData,
        createdAt: now,
        updatedAt: now,
      });
      toast.success('Data master berhasil ditambahkan!');
    } catch (error) {
      console.error(error);
      toast.error('Gagal menambah data master');
    }
  };

  const handleDeleteAdminData = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'adminData', id));
      toast.success('Data master berhasil dihapus!');
    } catch (error) {
      console.error(error);
      toast.error('Gagal menghapus data master');
    }
  };

  // Handler untuk Helpdesk
  const handleAddHelpdesk = async (newData: Omit<HelpdeskData, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    try {
      await addDoc(collection(db, 'pklData'), {
        ...newData,
        createdAt: now,
        updatedAt: now,
      });
      toast.success('Progress Helpdesk berhasil ditambahkan!');
    } catch (error) {
      console.error(error);
      toast.error('Gagal menambah progress Helpdesk');
    }
  };

  const handleDeleteHelpdesk = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'pklData', id));
      toast.success('Progress Helpdesk berhasil dihapus!');
    } catch (error) {
      console.error(error);
      toast.error('Gagal menghapus progress Helpdesk');
    }
  };

  const handleEditHelpdesk = async (updatedData: HelpdeskData) => {
    try {
      const { id, ...dataToUpdate } = updatedData;
      await updateDoc(doc(db, 'pklData', id), {
        ...dataToUpdate,
        updatedAt: new Date().toISOString()
      });
      toast.success('Progress Helpdesk berhasil diupdate!');
    } catch (error) {
      console.error(error);
      toast.error('Gagal mengupdate progress Helpdesk');
    }
  };

  // Handler untuk Import Tasks dari Filter Sakti
  const handleImportTasks = async (items: Omit<HelpdeskTask, 'id'>[]) => {
    try {
      const batch = writeBatch(db);
      items.forEach(item => {
        const ref = doc(collection(db, 'helpdeskTasks'));
        batch.set(ref, {
          ...item,
          importedBy: user?.email || user?.displayName || 'unknown',
        });
      });
      await batch.commit();
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  // Handler untuk Update Task
  const handleUpdateTask = async (task: HelpdeskTask) => {
    try {
      const { id, ...dataToUpdate } = task;
      await updateDoc(doc(db, 'helpdeskTasks', id), {
        ...dataToUpdate,
        updatedBy: user?.email || user?.displayName || 'unknown',
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  // Handler untuk Delete Batch
  const handleDeleteBatch = async (batchId: string) => {
    try {
      const q = query(collection(db, 'helpdeskTasks'), where('batchId', '==', batchId));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      toast.success(`Batch berhasil dihapus (${snapshot.size} task)`);
    } catch (error) {
      console.error(error);
      toast.error('Gagal menghapus batch');
    }
  };

  return (
    <>
      <HelpdeskLayout>
        <Routes>
          <Route path="/" element={<HelpdeskDashboard adminData={adminData} helpdeskData={helpdeskData} tasks={tasks} />} />
          <Route 
            path="/admin" 
            element={
              <HelpdeskAdminPage 
                adminData={adminData}
                onAddAdminData={handleAddAdminData}
                onDeleteAdminData={handleDeleteAdminData}
              />
            } 
          />
          <Route 
            path="/input" 
            element={
              <HelpdeskSiswaPage 
                adminData={adminData}
                helpdeskData={helpdeskData}
                onAddHelpdesk={handleAddHelpdesk}
                onDeleteHelpdesk={handleDeleteHelpdesk}
                onEditHelpdesk={handleEditHelpdesk}
                tasks={tasks}
                onImportTasks={handleImportTasks}
                onUpdateTask={handleUpdateTask}
              />
            } 
          />
          <Route 
            path="/daily" 
            element={
              <HelpdeskDailyProgressPage 
                adminData={adminData}
                helpdeskData={helpdeskData}
                tasks={tasks}
              />
            } 
          />
          <Route 
            path="/progress-dashboard" 
            element={
              <HelpdeskProgressDashboard 
                progressData={tasks}
                onDeleteBatch={handleDeleteBatch}
              />
            } 
          />
          <Route 
            path="/area" 
            element={
              <HelpdeskAreaPage 
                tasks={tasks}
              />
            } 
          />
          <Route path="*" element={<Navigate to="/helpdesk" replace />} />
        </Routes>
      </HelpdeskLayout>
      <Toaster position="top-right" />
    </>
  );
}
