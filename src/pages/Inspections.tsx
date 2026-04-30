import { useState } from 'react';
import { Plus, Search, ClipboardCheck, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { useVehicleStore } from '../store/vehicleStore';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel, getDaysUntilExpiry, getAlertLevel } from '../utils/helpers';
import type { Inspection, InspectionResult } from '../types';

export default function InspectionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Inspection | null>(null);

  const { companies, currentCompanyId, vehicles, inspections, addInspection, updateInspection, deleteInspection } = useVehicleStore();

  const currentCompany = companies.find((c) => c.id === currentCompanyId);
  const currency = currentCompany?.currency || 'AED';

  const companyVehicleIds = currentCompanyId
    ? vehicles.filter((v) => v.companyId === currentCompanyId).map((v) => v.id)
    : vehicles.map((v) => v.id);

  const filtered = inspections
    .filter((ins) => {
      const vehicle = vehicles.find((v) => v.id === ins.vehicleId);
      const matchSearch =
        (vehicle?.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        ins.center.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ins.certificateNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      return companyVehicleIds.includes(ins.vehicleId) && matchSearch;
    })
    .sort((a, b) => new Date(b.inspectionDate).getTime() - new Date(a.inspectionDate).getTime());

  // 即将到期（30天内）
  const expiringSoon = filtered.filter((ins) => {
    const days = getDaysUntilExpiry(ins.expiryDate);
    return days >= 0 && days <= 30;
  });
  // 已过期
  const expired = filtered.filter((ins) => getDaysUntilExpiry(ins.expiryDate) < 0);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      companyId: currentCompanyId || companies[0]?.id || '',
      vehicleId: fd.get('vehicleId') as string,
      inspectionDate: fd.get('inspectionDate') as string,
      expiryDate: fd.get('expiryDate') as string,
      result: fd.get('result') as InspectionResult,
      center: fd.get('center') as string,
      centerLocation: fd.get('centerLocation') as string,
      cost: parseFloat(fd.get('cost') as string) || 0,
      certificateNumber: (fd.get('certificateNumber') as string) || undefined,
      notes: (fd.get('notes') as string) || undefined,
      nextInspectionDate: (fd.get('nextInspectionDate') as string) || undefined,
    };
    if (editingRecord) {
      updateInspection(editingRecord.id, data);
    } else {
      addInspection(data);
    }
    setShowAddModal(false);
    setEditingRecord(null);
  };

  const companyVehicles = currentCompanyId ? vehicles.filter((v) => v.companyId === currentCompanyId) : vehicles;

  return (
    <div>
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Vehicle Inspections</h1>
          <p className="page-description">Annual inspection records — KSA (Fahas) & UAE (RTA)</p>
        </div>
        <button onClick={() => { setEditingRecord(null); setShowAddModal(true); }} className="btn-primary mt-4 sm:mt-0">
          <Plus className="h-4 w-4 mr-2" />Add Inspection
        </button>
      </div>

      {/* Alerts */}
      {expired.length > 0 && (
        <div className="alert-danger mb-4 flex items-center">
          <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0" />
          <span><strong>{expired.length}</strong> vehicle{expired.length > 1 ? 's have' : ' has'} an expired inspection certificate. Immediate renewal required.</span>
        </div>
      )}
      {expiringSoon.length > 0 && (
        <div className="alert-warning mb-6 flex items-center">
          <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0" />
          <span><strong>{expiringSoon.length}</strong> inspection certificate{expiringSoon.length > 1 ? 's are' : ' is'} expiring within 30 days.</span>
        </div>
      )}

      {/* Region Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="card p-4 border-l-4 border-l-primary-500">
          <h3 className="font-medium text-gray-900 mb-1">🇸🇦 Saudi Arabia (KSA)</h3>
          <p className="text-sm text-gray-500">Commercial vehicles: annual inspection required every year. Inspection centres (Fahas) operated by SASO-certified providers.</p>
        </div>
        <div className="card p-4 border-l-4 border-l-success-500">
          <h3 className="font-medium text-gray-900 mb-1">🇦🇪 UAE (Dubai / Abu Dhabi)</h3>
          <p className="text-sm text-gray-500">Private cars &lt;3 years: exempt. Commercial vehicles: annual from year 1. Book via RTA online or Tajdeed / ADNOC inspection centres.</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-4 flex items-center">
          <div className="p-3 bg-primary-50 rounded-lg mr-4"><ClipboardCheck className="h-5 w-5 text-primary-600" /></div>
          <div>
            <p className="text-sm text-gray-500">Total Records</p>
            <p className="text-2xl font-bold">{filtered.length}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center">
          <div className="p-3 bg-danger-50 rounded-lg mr-4"><AlertTriangle className="h-5 w-5 text-danger-600" /></div>
          <div>
            <p className="text-sm text-gray-500">Expired / Expiring</p>
            <p className="text-2xl font-bold text-danger-600">{expired.length + expiringSoon.length}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center">
          <div className="p-3 bg-success-50 rounded-lg mr-4"><ClipboardCheck className="h-5 w-5 text-success-600" /></div>
          <div>
            <p className="text-sm text-gray-500">Passed</p>
            <p className="text-2xl font-bold">{filtered.filter((i) => i.result === 'pass').length}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input type="text" placeholder="Search by plate, centre, or certificate number..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input pl-10" />
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Inspection Date</th>
                <th className="table-header-cell">Vehicle</th>
                <th className="table-header-cell">Centre</th>
                <th className="table-header-cell">Result</th>
                <th className="table-header-cell">Certificate #</th>
                <th className="table-header-cell">Expiry Date</th>
                <th className="table-header-cell">Days Left</th>
                <th className="table-header-cell">Cost</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="table-cell text-center py-8 text-gray-500">No inspection records found</td></tr>
              ) : (
                filtered.map((ins) => {
                  const vehicle = vehicles.find((v) => v.id === ins.vehicleId);
                  const daysLeft = getDaysUntilExpiry(ins.expiryDate);
                  const alertLevel = getAlertLevel(daysLeft);
                  return (
                    <tr key={ins.id} className="hover:bg-gray-50">
                      <td className="table-cell">{formatDate(ins.inspectionDate)}</td>
                      <td className="table-cell">
                        <div className="font-medium">{vehicle?.plateNumber || '-'}</div>
                        <div className="text-xs text-gray-500">{vehicle ? `${vehicle.brand} ${vehicle.model}` : ''}</div>
                      </td>
                      <td className="table-cell">
                        <div>{ins.center}</div>
                        {ins.centerLocation && <div className="text-xs text-gray-500">{ins.centerLocation}</div>}
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${getStatusColor(ins.result)}`}>{getStatusLabel(ins.result)}</span>
                      </td>
                      <td className="table-cell">{ins.certificateNumber || '-'}</td>
                      <td className="table-cell">{formatDate(ins.expiryDate)}</td>
                      <td className="table-cell">
                        <span className={`font-medium ${alertLevel === 'danger' ? 'text-danger-600' : alertLevel === 'warning' ? 'text-warning-600' : 'text-gray-900'}`}>
                          {daysLeft < 0 ? `Expired ${Math.abs(daysLeft)}d ago` : `${daysLeft}d`}
                        </span>
                      </td>
                      <td className="table-cell">{formatCurrency(ins.cost, currency)}</td>
                      <td className="table-cell">
                        <div className="flex items-center space-x-2">
                          <button onClick={() => { setEditingRecord(ins); setShowAddModal(true); }} className="p-1 text-gray-600 hover:bg-gray-100 rounded"><Edit className="h-4 w-4" /></button>
                          <button onClick={() => { if (confirm('Delete this inspection record?')) deleteInspection(ins.id); }} className="p-1 text-danger-600 hover:bg-danger-50 rounded"><Trash2 className="h-4 w-4" /></button>
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
            <div className="modal-panel max-w-xl">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h3 className="text-lg font-medium">{editingRecord ? 'Edit' : 'Add'} Inspection Record</h3>
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
                      <label className="form-label">Inspection Date *</label>
                      <input name="inspectionDate" type="date" required defaultValue={editingRecord?.inspectionDate || new Date().toISOString().split('T')[0]} className="input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Expiry Date *</label>
                      <input name="expiryDate" type="date" required defaultValue={editingRecord?.expiryDate} className="input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Result *</label>
                      <select name="result" required defaultValue={editingRecord?.result || 'pass'} className="select">
                        <option value="pass">Pass</option>
                        <option value="fail">Fail</option>
                        <option value="conditional">Conditional</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Inspection Centre *</label>
                      <input name="center" type="text" required defaultValue={editingRecord?.center} className="input" placeholder="e.g. Fahas, Tajdeed VTC, ADNOC VIC" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Centre Location</label>
                      <input name="centerLocation" type="text" defaultValue={editingRecord?.centerLocation} className="input" placeholder="e.g. Dubai, Riyadh" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Cost ({currency})</label>
                      <input name="cost" type="number" min="0" step="0.01" defaultValue={editingRecord?.cost} className="input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Certificate Number</label>
                      <input name="certificateNumber" type="text" defaultValue={editingRecord?.certificateNumber} className="input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Next Inspection Date</label>
                      <input name="nextInspectionDate" type="date" defaultValue={editingRecord?.nextInspectionDate} className="input" />
                    </div>
                  </div>
                  <div className="form-group mt-2">
                    <label className="form-label">Notes</label>
                    <textarea name="notes" rows={3} defaultValue={editingRecord?.notes} className="input resize-none" />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary mr-3">Cancel</button>
                  <button type="submit" className="btn-primary">{editingRecord ? 'Update' : 'Add'} Inspection</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
