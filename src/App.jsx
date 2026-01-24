import './App.css'
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import PublicDashboard from './pages/PublicDashboard';
import ParticipantDashboard from './pages/ParticipantDashboard';

function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicDashboard />} />
      <Route path="/dashboard" element={ <ProtectedRoute requireParticipant={true}>
                                            <ParticipantDashboard />
                                          </ProtectedRoute>
                                        } 
                                      />
    </Routes>
  );
}

export default App;