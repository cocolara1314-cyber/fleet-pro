import { useState } from 'react';
import { Plus, Search, Filter, Shield, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { useVehicleStore } from '../store/vehicleStore';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel, getDaysUntilExpiry, getAlertLevel } from '../utils/helpers';
import type { Insurance, InsuranceStatus, InsuranceType } from '../types';

export default function InsurancePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<InsuranceStatus | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Insurance | null>(null);

  const { companies, currentCompanyId, vehicles, insurances, addInsurance, updateInsurance, deleteInsurance } = useVehicleStore();

  const currentCompany = companies.find((c) => c.id === currentCompanyId);
  const currency = currentCompany?.currency || 'AED';

  const companyVehicleIds = currentCompanyId
    ? vehicles.filter((v) => v.companyId === currentCompanyId).map((v) => v.id)
    : vehicles.map((v) => v.id);

  const filtered = insurances
    .filter((ins) => {
      const vehicle = vehicles.find((v) => v.id === ins.vehicleId);
      const matchSearch =
        ins.policyNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ins.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (vehicle?.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      const matchStatus = statusFilter === 'all' || ins.status === statusFilter;
      return companyVehicleIds.includes(ins.vehicleId) && matchSearch && matchStatus;
    })
    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());

  const active = filtered.filter((i) => i.status === 'active');
  const expiringSoon = active.filter((i) => {
    const days = getDaysUntilExpiry(i.endDate);
    return days >= 0 && days <= 30;
  });
  const totalPremium = filtered.reduce((s, i) => s + i.premium, 0);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      companyId: currentCompanyId || companies[0]?.id || '',
      vehicleId: fd.get('vehicleId') as string,
      policyNumber: fd.get('policyNumber') as string,
      company: fd.get('company') as string,
      companyPhone: fd.get('companyPhone') as string,
      type: fd.get('type') as InsuranceType,
      startDate: fd.get('startDate') as string,
      endDate: fd.get('endDate') as string,
      premium: parseFloat(fd.get('premium') as string) || 0,
      coverageAmount: parseFloat(fd.get('coverageAmount') as string) || 0,
      status: fd.get('status') as InsuranceStatus,
      notes: fd.get('notes') as string,
    };
    if (editingRecord) {
      updateInsurance(editingRecord.id, data);
    } else {
      addInsurance(data);
    }
    setShowAddModal(false);
    setEditingRecord(null);
  };

  const companyVehicles = currentCompanyId
    ? vehicles.filter((v) => v.companyId === currentCompanyId)
    : vehicles;

  return (
    <div>
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Insurance</h1>
          <p className="page-description">Manage vehicle insurance policies</p>
        </div>
        <button onClick={() => { setEditingRecord(null); setShowAddModal(true); }} className="btn-primary mt-4 sm:mt-0">
          <Plus className="h-4 w-4 mr-2" />Add Insurance
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-4 flex items-center">
          <div className="p-3 bg-primary-50 rounded-lg mr-4"><Shield className="h-5 w-5 text-primary-600" /></div>
          <div>
            <p className="text-sm text-gray-500">Active Policies</p>
            <p className="text-2xl font-bold">{active.length}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center">
          <div className="p-3 bg-warning-50 rounded-lg mr-4"><AlertTriangle className="h-5 w-5 text-warning-600" /></div>
          <div>
            <p className="text-sm text-gray-500">Expiring in 30 days</p>
            <p className="text-2xl font-bold text-warning-600">{expiringSoon.length}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center">
          <div className="p-3 bg-success-50 rounded-lg mr-4"><Shield className="h-5 w-5 text-success-600" /></div>
          <div>
            <p className="text-sm text-gray-500">Total Premiums</p>
            <p className="text-2xl font-bold">{formatCurrency(totalPremium, currency)}</p>
          </div>
        </div>
      </div>

      {/* Expiring Soon Alert */}
      {expiringSoon.length > 0 && (
        <div className="alert-warning mb-6 flex items-center">
          <AlertTriangle className="h-5 w-5 mr-3 text-warning-600 flex-shrink-0" />
          <span><strong>{expiringSoon.length}</strong> insurance polic{expiringSoon.length > 1 ? 'ies are' : 'y is'} expiring within 30 days. Please renew promptly.</span>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input type="text" placeholder="Search by policy number, company, or plate..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input pl-10" />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as InsuranceStatus | 'all')} className="select w-40">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Vehicle</th>
                <th className="table-header-cell">Policy Number</th>
                <th className="table-header-cell">Company</th>
                <th className="table-header-cell">Type</th>
                <th className="table-header-cell">Start</th>
                <th className="table-header-cell">Expiry</th>
                <th className="table-header-cell">Days Left</th>
                <th className="table-header-cell">Premium</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="table-cell text-center py-8 text-gray-500">No insurance records found</td></tr>
              ) : (
                filtered.map((ins) => {
                  const vehicle = vehicles.find((v) => v.id === ins.vehicleId);
                  const daysLeft = getDaysUntilExpiry(ins.endDate);
                  const alertLevel = getAlertLevel(daysLeft);
                  return (
                    <tr key={ins.id} className="hover:bg-gray-50">
                      <td className="table-cell">
                        <div className="font-medium">{vehicle?.plateNumber || '-'}</div>
                        <div className="text-xs text-gray-500">{vehicle ? `${vehicle.brand} ${vehicle.model}` : ''}</div>
                      </td>
                      <td className="table-cell">{ins.policyNumber}</td>
                      <td className="table-cell">{ins.company}</td>
                      <td className="table-cell"><span className={`badge ${getStatusColor(ins.type)}`}>{getStatusLabel(ins.type)}</span></td>
                      <td className="table-cell">{formatDate(ins.startDate)}</td>
                      <td className="table-cell">{formatDate(ins.endDate)}</td>
                      <td className="table-cell">
                        <span className={`font-medium ${alertLevel === 'danger' ? 'text-danger-600' : alertLevel === 'warning' ? 'text-warning-600' : 'text-gray-900'}`}>
                          {daysLeft < 0 ? 'Expired' : `${daysLeft}d`}
                        </span>
                      </td>
                      <td className="table-cell">{formatCurrency(ins.premium, currency)}</td>
                      <td className="table-cell"><span className={`badge ${getStatusColor(ins.status)}`}>{getStatusLabel(ins.status)}</span></td>
                      <td className="table-cell">
                        <div className="flex items-center space-x-2">
                          <button onClick={() => { setEditingRecord(ins); setShowAddModal(true); }} className="p-1 text-gray-600 hover:bg-gray-100 rounded"><Edit className="h-4 w-4" /></button>
                          <button onClick={() => { if (confirm('Delete this insurance record?')) deleteInsurance(ins.id); }} className="p-1 text-danger-600 hover:bg-danger-50 rounded"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showAddModal && (
        <div className="modal-container">
          <div className="modal-overlay" onClick={() => setShowAddModal(false)} />
          <div className="modal-content">
            <div className="modal-panel max-w-2xl">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h3 className="text-lg font-medium">{editingRecord ? 'Edit' : 'Add'} Insurance Policy</h3>
                </div>
                <div className="modal-body">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">Vehicle *</label>
                      <select name="vehicleId" required defaultValue={editingRecord?.vehicleId || ''} className="select">
                        <option value="">Select Vehicle</option>
                        {companyVehicles.map((v) => <option key={v.id} value={v.id}>{v.plateNumber} - {v.brand} {v.model}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Policy Number *</label>
                      <input name="policyNumber" type="text" required defaultValue={editingRecord?.policyNumber} className="input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Insurance Company *</label>
                      <input name="company" type="text" required defaultValue={editingRecord?.company} className="input" placeholder="e.g. Tawuniya, ADNIC" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Company Phone</label>
                      <input name="companyPhone" type="tel" defaultValue={editingRecord?.companyPhone} className="input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Coverage Type *</label>
                      <select name="type" required defaultValue={editingRecord?.type || 'comprehensive'} className="select">
                        <option value="third_party">Third Party</option>
                        <option value="comprehensive">Comprehensive</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Status</label>
                      <select name="status" defaultValue={editingRecord?.status || 'active'} className="select">
                        <option value="active">Active</option>
                        <option value="expired">Expired</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Start Date *</label>
                      <input name="startDate" type="date" required defaultValue={editingRecord?.startDate} className="input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">End Date *</label>
                      <input name="endDate" type="date" required defaultValue={editingRecord?.endDate} className="input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Annual Premium ({currency})</label>
                      <input name="premium" type="number" min="0" step="0.01" defaultValue={editingRecord?.premium} className="input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Coverage Amount ({currency})</label>
                      <input name="coverageAmount" type="number" min="0" step="0.01" defaultValue={editingRecord?.coverageAmount} className="input" />
                    </div>
                  </div>
                  <div className="form-group mt-2">
                    <label className="form-label">Notes</label>
                    <textarea name="notes" rows={3} defaultValue={editingRecord?.notes} className="input resize-none" />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary mr-3">Cancel</button>
                  <button type="submit" className="btn-primary">{editingRecord ? 'Update' : 'Add'} Policy</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
