// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Wallet, Plus, Check, X } from 'lucide-react';

export default function Dashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [userData, setUserData] = useState(null);
  const [platformData, setPlatformData] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  
  const [formData, setFormData] = useState({
    source: '',
    amount: '',
    type: 'income',
    date: new Date().toISOString().split('T')[0],
    status: 'completed',
    description: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('token');
    
    try {
      const dashResponse = await fetch('http://localhost:3001/api/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dashData = await dashResponse.json();
      setUserData(dashData);

      const platformResponse = await fetch('http://localhost:3001/api/platforms', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const platformsData = await platformResponse.json();
      
      const platformColors = {
        'YouTube': '#FF0000',
        'Patreon': '#FF424D',
        'Twitch': '#9146FF',
        'Sponsorships': '#10B981',
        'Merchandise': '#F59E0B'
      };
      
      const formattedPlatforms = platformsData.map(p => ({
        name: p.name,
        value: parseFloat(p.value),
        color: platformColors[p.name] || '#6366f1'
      }));
      setPlatformData(formattedPlatforms);

      const trendResponse = await fetch('http://localhost:3001/api/monthly-trend', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const trendData = await trendResponse.json();
      const formattedTrend = trendData.map(t => ({
        month: t.month,
        revenue: parseFloat(t.revenue),
        expenses: parseFloat(t.expenses)
      }));
      setMonthlyTrend(formattedTrend);

      const transResponse = await fetch('http://localhost:3001/api/transactions?limit=6', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const transData = await transResponse.json();
      const formattedTrans = transData.map(t => ({
        id: t.id,
        source: t.source,
        amount: parseFloat(t.amount),
        date: new Date(t.date).toLocaleDateString(),
        type: t.type,
        status: t.status
      }));
      setTransactions(formattedTrans);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.source.trim()) errors.source = 'Source is required';
    if (!formData.amount || parseFloat(formData.amount) <= 0) errors.amount = 'Amount must be greater than 0';
    if (!formData.date) errors.date = 'Date is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch('http://localhost:3001/api/transactions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount)
        })
      });

      const data = await response.json();

      if (response.ok) {
        setShowModal(false);
        setToastMessage('Transaction added successfully!');
        setToastType('success');
        setShowToast(true);
        setFormData({
          source: '',
          amount: '',
          type: 'income',
          date: new Date().toISOString().split('T')[0],
          status: 'completed',
          description: ''
        });
        fetchDashboardData();
      } else {
        setToastMessage(data.message || 'Failed to add transaction');
        setToastType('error');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      setToastMessage('Error connecting to server');
      setToastType('error');
      setShowToast(true);
    } finally {
      setSubmitting(false);
    }
  };

  const StatCard = ({ title, value, change, icon: Icon }) => (
    <div className="stat-card">
      <div className="stat-header">
        <div className="stat-icon">
          <Icon size={24} color="#9333ea" />
        </div>
        {change !== undefined && (
          <div className={`stat-change ${change > 0 ? 'positive' : 'negative'}`}>
            {change > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <h3 className="stat-title">{title}</h3>
      <p className="stat-value">{value}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-text">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="content-area">
      <div className="stats-grid">
        <StatCard 
          title="Total Revenue" 
          value={`$${(userData?.totalRevenue || 0).toLocaleString()}`}
          change={userData?.revenueGrowth || 0}
          icon={DollarSign}
        />
        <StatCard 
          title="This Month" 
          value={`$${(userData?.monthlyRevenue || 0).toLocaleString()}`}
          change={15.3}
          icon={TrendingUp}
        />
        <StatCard 
          title="Total Expenses" 
          value={`$${(userData?.expenses || 0).toLocaleString()}`}
          change={-5.2}
          icon={CreditCard}
        />
        <StatCard 
          title="Net Income" 
          value={`$${((userData?.monthlyRevenue || 0) - (userData?.expenses || 0)).toLocaleString()}`}
          change={28.7}
          icon={Wallet}
        />
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-header">
            <h2 className="chart-title">Revenue & Expenses</h2>
            <div className="period-buttons">
              {['week', 'month', 'year'].map(period => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`period-button ${selectedPeriod === period ? 'active' : ''}`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrend.length > 0 ? monthlyTrend : [{ month: 'No Data', revenue: 0, expenses: 0 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#9333ea" strokeWidth={3} name="Revenue" />
              <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={3} name="Expenses" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h2 className="chart-title">Revenue by Platform</h2>
          {platformData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={platformData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {platformData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="platform-legend">
                {platformData.map((platform, idx) => (
                  <div key={idx} className="legend-item">
                    <div className="legend-label">
                      <div className="legend-color" style={{ backgroundColor: platform.color }}></div>
                      <span className="legend-name">{platform.name}</span>
                    </div>
                    <span className="legend-value">${platform.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state">No platform data available</div>
          )}
        </div>
      </div>

      <div className="transactions-card">
        <div className="transactions-header">
          <h2 className="chart-title">Recent Transactions</h2>
          <button className="add-button" onClick={() => setShowModal(true)}>
            <Plus size={16} />
            Add Transaction
          </button>
        </div>
        {transactions.length > 0 ? (
          <div>
            {transactions.map(transaction => (
              <div key={transaction.id} className="transaction-item">
                <div className="transaction-left">
                  <div className={`transaction-icon ${transaction.type}`}>
                    <DollarSign size={20} color={transaction.type === 'income' ? '#16a34a' : '#dc2626'} />
                  </div>
                  <div className="transaction-info">
                    <h4>{transaction.source}</h4>
                    <p>{transaction.date}</p>
                  </div>
                </div>
                <div className="transaction-right">
                  <p className={`transaction-amount ${transaction.type}`}>
                    {transaction.type === 'income' ? '+' : '-'}${Math.abs(transaction.amount).toLocaleString()}
                  </p>
                  <span className={`transaction-status ${transaction.status}`}>
                    {transaction.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">No transactions yet</div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add New Transaction</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={24} />
              </button>
            </div>

            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Transaction Type</label>
                <div className="radio-group">
                  <div className="radio-option">
                    <input
                      type="radio"
                      id="income"
                      name="type"
                      value="income"
                      checked={formData.type === 'income'}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="income" className="radio-label income">
                      <TrendingUp size={20} />
                      Income
                    </label>
                  </div>
                  <div className="radio-option">
                    <input
                      type="radio"
                      id="expense"
                      name="type"
                      value="expense"
                      checked={formData.type === 'expense'}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="expense" className="radio-label expense">
                      <TrendingDown size={20} />
                      Expense
                    </label>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Source / Description</label>
                <input
                  type="text"
                  name="source"
                  value={formData.source}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="e.g., YouTube Ad Revenue"
                />
                {formErrors.source && <p className="form-error">{formErrors.source}</p>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Amount ($)</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                  {formErrors.amount && <p className="form-error">{formErrors.amount}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                  {formErrors.date && <p className="form-error">{formErrors.date}</p>}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="select-input"
                >
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-button" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="save-button" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showToast && (
        <div className={`toast ${toastType}`}>
          <div className="toast-icon">
            <Check size={16} />
          </div>
          <p className="toast-message">{toastMessage}</p>
        </div>
      )}
    </div>
  );
}