import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import OrgTree from './components/OrgTree';
import Requirements from './pages/Requirements';
import Approvals from './pages/Approvals';
import Budget from './pages/Budget';
import Actuals from './pages/Actuals';
import './App.css';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/org" element={<OrgTree />} />
            <Route path="/requirements" element={<Requirements />} />
            <Route path="/approvals" element={<Approvals />} />
            <Route path="/budget" element={<Budget />} />
            <Route path="/actuals" element={<Actuals />} />
          </Routes>
        </main>
      </BrowserRouter>
    </AppProvider>
  );
}
