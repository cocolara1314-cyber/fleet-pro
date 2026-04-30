import { useState } from 'react';
import { Plus, Search, Filter, Wrench, Edit, Trash2 } from 'lucide-react';
import { useVehicleStore } from '../store/vehicleStore';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '../utils/helpers';
import type { Maintenance, MaintenanceItem } from '../types';

export default function MaintenancePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'routine' | 'repair' | 'inspection'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Maintenance | null>(null);
  const [items, setItems] = useState<MaintenanceItem[]>([{ name: '', cost: 0 }]);

  const {
    companies,
    currentCompanyId,
    vehicles,
    maintenances,
    addMaintenance,
    updateMaintenance,
    deleteMaintenance,
  } = useVehicleStore();

  const currentCompany = companies.find((c) => c.id === currentCompanyId);
  const currency = currentCompany?.currency || 'AED';

  const companyVehicleIds = currentCompanyId
    ? vehicles.filter((v) => v.companyId === currentCompanyId).map((v) => v.id)
    : vehicles.map((v) => v.id);

  const filtered = maintenances
    .filter((m) => {
      const vehicle = vehicles.find((v) => v.id === m.vehicleId);
      const matchSearch =
        (vehicle?.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        m.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.items.some((i) => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchType = typeFilter === 'all' || m.type === typeFilter;
      return companyVehicleIds.includes(m.vehicleId) && matchSearch && matchType;
    })
    .sort((a, b) => new Date(b.maintenanceDate).getTime() - new Date(a.maintenanceDate).getTime());

  const totalCost = filtered.reduce((s, m) => s + m.totalCost, 0);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const validItems = items.filter((i) => i.name.trim());
    const data = {
      vehicleId: fd.get('vehicleId') as string,
      maintenanceDate: fd.get('maintenanceDate') as string,
      mileage: parseInt(fd.get('mileage') as string) || 0,
      type: fd.get('type') as 'routine' | 'repair' | 'inspection',
      items: validItems,
      totalCost: validItems.reduce((s, i) => s + Number(i.cost), 0),
      provider: fd.get('provider') as string,
      providerPhone: fd.get('providerPhone') as string,
      notes: fd.get('notes') as string,
      nextMaintenanceDate: (fd.get('nextMaintenanceDate') as string) || undefined,
      nextMaintenanceMileage: fd.get('nextMaintenanceMileage') ? parseInt(fd.get('nextMaintenanceMileage') as string) : undefined,
      performedBy: fd.get('performedBy') as string,
    };
    if (editingRecord) {
      updateMaintenance(editingRecord.id, data);
    } else {
      addMaintenance(data);
    }
    setShowAddModal(false);
    setEditingRecord(null);
    setItems([{ name: '', cost: 0 }]);
  };

  const openEdit = (r: Maintenance) => {
    setEditingRecord(r);
    setItems(r.items.length ? r.items : [{ name: '', cost: 0 }]);
    setShowAddModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this maintenance record?')) deleteMaintenance(id);
  };

  const addItem = () => setItems([...items, { name: '', cost: 0 }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: keyof MaintenanceItem, value: string | number) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: field === 'cost' ? Number(value) : value };
    setItems(updated);
  };

  const companyVehicles = currentCompanyId
    ? vehicles.filter((v) => v.companyId === currentCompanyId)
    : vehicles;

  return (
    <div>
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Maintenance</h1>
          <p className="page-description">Track all vehicle maintenance records</p>
        </div>
        <button onClick={() => { setEditingRecord(null); setItems([{ name: '', cost: 0 }]); setShowAddModal(true); }} className="btn-primary mt-4 sm:mt-0">
          <Plus className="h-4 w-4 mr-2" />Add Maintenance
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-4 flex items-center">
          <div className="p-3 bg-primary-50 rounded-lg mr-4">
            <Wrench className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Records</p>
            <p className="text-2xl font-bold">{filtered.length}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center">
          <div className="p-3 bg-success-50 rounded-lg mr-4">
            <Wrench className="h-5 w-5 text-success-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Cost</p>
            <p className="text-2xl font-bold">{formatCurrency(totalCost, currency)}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center">
          <div className="p-3 bg-warning-50 rounded-lg mr-4">
            <Wrench className="h-5 w-5 text-warning-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Avg per Record</p>
            <p className="text-2xl font-bold">{filtered.length ? formatCurrency(totalCost / filtered.length, currency) : formatCurrency(0, currency)}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input type="text" placeholder="Search by plate, provider, item..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input pl-10" />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)} className="select w-40">
            <option value="all">All Types</option>
            <option value="routine">Routine</option>
            <option value="repair">Repair</option>
            <option value="inspection">Inspection</option>
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
                <th className="table-header-cell">Type</th>
                <th className="table-header-cell">Items</th>
                <th className="table-header-cell">Provider</th>
                <th className="table-header-cell">Mileage</th>
                <th className="table-header-cell">Cost</th>
                <th className="table-header-cell">Next Due</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="table-cell text-center py-8 text-gray-500">No maintenance records found</td></tr>
              ) : (
                filtered.map((m) => {
                  const vehicle = vehicles.find((v) => v.id === m.vehicleId);
                  return (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="table-cell">{formatDate(m.maintenanceDate)}</td>
                      <td className="table-cell">
                        <div className="font-medium">{vehicle?.plateNumber || '-'}</div>
                        <div className="text-xs text-gray-500">{vehicle ? `${vehicle.brand} ${vehicle.model}` : ''}</div>
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${getStatusColor(m.type)}`}>{getStatusLabel(m.type)}</span>
                      </td>
                      <td className="table-cell max-w-xs truncate">{m.items.map((i) => i.name).join(', ')}</td>
                      <td className="table-cell">{m.provider}</td>
                      <td className="table-cell">{m.mileage.toLocaleString()} km</td>
                      <td className="table-cell font-medium">{formatCurrency(m.totalCost, currency)}</td>
                      <td className="table-cell">{m.nextMaintenanceDate ? formatDate(m.nextMaintenanceDate) : '-'}</td>
                      <td className="table-cell">
                        <div className="flex items-center space-x-2">
                          <button onClick={() => openEdit(m)} className="p-1 text-gray-600 hover:bg-gray-100 rounded"><Edit className="h-4 w-4" /></button>
                          <button onClick={() => handleDelete(m.id)} className="p-1 text-danger-600 hover:bg-danger-50 rounded"><Trash2 className="h-4 w-4" /></button>
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
                  <h3 className="text-lg font-medium">{editingRecord ? 'Edit' : 'Add'} Maintenance Record</h3>
                </div>
                <div className="modal-body space-y-4 max-h-[70vh] overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">Vehicle *</label>
                      <select name="vehicleId" required defaultValue={editingRecord?.vehicleId || ''} className="select">
                        <option value="">Select Vehicle</option>
                        {companyVehicles.map((v) => (
                          <option key={v.id} value={v.id}>{v.plateNumber} - {v.brand} {v.model}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Date *</label>
                      <input name="maintenanceDate" type="date" required defaultValue={editingRecord?.maintenanceDate || new Date().toISOString().split('T')[0]} className="input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Type *</label>
                      <select name="type" required defaultValue={editingRecord?.type || 'routine'} className="select">
                        <option value="routine">Routine</option>
                        <option value="repair">Repair</option>
                        <option value="inspection">Inspection</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Mileage (km)</label>
                      <input name="mileage" type="number" min="0" defaultValue={editingRecord?.mileage} className="input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Provider *</label>
                      <input name="provider" type="text" required defaultValue={editingRecord?.provider} className="input" placeholder="Service center name" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Provider Phone</label>
                      <input name="providerPhone" type="tel" defaultValue={editingRecord?.providerPhone} className="input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Next Maintenance Date</label>
                      <input name="nextMaintenanceDate" type="date" defaultValue={editingRecord?.nextMaintenanceDate} className="input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Next Maintenance Mileage (km)</label>
                      <input name="nextMaintenanceMileage" type="number" min="0" defaultValue={editingRecord?.nextMaintenanceMileage} className="input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Performed By</label>
                      <input name="performedBy" type="text" defaultValue={editingRecord?.performedBy} className="input" />
                    </div>
                  </div>

                  {/* Items */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="form-label mb-0">Maintenance Items *</label>
                      <button type="button" onClick={addItem} className="btn-secondary btn-sm">+ Add Item</button>
                    </div>
                    <div className="space-y-2">
                      {items.map((item, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updateItem(idx, 'name', e.target.value)}
                            placeholder="Item name (e.g. Oil Change)"
                            className="input flex-1"
                          />
                          <input
                            type="number"
                            value={item.cost}
                            min="0"
                            step="0.01"
                            onChange={(e) => updateItem(idx, 'cost', e.target.value)}
                            placeholder="Cost"
                            className="input w-32"
                          />
                          {items.length > 1 && (
                            <button type="button" onClick={() => removeItem(idx)} className="p-1 text-danger-600 hover:bg-danger-50 rounded">✕</button>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Total: <strong>{formatCurrency(items.reduce((s, i) => s + Number(i.cost), 0), currency)}</strong>
                    </p>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Notes</label>
                    <textarea name="notes" rows={3} defaultValue={editingRecord?.notes} className="input resize-none" />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary mr-3">Cancel</button>
                  <button type="submit" className="btn-primary">{editingRecord ? 'Update' : 'Add'} Record</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
