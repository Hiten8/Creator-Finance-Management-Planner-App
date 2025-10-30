// src/components/Layout.jsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DollarSign, TrendingUp, Wallet, CreditCard, Calendar, Users, Settings, LogOut, Menu, X, Bell } from 'lucide-react';

export default function Layout({ children, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const navItems = [
    { icon: TrendingUp, label: 'Dashboard', path: '/dashboard' },
    { icon: Wallet, label: 'Transactions', path: '/transactions' },
    { icon: CreditCard, label: 'Invoices', path: '/invoices' },
    // { icon: Calendar, label: 'Planning', path: '/planning' },
    // { icon: Users, label: 'Subscribers', path: '/subscribers' },
    // { icon: Settings, label: 'Settings', path: '/settings' }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="dashboard-container">
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          {sidebarOpen && (
            <div className="sidebar-logo">
              <DollarSign size={24} color="#9333ea" />
              <span className="logo-text">CreatorFin</span>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="sidebar-toggle">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => navigate(item.path)}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
            >
              <item.icon size={20} />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={onLogout} className="nav-item">
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <header className="header">
          <div className="header-content">
            <div className="header-title">
              <h1>Welcome back, {user?.name?.split(' ')[0] || 'User'}! 👋</h1>
              <p>Here's your financial overview for October 2025</p>
            </div>
            <div className="header-actions">
              <button className="notification-button">
                <Bell size={20} color="#6b7280" />
                <span className="notification-badge"></span>
              </button>
              <div className="user-profile">
                <div className="user-avatar">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="user-info">
                  <p>{user?.name || 'User'}</p>
                  <p>Creator</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}