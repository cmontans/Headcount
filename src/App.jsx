import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import OrgTree from './components/OrgTree';
import BudgetManagement from './pages/BudgetManagement';
import ActualsManagement from './pages/ActualsManagement';
import BudgetTimeline from './pages/BudgetTimeline';
import Admin from './pages/Admin';
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
            <Route path="/actuals-management" element={<ActualsManagement />} />
            <Route path="/budget-timeline" element={<BudgetTimeline />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
      </BrowserRouter>
    </AppProvider>
  );
}
