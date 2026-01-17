import './App.css'
import { Routes, Route } from 'react-router-dom';
import PublicDashboard from './pages/PublicDashboard';

function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicDashboard />} />
    </Routes>
  );
}

export default App;