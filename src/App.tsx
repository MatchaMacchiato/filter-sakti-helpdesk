import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import LoginPage from '@/pages/LoginPage';
import AdminPanel from '@/pages/AdminPanel';
import LandingPage from '@/pages/LandingPage';
import FilterSaktiApp from '@/pages/FilterSaktiApp';
import { HelpdeskApp } from '@/pages/helpdesk/HelpdeskApp';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><LandingPage /></ProtectedRoute>} />
          <Route path="/filter" element={<ProtectedRoute><FilterSaktiApp /></ProtectedRoute>} />
          <Route path="/helpdesk/*" element={<ProtectedRoute><HelpdeskApp /></ProtectedRoute>} />
          <Route path="/admin-panel" element={<ProtectedRoute requireAdmin><AdminPanel /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
