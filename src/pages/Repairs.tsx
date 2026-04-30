import { useState } from 'react';
import { Plus, Search, Filter, Settings, Edit, Trash2 } from 'lucide-react';
import { useVehicleStore } from '../store/vehicleStore';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '../utils/helpers';
import type { Repair, RepairStatus, RepairPriority, RepairPart } from '../types';

export default function RepairsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<RepairStatus | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Repair | null>(null);
  const [parts, setParts] = useState<RepairPart[]>([]);

  const { companies, currentCompanyId, vehicles, repairs, addRepair, updateRepair, deleteRepair } = useVehicleStore();

  const currentCompany = companies.find((c) => c.id === currentCompanyId);
  const currency = currentCompany?.currency || 'AED';

  const companyVehicleIds = currentCompanyId
    ? vehicles.filter((v) => v.companyId === currentCompanyId).map((v) => v.id)
    : vehicles.map((v) => v.id);

  const filtered = repairs
    .filter((r) => {
      const vehicle = vehicles.find((v) => v.id === r.vehicleId);
      const matchSearch =
        (vehicle?.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.provider.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      return companyVehicleIds.includes(r.vehicleId) && matchSearch && matchStatus;
    })
    .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());

  const inProgress = filtered.filter((r) => r.status === 'in_progress');
  const totalCost = filtered.filter((r) => r.actualCost).reduce((s, r) => s + (r.actualCost || 0), 0);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const laborCost = parseFloat(fd.get('laborCost') as string) || 0;
    const data = {
      companyId: currentCompanyId || companies[0]?.id || '',
      vehicleId: fd.get('vehicleId') as string,
      requestDate: fd.get('requestDate') as string,
      startDate: (fd.get('startDate') as string) || undefined,
      completionDate: (fd.get('completionDate') as string) || undefined,
      description: fd.get('description') as string,
      diagnosis: fd.get('diagnosis') as string,
      priority: fd.get('priority') as RepairPriority,
      status: fd.get('status') as RepairStatus,
      estimatedCost: parseFloat(fd.get('estimatedCost') as string) || undefined,
      actualCost: fd.get('actualCost') ? parseFloat(fd.get('actualCost') as string) : undefined,
      provider: fd.get('provider') as string,
      providerPhone: fd.get('providerPhone') as string,
      parts,
      laborCost,
      notes: fd.get('notes') as string,
      createdBy: 'Admin',
    };
    if (editingRecord) {
      updateRepair(editingRecord.id, data);
    } else {
      addRepair(data);
    }
    setShowAddModal(false);
    setEditingRecord(null);
    setParts([]);
  };

  const addPart = () => setParts([...parts, { name: '', quantity: 1, unitCost: 0, totalCost: 0 }]);
  const removePart = (idx: number) => setParts(parts.filter((_, i) => i !== idx));
  const updatePart = (idx: number, field: keyof RepairPart, value: string | number) => {
    const updated = [...parts];
    updated[idx] = { ...updated[idx], [field]: value };
    if (field === 'quantity' || field === 'unitCost') {
      updated[idx].totalCost = Number(updated[idx].quantity) * Number(updated[idx].unitCost);
    }
    setParts(updated);
  };

  const companyVehicles = currentCompanyId ? vehicles.filter((v) => v.companyId === currentCompanyId) : vehicles;

  const priorityColor: Record<RepairPriority, string> = {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-primary-100 text-primary-600',
    high: 'bg-warning-100 text-warning-600',
    urgent: 'bg-danger-100 text-danger-600',
  };

  return (
    <div>
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Repairs</h1>
          <p className="page-description">Manage vehicle repair orders and history</p>
        </div>
        <button onClick={() => { setEditingRecord(null); setParts([]); setShowAddModal(true); }} className="btn-primary mt-4 sm:mt-0">
          <Plus className="h-4 w-4 mr-2" />New Repair Order
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-4 flex items-center">
          <div className="p-3 bg-warning-50 rounded-lg mr-4"><Settings className="h-5 w-5 text-warning-600" /></div>
          <div>
            <p className="text-sm text-gray-500">In Progress</p>
            <p className="text-2xl font-bold text-warning-600">{inProgress.length}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center">
          <div className="p-3 bg-primary-50 rounded-lg mr-4"><Settings className="h-5 w-5 text-primary-600" /></div>
          <div>
            <p className="text-sm text-gray-500">Total Orders</p>
            <p className="text-2xl font-bold">{filtered.length}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center">
          <div className="p-3 bg-success-50 rounded-lg mr-4"><Settings className="h-5 w-5 text-success-600" /></div>
          <div>
            <p className="text-sm text-gray-500">Total Repair Cost</p>
            <p className="text-2xl font-bold">{formatCurrency(totalCost, currency)}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input type="text" placeholder="Search by plate, description, or provider..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input pl-10" />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as RepairStatus | 'all')} className="select w-40">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
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
                <th className="table-header-cell">Date</th>
                <th className="table-header-cell">Vehicle</th>
                <th className="table-header-cell">Description</th>
                <th className="table-header-cell">Priority</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Provider</th>
                <th className="table-header-cell">Cost</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="table-cell text-center py-8 text-gray-500">No repair records found</td></tr>
              ) : (
                filtered.map((r) => {
                  const vehicle = vehicles.find((v) => v.id === r.vehicleId);
                  return (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="table-cell">{formatDate(r.requestDate)}</td>
                      <td className="table-cell">
                        <div className="font-medium">{vehicle?.plateNumber || '-'}</div>
                        <div className="text-xs text-gray-500">{vehicle ? `${vehicle.brand} ${vehicle.model}` : ''}</div>
                      </td>
                      <td className="table-cell max-w-xs">
                        <div className="truncate">{r.description}</div>
                        {r.diagnosis && <div className="text-xs text-gray-500 truncate">{r.diagnosis}</div>}
                      </td>
                      <td className="table-cell"><span className={`badge ${priorityColor[r.priority]}`}>{r.priority.charAt(0).toUpperCase() + r.priority.slice(1)}</span></td>
                      <td className="table-cell"><span className={`badge ${getStatusColor(r.status)}`}>{getStatusLabel(r.status)}</span></td>
                      <td className="table-cell">{r.provider}</td>
                      <td className="table-cell">
                        {r.actualCost
                          ? formatCurrency(r.actualCost, currency)
                          : r.estimatedCost
                          ? <span className="text-gray-400">~{formatCurrency(r.estimatedCost, currency)}</span>
                          : '-'}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center space-x-2">
                          <button onClick={() => { setEditingRecord(r); setParts(r.parts || []); setShowAddModal(true); }} className="p-1 text-gray-600 hover:bg-gray-100 rounded"><Edit className="h-4 w-4" /></button>
                          <button onClick={() => { if (confirm('Delete this repair record?')) deleteRepair(r.id); }} className="p-1 text-danger-600 hover:bg-danger-50 rounded"><Trash2 className="h-4 w-4" /></button>
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
                  <h3 className="text-lg font-medium">{editingRecord ? 'Edit' : 'New'} Repair Order</h3>
                </div>
                <div className="modal-body space-y-4 max-h-[70vh] overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">Vehicle *</label>
                      <select name="vehicleId" required defaultValue={editingRecord?.vehicleId || ''} className="select">
                        <option value="">Select Vehicle</option>
                        {companyVehicles.map((v) => <option key={v.id} value={v.id}>{v.plateNumber} - {v.brand} {v.model}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Request Date *</label>
                      <input name="requestDate" type="date" required defaultValue={editingRecord?.requestDate || new Date().toISOString().split('T')[0]} className="input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Priority *</label>
                      <select name="priority" required defaultValue={editingRecord?.priority || 'medium'} className="select">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Status</label>
                      <select name="status" defaultValue={editingRecord?.status || 'pending'} className="select">
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Provider / Workshop *</label>
                      <input name="provider" type="text" required defaultValue={editingRecord?.provider} className="input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Provider Phone</label>
                      <input name="providerPhone" type="tel" defaultValue={editingRecord?.providerPhone} className="input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Start Date</label>
                      <input name="startDate" type="date" defaultValue={editingRecord?.startDate} className="input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Completion Date</label>
                      <input name="completionDate" type="date" defaultValue={editingRecord?.completionDate} className="input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Estimated Cost ({currency})</label>
                      <input name="estimatedCost" type="number" min="0" step="0.01" defaultValue={editingRecord?.estimatedCost} className="input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Actual Cost ({currency})</label>
                      <input name="actualCost" type="number" min="0" step="0.01" defaultValue={editingRecord?.actualCost} className="input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Labor Cost ({currency})</label>
                      <input name="laborCost" type="number" min="0" step="0.01" defaultValue={editingRecord?.laborCost} className="input" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description *</label>
                    <textarea name="description" rows={2} required defaultValue={editingRecord?.description} className="input resize-none" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Diagnosis / Root Cause</label>
                    <textarea name="diagnosis" rows={2} defaultValue={editingRecord?.diagnosis} className="input resize-none" />
                  </div>

                  {/* Parts */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="form-label mb-0">Spare Parts</label>
                      <button type="button" onClick={addPart} className="btn-secondary btn-sm">+ Add Part</button>
                    </div>
                    {parts.length > 0 && (
                      <div className="space-y-2">
                        {parts.map((part, idx) => (
                          <div key={idx} className="grid grid-cols-5 gap-2 items-center">
                            <input type="text" value={part.name} onChange={(e) => updatePart(idx, 'name', e.target.value)} placeholder="Part name" className="input col-span-2" />
                            <input type="number" value={part.quantity} min="1" onChange={(e) => updatePart(idx, 'quantity', parseInt(e.target.value))} placeholder="Qty" className="input" />
                            <input type="number" value={part.unitCost} min="0" step="0.01" onChange={(e) => updatePart(idx, 'unitCost', parseFloat(e.target.value))} placeholder="Unit cost" className="input" />
                            <button type="button" onClick={() => removePart(idx)} className="p-1 text-danger-600 hover:bg-danger-50 rounded text-center">✕</button>
                          </div>
                        ))}
                        <p className="text-sm text-gray-500">Parts Total: <strong>{formatCurrency(parts.reduce((s, p) => s + p.totalCost, 0), currency)}</strong></p>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Notes</label>
                    <textarea name="notes" rows={2} defaultValue={editingRecord?.notes} className="input resize-none" />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary mr-3">Cancel</button>
                  <button type="submit" className="btn-primary">{editingRecord ? 'Update' : 'Create'} Order</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
