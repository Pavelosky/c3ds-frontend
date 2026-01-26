import './App.css'
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import PublicDashboard from './pages/PublicDashboard';
import ParticipantDashboard from './pages/ParticipantDashboard';
import Login from './pages/Login';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
    <Routes>
      <Route path="/" element={<PublicDashboard />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={ <ProtectedRoute requireParticipant={true}>
                                            <ParticipantDashboard />
                                          </ProtectedRoute>
                                        }
                                      />
    </Routes>
    </ErrorBoundary>
  );
}

export default App;