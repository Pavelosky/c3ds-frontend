import './App.css'
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import PublicDashboard from './pages/PublicDashboard';
import ParticipantDashboard from './pages/ParticipantDashboard';
import DeviceDetail from './pages/DeviceDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import About from './pages/About';
import AdminDashboard from './pages/AdminDashboard';
import AdminIncidentDetail from './pages/AdminIncidentDetail';
import AdminIncidentCreate from './pages/AdminIncidentCreate';
import AdminEventReplay from './pages/AdminEventReplay';
import AdminHeatmap from './pages/AdminHeatmap';
import AdminDeviceComparison from './pages/AdminDeviceComparison';
import AdminAuditTrail from './pages/AdminAuditTrail';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
    <Routes>
      <Route path="/" element={<PublicDashboard />} />
      <Route path="/about" element={<About />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={
        <ProtectedRoute requireParticipant={true}>
          <ParticipantDashboard />
        </ProtectedRoute>
      } />
      <Route path="/device/:deviceId" element={
        <ProtectedRoute requireParticipant={true}>
          <DeviceDetail />
        </ProtectedRoute>
      } />

      {/* Admin routes */}
      <Route path="/c3ds-admin" element={
        <ProtectedRoute requireAdmin={true}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/c3ds-admin/incidents/new" element={
        <ProtectedRoute requireAdmin={true}>
          <AdminIncidentCreate />
        </ProtectedRoute>
      } />
      <Route path="/c3ds-admin/incidents/:incidentId" element={
        <ProtectedRoute requireAdmin={true}>
          <AdminIncidentDetail />
        </ProtectedRoute>
      } />
      <Route path="/c3ds-admin/replay" element={
        <ProtectedRoute requireAdmin={true}>
          <AdminEventReplay />
        </ProtectedRoute>
      } />
      <Route path="/c3ds-admin/heatmap" element={
        <ProtectedRoute requireAdmin={true}>
          <AdminHeatmap />
        </ProtectedRoute>
      } />
      <Route path="/c3ds-admin/compare" element={
        <ProtectedRoute requireAdmin={true}>
          <AdminDeviceComparison />
        </ProtectedRoute>
      } />
      <Route path="/c3ds-admin/devices/:deviceId/audit" element={
        <ProtectedRoute requireAdmin={true}>
          <AdminAuditTrail />
        </ProtectedRoute>
      } />
    </Routes>
    </ErrorBoundary>
  );
}

export default App;