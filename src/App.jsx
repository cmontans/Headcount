import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import OrgTree from './components/OrgTree';
import BudgetManagement from './pages/BudgetManagement';
import ActualsManagement from './pages/ActualsManagement';
import Approvals from './pages/Approvals';
import Admin from './pages/Admin';
import './App.css';

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/org" element={<OrgTree />} />
            <Route path="/budget-management" element={<BudgetManagement />} />
            <Route path="/actuals-management" element={<ActualsManagement />} />
            <Route path="/approvals" element={<Approvals />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
      </HashRouter>
    </AppProvider>
  );
}
