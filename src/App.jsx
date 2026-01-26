import './App.css'
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import PublicDashboard from './pages/PublicDashboard';
import ParticipantDashboard from './pages/ParticipantDashboard';
import DeviceDetail from './pages/DeviceDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
    <Routes>
      <Route path="/" element={<PublicDashboard />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={ <ProtectedRoute requireParticipant={true}>
                                            <ParticipantDashboard />
                                          </ProtectedRoute>
                                        }
                                      />
      <Route path="/device/:deviceId" element={ <ProtectedRoute requireParticipant={true}>
                                                   <DeviceDetail />
                                                 </ProtectedRoute>
                                               }
                                             />
    </Routes>
    </ErrorBoundary>
  );
}

export default App;