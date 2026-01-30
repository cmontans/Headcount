import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import OrgTree from './components/OrgTree';
import Proposals from './pages/Proposals';
import Approvals from './pages/Approvals';
import Budget from './pages/Budget';
import Actuals from './pages/Actuals';
import Requisitions from './pages/Requisitions';
import AuditLog from './pages/AuditLog';
import './App.css';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter basename="/Headcount">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/org" element={<OrgTree />} />
            <Route path="/proposals" element={<Proposals />} />
            <Route path="/approvals" element={<Approvals />} />
            <Route path="/budget" element={<Budget />} />
            <Route path="/actuals" element={<Actuals />} />
            <Route path="/requisitions" element={<Requisitions />} />
            <Route path="/audit-log" element={<AuditLog />} />
          </Routes>
        </main>
      </BrowserRouter>
    </AppProvider>
  );
}
