// src/pages/Transactions.jsx
import { useState, useEffect } from 'react';
import { DollarSign, Search, Filter, Download, Edit2, Trash2, TrendingUp, TrendingDown, Plus, Check, X } from 'lucide-react';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
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
    fetchTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, filterType, filterStatus]);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const fetchTransactions = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:3001/api/transactions?limit=100', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      const formatted = data.map(t => ({
        id: t.id,
        source: t.source,
        amount: parseFloat(t.amount),
        date: t.date,
        type: t.type,
        status: t.status
      }));
      setTransactions(formatted);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.source.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(t => t.status === filterStatus);
    }

    setFilteredTransactions(filtered);
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      source: transaction.source,
      amount: transaction.amount.toString(),
      type: transaction.type,
      date: transaction.date,
      status: transaction.status,
      description: ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:3001/api/transactions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setToastMessage('Transaction deleted successfully');
        setToastType('success');
        setShowToast(true);
        fetchTransactions();
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      setToastMessage('Error deleting transaction');
      setToastType('error');
      setShowToast(true);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    const token = localStorage.getItem('token');

    try {
      const url = editingTransaction 
        ? `http://localhost:3001/api/transactions/${editingTransaction.id}`
        : 'http://localhost:3001/api/transactions';
      
      const method = editingTransaction ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount)
        })
      });

      if (response.ok) {
        setShowModal(false);
        setToastMessage(editingTransaction ? 'Transaction updated!' : 'Transaction added!');
        setToastType('success');
        setShowToast(true);
        setEditingTransaction(null);
        setFormData({
          source: '',
          amount: '',
          type: 'income',
          date: new Date().toISOString().split('T')[0],
          status: 'completed',
          description: ''
        });
        fetchTransactions();
      }
    } catch (error) {
      console.error('Error saving transaction:', error);
      setToastMessage('Error saving transaction');
      setToastType('error');
      setShowToast(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const stats = {
    totalIncome: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
    totalExpenses: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
    pending: transactions.filter(t => t.status === 'pending').length,
    completed: transactions.filter(t => t.status === 'completed').length
  };

  if (loading) {
    return <div className="loading-state"><div className="loading-text">Loading transactions...</div></div>;
  }

  return (
    <div className="content-area">
      <div className="page-header">
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle">Manage all your income and expenses</p>
        </div>
        <button className="add-button" onClick={() => {
          setEditingTransaction(null);
          setFormData({
            source: '',
            amount: '',
            type: 'income',
            date: new Date().toISOString().split('T')[0],
            status: 'completed',
            description: ''
          });
          setShowModal(true);
        }}>
          <Plus size={20} />
          Add Transaction
        </button>
      </div>

      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon">
              <TrendingUp size={24} color="#16a34a" />
            </div>
          </div>
          <h3 className="stat-title">Total Income</h3>
          <p className="stat-value" style={{ color: '#16a34a' }}>${stats.totalIncome.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon">
              <TrendingDown size={24} color="#dc2626" />
            </div>
          </div>
          <h3 className="stat-title">Total Expenses</h3>
          <p className="stat-value" style={{ color: '#dc2626' }}>${stats.totalExpenses.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon">
              <DollarSign size={24} color="#9333ea" />
            </div>
          </div>
          <h3 className="stat-title">Net Balance</h3>
          <p className="stat-value">${(stats.totalIncome - stats.totalExpenses).toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon">
              <Filter size={24} color="#3b82f6" />
            </div>
          </div>
          <h3 className="stat-title">Total Transactions</h3>
          <p className="stat-value">{transactions.length}</p>
        </div>
      </div>

      <div className="transactions-filter-card">
        <div className="filter-bar">
          <div className="search-box">
            <Search size={20} color="#6b7280" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-buttons">
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="filter-select">
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
            </select>
            <button className="export-button">
              <Download size={18} />
              Export
            </button>
          </div>
        </div>

        <div className="transactions-table">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Source</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map(transaction => (
                  <tr key={transaction.id}>
                    <td>{new Date(transaction.date).toLocaleDateString()}</td>
                    <td className="transaction-source">{transaction.source}</td>
                    <td>
                      <span className={`type-badge ${transaction.type}`}>
                        {transaction.type === 'income' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {transaction.type}
                      </span>
                    </td>
                    <td className={`amount-cell ${transaction.type}`}>
                      {transaction.type === 'income' ? '+' : '-'}${Math.abs(transaction.amount).toLocaleString()}
                    </td>
                    <td>
                      <span className={`transaction-status ${transaction.status}`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="action-btn edit" onClick={() => handleEdit(transaction)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="action-btn delete" onClick={() => handleDelete(transaction.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="empty-state">No transactions found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}</h2>
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
                  placeholder="e.g., YouTube Ad Revenue, Video Equipment"
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
                  {submitting ? 'Saving...' : (editingTransaction ? 'Update Transaction' : 'Save Transaction')}
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