import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import OrgTree from './components/OrgTree';
import BudgetManagement from './pages/BudgetManagement';
import Approvals from './pages/Approvals';
import Budget from './pages/Budget';
import Actuals from './pages/Actuals';
import Requisitions from './pages/Requisitions';
import BudgetTimeline from './pages/BudgetTimeline';
import AuditLog from './pages/AuditLog';
import DataSync from './pages/DataSync';
import UserGuide from './pages/UserGuide';
import './App.css';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter basename={import.meta.env.PROD ? '/Headcount' : '/'}>
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/org" element={<OrgTree />} />
            <Route path="/budget-management" element={<BudgetManagement />} />
            <Route path="/approvals" element={<Approvals />} />
            <Route path="/budget" element={<Budget />} />
            <Route path="/actuals" element={<Actuals />} />
            <Route path="/requisitions" element={<Requisitions />} />
            <Route path="/budget-timeline" element={<BudgetTimeline />} />
            <Route path="/audit-log" element={<AuditLog />} />
            <Route path="/data-sync" element={<DataSync />} />
            <Route path="/guide" element={<UserGuide />} />
          </Routes>
        </main>
      </BrowserRouter>
    </AppProvider>
  );
}
