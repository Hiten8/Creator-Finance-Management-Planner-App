// src/components/Login.jsx
import { useState } from 'react';
import { DollarSign, TrendingUp, PieChart } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    if (!formData.email || !formData.password || (!isLogin && !formData.name)) {
      setMessage('Please fill in all fields');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const endpoint = isLogin ? 'http://localhost:3001/api/login' : 'http://localhost:3001/api/register';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        setTimeout(() => {
          onLoginSuccess();
        }, 500);
      } else {
        setMessage(data.message || 'An error occurred');
      }
    } catch (error) {
      setMessage('Unable to connect to server. Please make sure the backend is running on port 3001.');
      console.error('Connection error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        
        <div className="login-branding">
          <div className="logo-badge">
            <DollarSign size={32} color="#9333ea" />
            <span className="logo-text">CreatorFin</span>
          </div>
          
          <h1 className="login-title">
            Manage Your Creator Revenue Like a Pro
          </h1>
          
          <p className="login-subtitle">
            Track income from multiple platforms, plan your finances, and grow your creator business with confidence.
          </p>

          <div className="features-grid">
            <div className="feature-card">
              <TrendingUp size={32} color="#16a34a" />
              <p>Revenue Tracking</p>
            </div>
            <div className="feature-card">
              <PieChart size={32} color="#3b82f6" />
              <p>Budget Planning</p>
            </div>
            <div className="feature-card">
              <DollarSign size={32} color="#9333ea" />
              <p>Tax Insights</p>
            </div>
          </div>
        </div>

        <div className="login-form-card">
          <div className="form-header">
            <h2 className="form-title">
              {isLogin ? 'Welcome Back' : 'Get Started'}
            </h2>
            <p className="form-subtitle">
              {isLogin ? 'Sign in to your account' : 'Create your creator account'}
            </p>
          </div>

          <div>
            {!isLogin && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  className="form-input"
                  placeholder="Your name"
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                className="form-input"
                placeholder="you@example.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                className="form-input"
                placeholder="••••••••"
              />
            </div>

            {isLogin && (
              <div className="form-options">
                <label className="checkbox-label">
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
                <button className="forgot-password">
                  Forgot password?
                </button>
              </div>
            )}

            {message && (
              <div className={`message-box ${
                message.includes('successful') || message.includes('successfully')
                  ? 'message-success' 
                  : 'message-error'
              }`}>
                {message}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="submit-button"
            >
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </div>

          <div className="toggle-form">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setMessage('');
                setFormData({ email: '', password: '', name: '' });
              }}
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}