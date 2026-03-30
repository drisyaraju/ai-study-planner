import { useState } from 'react';
import StudyPlanner from './StudyPlanner';
import Dashboard from './Dashboard';
import Features from './Features';

export default function App() {
  const [page, setPage] = useState('planner');

  return (
    <div>
      <div style={{ display:'flex', gap:10, padding:10, background:'#0a0a0f' }}>
        <button onClick={() => setPage('planner')} style={{ color:'white', background:'#7c5cfc', border:'none', padding:'8px 16px', borderRadius:8, cursor:'pointer' }}>Planner</button>
        <button onClick={() => setPage('dashboard')} style={{ color:'white', background:'#7c5cfc', border:'none', padding:'8px 16px', borderRadius:8, cursor:'pointer' }}>Dashboard</button>
        <button onClick={() => setPage('features')} style={{ color:'white', background:'#7c5cfc', border:'none', padding:'8px 16px', borderRadius:8, cursor:'pointer' }}>Features</button>
      </div>
      {page === 'planner' && <StudyPlanner />}
      {page === 'dashboard' && <Dashboard />}
      {page === 'features' && <Features />}
    </div>
  );
}