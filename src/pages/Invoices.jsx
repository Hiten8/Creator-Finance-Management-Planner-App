// src/pages/Invoices.jsx
import { useState, useEffect } from 'react';
import { FileText, Plus, Eye, Download, Send, Search, Filter, DollarSign, Clock, CheckCircle, XCircle, X, Check } from 'lucide-react';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    invoiceNumber: '',
    amount: '',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: '',
    status: 'pending'
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Mock data - Replace with API call later
  useEffect(() => {
    const mockInvoices = [
      {
        id: 1,
        invoiceNumber: 'INV-001',
        clientName: 'Acme Corporation',
        clientEmail: 'billing@acme.com',
        amount: 5000,
        dueDate: '2025-11-15',
        issueDate: '2025-10-15',
        status: 'pending',
        description: 'Brand Partnership Q4 2025'
      },
      {
        id: 2,
        invoiceNumber: 'INV-002',
        clientName: 'TechStart Inc',
        clientEmail: 'payments@techstart.io',
        amount: 3500,
        dueDate: '2025-11-20',
        issueDate: '2025-10-20',
        status: 'paid',
        description: 'Sponsored Content - October'
      },
      {
        id: 3,
        invoiceNumber: 'INV-003',
        clientName: 'Creative Studios',
        clientEmail: 'finance@creative.com',
        amount: 7500,
        dueDate: '2025-11-10',
        issueDate: '2025-10-10',
        status: 'overdue',
        description: 'Video Production Services'
      },
      {
        id: 4,
        invoiceNumber: 'INV-004',
        clientName: 'Digital Marketing Co',
        clientEmail: 'accounts@digitalmkt.com',
        amount: 2800,
        dueDate: '2025-12-01',
        issueDate: '2025-10-25',
        status: 'draft',
        description: 'Social Media Campaign'
      },
      {
        id: 5,
        invoiceNumber: 'INV-005',
        clientName: 'Global Brands LLC',
        clientEmail: 'invoices@globalbrands.com',
        amount: 12000,
        dueDate: '2025-10-30',
        issueDate: '2025-09-30',
        status: 'paid',
        description: 'Annual Partnership Agreement'
      }
    ];
    setInvoices(mockInvoices);
    setFilteredInvoices(mockInvoices);
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [searchTerm, filterStatus, invoices]);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const filterInvoices = () => {
    let filtered = [...invoices];

    if (searchTerm) {
      filtered = filtered.filter(inv => 
        inv.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(inv => inv.status === filterStatus);
    }

    setFilteredInvoices(filtered);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.clientName.trim()) errors.clientName = 'Client name is required';
    if (!formData.clientEmail.trim()) errors.clientEmail = 'Client email is required';
    if (!formData.invoiceNumber.trim()) errors.invoiceNumber = 'Invoice number is required';
    if (!formData.amount || parseFloat(formData.amount) <= 0) errors.amount = 'Amount must be greater than 0';
    if (!formData.dueDate) errors.dueDate = 'Due date is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      const newInvoice = {
        id: invoices.length + 1,
        ...formData,
        amount: parseFloat(formData.amount),
        issueDate: new Date().toISOString().split('T')[0]
      };
      
      setInvoices([newInvoice, ...invoices]);
      setShowModal(false);
      setToastMessage('Invoice created successfully!');
      setShowToast(true);
      setFormData({
        clientName: '',
        clientEmail: '',
        invoiceNumber: '',
        amount: '',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: '',
        status: 'pending'
      });
      setSubmitting(false);
    }, 1000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleStatusChange = (id, newStatus) => {
    setInvoices(invoices.map(inv => 
      inv.id === id ? { ...inv, status: newStatus } : inv
    ));
    setToastMessage(`Invoice status updated to ${newStatus}`);
    setShowToast(true);
  };

  const stats = {
    total: invoices.reduce((sum, inv) => sum + inv.amount, 0),
    paid: invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0),
    pending: invoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + inv.amount, 0),
    overdue: invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.amount, 0)
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'paid': return <CheckCircle size={16} />;
      case 'overdue': return <XCircle size={16} />;
      case 'pending': return <Clock size={16} />;
      default: return <FileText size={16} />;
    }
  };

  return (
    <div className="content-area">
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">Create and manage your invoices</p>
        </div>
        <button className="add-button" onClick={() => setShowModal(true)}>
          <Plus size={20} />
          Create Invoice
        </button>
      </div>

      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon">
              <DollarSign size={24} color="#9333ea" />
            </div>
          </div>
          <h3 className="stat-title">Total Invoiced</h3>
          <p className="stat-value">${stats.total.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon">
              <CheckCircle size={24} color="#16a34a" />
            </div>
          </div>
          <h3 className="stat-title">Paid</h3>
          <p className="stat-value" style={{ color: '#16a34a' }}>${stats.paid.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon">
              <Clock size={24} color="#f59e0b" />
            </div>
          </div>
          <h3 className="stat-title">Pending</h3>
          <p className="stat-value" style={{ color: '#f59e0b' }}>${stats.pending.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon">
              <XCircle size={24} color="#dc2626" />
            </div>
          </div>
          <h3 className="stat-title">Overdue</h3>
          <p className="stat-value" style={{ color: '#dc2626' }}>${stats.overdue.toLocaleString()}</p>
        </div>
      </div>

      <div className="transactions-filter-card">
        <div className="filter-bar">
          <div className="search-box">
            <Search size={20} color="#6b7280" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-buttons">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
            <button className="export-button">
              <Download size={18} />
              Export
            </button>
          </div>
        </div>

        <div className="invoices-grid">
          {filteredInvoices.length > 0 ? (
            filteredInvoices.map(invoice => (
              <div key={invoice.id} className="invoice-card">
                <div className="invoice-header">
                  <div>
                    <h3 className="invoice-number">{invoice.invoiceNumber}</h3>
                    <p className="invoice-client">{invoice.clientName}</p>
                  </div>
                  <div className={`invoice-status-badge ${invoice.status}`}>
                    {getStatusIcon(invoice.status)}
                    {invoice.status}
                  </div>
                </div>

                <div className="invoice-details">
                  <div className="invoice-detail-row">
                    <span className="detail-label">Amount:</span>
                    <span className="detail-value invoice-amount">${invoice.amount.toLocaleString()}</span>
                  </div>
                  <div className="invoice-detail-row">
                    <span className="detail-label">Issue Date:</span>
                    <span className="detail-value">{new Date(invoice.issueDate).toLocaleDateString()}</span>
                  </div>
                  <div className="invoice-detail-row">
                    <span className="detail-label">Due Date:</span>
                    <span className="detail-value">{new Date(invoice.dueDate).toLocaleDateString()}</span>
                  </div>
                  <div className="invoice-detail-row">
                    <span className="detail-label">Description:</span>
                    <span className="detail-value">{invoice.description}</span>
                  </div>
                </div>

                <div className="invoice-actions">
                  <button className="invoice-action-btn view">
                    <Eye size={16} />
                    View
                  </button>
                  <button className="invoice-action-btn download">
                    <Download size={16} />
                    Download
                  </button>
                  <button className="invoice-action-btn send">
                    <Send size={16} />
                    Send
                  </button>
                  {invoice.status === 'pending' && (
                    <button 
                      className="invoice-action-btn mark-paid"
                      onClick={() => handleStatusChange(invoice.id, 'paid')}
                    >
                      <CheckCircle size={16} />
                      Mark Paid
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state" style={{ gridColumn: '1/-1' }}>No invoices found</div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create New Invoice</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={24} />
              </button>
            </div>

            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Invoice Number</label>
                  <input
                    type="text"
                    name="invoiceNumber"
                    value={formData.invoiceNumber}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="INV-001"
                  />
                  {formErrors.invoiceNumber && <p className="form-error">{formErrors.invoiceNumber}</p>}
                </div>

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
              </div>

              <div className="form-group">
                <label className="form-label">Client Name</label>
                <input
                  type="text"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Acme Corporation"
                />
                {formErrors.clientName && <p className="form-error">{formErrors.clientName}</p>}
              </div>

              <div className="form-group">
                <label className="form-label">Client Email</label>
                <input
                  type="email"
                  name="clientEmail"
                  value={formData.clientEmail}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="billing@acme.com"
                />
                {formErrors.clientEmail && <p className="form-error">{formErrors.clientEmail}</p>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                  {formErrors.dueDate && <p className="form-error">{formErrors.dueDate}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="select-input"
                  >
                    <option value="draft">Draft</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="textarea-input"
                  placeholder="Service description..."
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-button" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="save-button" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showToast && (
        <div className="toast success">
          <div className="toast-icon">
            <Check size={16} />
          </div>
          <p className="toast-message">{toastMessage}</p>
        </div>
      )}
    </div>
  );
}