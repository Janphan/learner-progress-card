import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [healthStatus, setHealthStatus] = useState('Checking');

  useEffect(()=>{
    fetch('/api/health')
    .then((res)=>{
      if(res.ok) return res.json();
      throw new Error('Server unhealthy')

    })
    .then((data) => setHealthStatus(data.status || 'healthy'))
      .catch(() => setHealthStatus('unreachable'));
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Dashboard Placeholder</h1>
      <p>System Status: <strong data-testid="health-status">{healthStatus}</strong></p>
    </div>
  );
}

export default App
