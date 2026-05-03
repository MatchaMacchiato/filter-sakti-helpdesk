import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from '@/pages/LandingPage';
import FilterSaktiApp from '@/pages/FilterSaktiApp';
import { HelpdeskApp } from '@/pages/helpdesk/HelpdeskApp';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/filter" element={<FilterSaktiApp />} />
        <Route path="/helpdesk/*" element={<HelpdeskApp />} />
      </Routes>
    </BrowserRouter>
  );
}
