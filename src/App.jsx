// src/App.jsx
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Invoices from './pages/Invoices';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-text">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <BrowserRouter>
      <Layout onLogout={handleLogout}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/invoices" element={<Invoices />} />
          {/* <Route path="/planning" element={<ComingSoon page="Planning" />} />
          <Route path="/subscribers" element={<ComingSoon page="Subscribers" />} />
          <Route path="/settings" element={<ComingSoon page="Settings" />} /> */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

// Placeholder component for pages not yet implemented
function ComingSoon({ page }) {
  return (
    <div className="content-area">
      <div className="page-header">
        <div>
          <h1 className="page-title">{page}</h1>
          <p className="page-subtitle">This feature is coming soon!</p>
        </div>
      </div>
      <div style={{ 
        background: 'white', 
        borderRadius: '0.75rem', 
        padding: '4rem 2rem',
        textAlign: 'center',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚧</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
          Under Construction
        </h2>
        <p style={{ color: '#6b7280' }}>
          The {page} page is currently being built. Check back soon!
        </p>
      </div>
    </div>
  );
}

export default App;