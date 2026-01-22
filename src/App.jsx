import './App.css'
import { Routes, Route } from 'react-router-dom';
import PublicDashboard from './pages/PublicDashboard';
import ParticipantDashboard from './pages/ParticipantDashboard';

function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicDashboard />} />
      <Route path="/dashboard" element={<ParticipantDashboard />} />
    </Routes>
  );
}

export default App;