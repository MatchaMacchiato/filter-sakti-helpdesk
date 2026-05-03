import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { HelpdeskLayout } from '@/components/helpdesk/HelpdeskLayout';
import { HelpdeskDashboard } from '@/pages/helpdesk/HelpdeskDashboard';
import { HelpdeskAdminPage } from '@/pages/helpdesk/HelpdeskAdminPage';
import { HelpdeskSiswaPage } from '@/pages/helpdesk/HelpdeskSiswaPage';
import { HelpdeskDailyProgressPage } from '@/pages/helpdesk/HelpdeskDailyProgressPage';
import type { AdminData, HelpdeskData } from '@/types/helpdesk';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

export function HelpdeskApp() {
  const [adminData, setAdminData] = useState<AdminData[]>([]);
  const [helpdeskData, setHelpdeskData] = useState<HelpdeskData[]>([]);

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

  return (
    <>
      <HelpdeskLayout>
        <Routes>
          <Route path="/" element={<HelpdeskDashboard adminData={adminData} helpdeskData={helpdeskData} />} />
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
              />
            } 
          />
          <Route 
            path="/daily" 
            element={
              <HelpdeskDailyProgressPage 
                adminData={adminData}
                helpdeskData={helpdeskData}
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
