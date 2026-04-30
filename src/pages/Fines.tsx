import { useState } from 'react';
import { Plus, Search, Filter, AlertTriangle, Edit, Trash2, CheckCircle } from 'lucide-react';
import { useVehicleStore } from '../store/vehicleStore';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '../utils/helpers';
import type { Fine, FineStatus, ViolationType } from '../types';

const VIOLATION_TYPES: ViolationType[] = ['speeding', 'parking', 'red_light', 'seatbelt', 'phone', 'other'];

const violationLabels: Record<ViolationType, string> = {
  speeding: 'Speeding',
  parking: 'Parking Violation',
  red_light: 'Red Light',
  seatbelt: 'No Seatbelt',
  phone: 'Using Phone',
  other: 'Other',
};

export default function FinesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FineStatus | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Fine | null>(null);

  const { companies, currentCompanyId, vehicles, drivers, fines, addFine, updateFine, deleteFine } = useVehicleStore();

  const currentCompany = companies.find((c) => c.id === currentCompanyId);
  const currency = currentCompany?.currency || 'AED';

  const companyVehicleIds = currentCompanyId
    ? vehicles.filter((v) => v.companyId === currentCompanyId).map((v) => v.id)
    : vehicles.map((v) => v.id);

  const filtered = fines
    .filter((f) => {
      const vehicle = vehicles.find((v) => v.id === f.vehicleId);
      const driver = drivers.find((d) => d.id === f.driverId);
      const matchSearch =
        (vehicle?.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (f.fineNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (f.location?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (driver?.name.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      const matchStatus = statusFilter === 'all' || f.status === statusFilter;
      return companyVehicleIds.includes(f.vehicleId) && matchSearch && matchStatus;
    })
    .sort((a, b) => new Date(b.fineDate).getTime() - new Date(a.fineDate).getTime());

  const pending = filtered.filter((f) => f.status === 'pending');
  const totalAmount = filtered.reduce((s, f) => s + f.amount, 0);
  const pendingAmount = pending.reduce((s, f) => s + f.amount, 0);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const status = fd.get('status') as FineStatus;
    const data = {
      vehicleId: fd.get('vehicleId') as string,
      driverId: (fd.get('driverId') as string) || undefined,
      fineNumber: fd.get('fineNumber') as string,
      fineDate: fd.get('fineDate') as string,
      violationType: fd.get('violationType') as ViolationType,
      violationDetails: fd.get('violationDetails') as string,
      location: fd.get('location') as string,
      amount: parseFloat(fd.get('amount') as string) || 0,
      status,
      paidDate: status === 'paid' ? (fd.get('paidDate') as string) || undefined : undefined,
      paidAmount: status === 'paid' ? parseFloat(fd.get('paidAmount') as string) || undefined : undefined,
      notes: fd.get('notes') as string,
    };
    if (editingRecord) {
      updateFine(editingRecord.id, data);
    } else {
      addFine(data);
    }
    setShowAddModal(false);
    setEditingRecord(null);
  };

  const markPaid = (fine: Fine) => {
    updateFine(fine.id, {
      status: 'paid',
      paidDate: new Date().toISOString().split('T')[0],
      paidAmount: fine.amount,
    });
  };

  const companyVehicles = currentCompanyId ? vehicles.filter((v) => v.companyId === currentCompanyId) : vehicles;
  const companyDrivers = currentCompanyId ? drivers.filter((d) => d.companyId === currentCompanyId) : drivers;

  return (
    <div>
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Traffic Fines</h1>
          <p className="page-description">Track and manage traffic violations and fines</p>
        </div>
        <button onClick={() => { setEditingRecord(null); setShowAddModal(true); }} className="btn-primary mt-4 sm:mt-0">
          <Plus className="h-4 w-4 mr-2" />Add Fine
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-4 flex items-center">
          <div className="p-3 bg-danger-50 rounded-lg mr-4"><AlertTriangle className="h-5 w-5 text-danger-600" /></div>
          <div>
            <p className="text-sm text-gray-500">Pending Fines</p>
            <p className="text-2xl font-bold text-danger-600">{pending.length}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center">
          <div className="p-3 bg-danger-50 rounded-lg mr-4"><AlertTriangle className="h-5 w-5 text-danger-600" /></div>
          <div>
            <p className="text-sm text-gray-500">Pending Amount</p>
            <p className="text-2xl font-bold text-danger-600">{formatCurrency(pendingAmount, currency)}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center">
          <div className="p-3 bg-gray-100 rounded-lg mr-4"><AlertTriangle className="h-5 w-5 text-gray-600" /></div>
          <div>
            <p className="text-sm text-gray-500">Total Fines</p>
            <p className="text-2xl font-bold">{formatCurrency(totalAmount, currency)}</p>
          </div>
        </div>
      </div>

      {pending.length > 0 && (
        <div className="alert-danger mb-6 flex items-center">
          <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0" />
          <span>You have <strong>{pending.length}</strong> unpaid fine{pending.length > 1 ? 's' : ''} totalling <strong>{formatCurrency(pendingAmount, currency)}</strong>. Please settle them promptly to avoid further penalties.</span>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input type="text" placeholder="Search by plate, fine number, location, or driver..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input pl-10" />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as FineStatus | 'all')} className="select w-40">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="disputed">Disputed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Date</th>
                <th className="table-header-cell">Vehicle</th>
                <th className="table-header-cell">Driver</th>
                <th className="table-header-cell">Violation</th>
                <th className="table-header-cell">Location</th>
                <th className="table-header-cell">Amount</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Paid Date</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="table-cell text-center py-8 text-gray-500">No fine records found</td></tr>
              ) : (
                filtered.map((fine) => {
                  const vehicle = vehicles.find((v) => v.id === fine.vehicleId);
                  const driver = drivers.find((d) => d.id === fine.driverId);
                  return (
                    <tr key={fine.id} className="hover:bg-gray-50">
                      <td className="table-cell">{formatDate(fine.fineDate)}</td>
                      <td className="table-cell">
                        <div className="font-medium">{vehicle?.plateNumber || '-'}</div>
                        <div className="text-xs text-gray-500">{vehicle ? `${vehicle.brand} ${vehicle.model}` : ''}</div>
                      </td>
                      <td className="table-cell">{driver?.name || <span className="text-gray-400">-</span>}</td>
                      <td className="table-cell">
                        <span className={`badge ${fine.violationType === 'speeding' ? 'bg-danger-100 text-danger-800' : 'bg-warning-100 text-warning-800'}`}>
                          {violationLabels[fine.violationType]}
                        </span>
                      </td>
                      <td className="table-cell">{fine.location || '-'}</td>
                      <td className="table-cell">
                        <span className={`font-semibold ${fine.status === 'pending' ? 'text-danger-600' : 'text-gray-900'}`}>
                          {formatCurrency(fine.amount, currency)}
                        </span>
                      </td>
                      <td className="table-cell"><span className={`badge ${getStatusColor(fine.status)}`}>{getStatusLabel(fine.status)}</span></td>
                      <td className="table-cell">{fine.paidDate ? formatDate(fine.paidDate) : '-'}</td>
                      <td className="table-cell">
                        <div className="flex items-center space-x-2">
                          {fine.status === 'pending' && (
                            <button onClick={() => markPaid(fine)} className="p-1 text-success-600 hover:bg-success-50 rounded" title="Mark as Paid">
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button onClick={() => { setEditingRecord(fine); setShowAddModal(true); }} className="p-1 text-gray-600 hover:bg-gray-100 rounded"><Edit className="h-4 w-4" /></button>
                          <button onClick={() => { if (confirm('Delete this fine record?')) deleteFine(fine.id); }} className="p-1 text-danger-600 hover:bg-danger-50 rounded"><Trash2 className="h-4 w-4" /></button>
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
                  <h3 className="text-lg font-medium">{editingRecord ? 'Edit' : 'Add'} Fine Record</h3>
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
                      <label className="form-label">Driver</label>
                      <select name="driverId" defaultValue={editingRecord?.driverId || ''} className="select">
                        <option value="">Unknown / N/A</option>
                        {companyDrivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Fine Number</label>
                      <input name="fineNumber" type="text" defaultValue={editingRecord?.fineNumber} className="input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Fine Date *</label>
                      <input name="fineDate" type="date" required defaultValue={editingRecord?.fineDate || new Date().toISOString().split('T')[0]} className="input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Violation Type *</label>
                      <select name="violationType" required defaultValue={editingRecord?.violationType || 'other'} className="select">
                        {VIOLATION_TYPES.map((t) => <option key={t} value={t}>{violationLabels[t]}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Amount ({currency}) *</label>
                      <input name="amount" type="number" min="0" step="0.01" required defaultValue={editingRecord?.amount} className="input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Location</label>
                      <input name="location" type="text" defaultValue={editingRecord?.location} className="input" placeholder="e.g. King Fahd Road, Riyadh" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Status</label>
                      <select name="status" defaultValue={editingRecord?.status || 'pending'} className="select">
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="disputed">Disputed</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Paid Date</label>
                      <input name="paidDate" type="date" defaultValue={editingRecord?.paidDate} className="input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Paid Amount ({currency})</label>
                      <input name="paidAmount" type="number" min="0" step="0.01" defaultValue={editingRecord?.paidAmount} className="input" />
                    </div>
                  </div>
                  <div className="form-group mt-2">
                    <label className="form-label">Violation Details</label>
                    <textarea name="violationDetails" rows={2} defaultValue={editingRecord?.violationDetails} className="input resize-none" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Notes</label>
                    <textarea name="notes" rows={2} defaultValue={editingRecord?.notes} className="input resize-none" />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary mr-3">Cancel</button>
                  <button type="submit" className="btn-primary">{editingRecord ? 'Update' : 'Add'} Fine</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
