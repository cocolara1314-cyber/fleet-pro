import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useVehicleStore } from './store/vehicleStore';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import VehicleDetail from './pages/VehicleDetail';
import Drivers from './pages/Drivers';
import Maintenance from './pages/Maintenance';
import Insurance from './pages/Insurance';
import Fines from './pages/Fines';
import Repairs from './pages/Repairs';
import Fuel from './pages/Fuel';
import Inspections from './pages/Inspections';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import CompanySelect from './pages/CompanySelect';
import './App.css';

function App() {
  const currentCompanyId = useVehicleStore((s) => s.currentCompanyId);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            currentCompanyId
              ? <Layout />
              : <Navigate to="/select" replace />
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="vehicles/:id" element={<VehicleDetail />} />
          <Route path="drivers" element={<Drivers />} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="insurance" element={<Insurance />} />
          <Route path="fines" element={<Fines />} />
          <Route path="repairs" element={<Repairs />} />
          <Route path="fuel" element={<Fuel />} />
          <Route path="inspections" element={<Inspections />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="/select" element={<CompanySelect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
