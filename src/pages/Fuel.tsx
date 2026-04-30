import { useState } from 'react';
import { Plus, Search, Fuel, Edit, Trash2, TrendingUp } from 'lucide-react';
import { useVehicleStore } from '../store/vehicleStore';
import { formatCurrency, formatDate, calculateAverageConsumption } from '../utils/helpers';
import type { FuelRecord } from '../types';

export default function FuelPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FuelRecord | null>(null);

  const { companies, currentCompanyId, vehicles, fuelRecords, addFuelRecord, updateFuelRecord, deleteFuelRecord } = useVehicleStore();

  const currentCompany = companies.find((c) => c.id === currentCompanyId);
  const currency = currentCompany?.currency || 'AED';

  const companyVehicleIds = currentCompanyId
    ? vehicles.filter((v) => v.companyId === currentCompanyId).map((v) => v.id)
    : vehicles.map((v) => v.id);

  const filtered = fuelRecords
    .filter((r) => {
      const vehicle = vehicles.find((v) => v.id === r.vehicleId);
      const matchSearch =
        (vehicle?.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        r.station.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.fuelCardId?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      return companyVehicleIds.includes(r.vehicleId) && matchSearch;
    })
    .sort((a, b) => new Date(b.fuelDate).getTime() - new Date(a.fuelDate).getTime());

  const totalCost = filtered.reduce((s, r) => s + r.totalCost, 0);
  const totalLiters = filtered.reduce((s, r) => s + r.liters, 0);
  const avgPrice = totalLiters > 0 ? totalCost / totalLiters : 0;

  // 按车辆计算平均油耗
  const vehicleConsumptions = companyVehicleIds.map((vid) => {
    const vRecords = fuelRecords.filter((r) => r.vehicleId === vid);
    const vehicle = vehicles.find((v) => v.id === vid);
    const avg = calculateAverageConsumption(vRecords);
    return { vehicle, avg };
  }).filter((v) => v.avg > 0);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const liters = parseFloat(fd.get('liters') as string) || 0;
    const pricePerLiter = parseFloat(fd.get('pricePerLiter') as string) || 0;
    const data = {
      companyId: currentCompanyId || companies[0]?.id || '',
      vehicleId: fd.get('vehicleId') as string,
      fuelDate: fd.get('fuelDate') as string,
      mileage: parseInt(fd.get('mileage') as string) || 0,
      liters,
      pricePerLiter,
      totalCost: liters * pricePerLiter,
      station: fd.get('station') as string,
      fuelCardId: (fd.get('fuelCardId') as string) || undefined,
      receiptNumber: (fd.get('receiptNumber') as string) || undefined,
      fullTank: fd.get('fullTank') === 'on',
      notes: (fd.get('notes') as string) || undefined,
      createdBy: 'Admin',
    };
    if (editingRecord) {
      updateFuelRecord(editingRecord.id, data);
    } else {
      addFuelRecord(data);
    }
    setShowAddModal(false);
    setEditingRecord(null);
  };

  const companyVehicles = currentCompanyId ? vehicles.filter((v) => v.companyId === currentCompanyId) : vehicles;

  return (
    <div>
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Fuel Management</h1>
          <p className="page-description">Track fuel consumption and costs</p>
        </div>
        <button onClick={() => { setEditingRecord(null); setShowAddModal(true); }} className="btn-primary mt-4 sm:mt-0">
          <Plus className="h-4 w-4 mr-2" />Add Fuel Record
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="card p-4 flex items-center">
          <div className="p-3 bg-success-50 rounded-lg mr-4"><Fuel className="h-5 w-5 text-success-600" /></div>
          <div>
            <p className="text-sm text-gray-500">Total Cost</p>
            <p className="text-xl font-bold">{formatCurrency(totalCost, currency)}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center">
          <div className="p-3 bg-primary-50 rounded-lg mr-4"><Fuel className="h-5 w-5 text-primary-600" /></div>
          <div>
            <p className="text-sm text-gray-500">Total Liters</p>
            <p className="text-xl font-bold">{totalLiters.toFixed(1)} L</p>
          </div>
        </div>
        <div className="card p-4 flex items-center">
          <div className="p-3 bg-warning-50 rounded-lg mr-4"><TrendingUp className="h-5 w-5 text-warning-600" /></div>
          <div>
            <p className="text-sm text-gray-500">Avg Price / L</p>
            <p className="text-xl font-bold">{formatCurrency(avgPrice, currency)}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center">
          <div className="p-3 bg-gray-100 rounded-lg mr-4"><Fuel className="h-5 w-5 text-gray-600" /></div>
          <div>
            <p className="text-sm text-gray-500">Records</p>
            <p className="text-xl font-bold">{filtered.length}</p>
          </div>
        </div>
      </div>

      {/* Average Consumption per Vehicle */}
      {vehicleConsumptions.length > 0 && (
        <div className="card mb-6">
          <div className="card-header">
            <h3 className="text-base font-medium text-gray-900">Average Fuel Consumption by Vehicle</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {vehicleConsumptions.map(({ vehicle, avg }) => (
                <div key={vehicle?.id} className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">{vehicle?.plateNumber}</p>
                  <p className="text-xs text-gray-500">{vehicle?.brand} {vehicle?.model}</p>
                  <p className={`text-lg font-bold mt-1 ${avg > 15 ? 'text-danger-600' : avg > 10 ? 'text-warning-600' : 'text-success-600'}`}>
                    {avg.toFixed(1)} L/100km
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input type="text" placeholder="Search by plate, station, or fuel card..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input pl-10" />
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
                <th className="table-header-cell">Mileage</th>
                <th className="table-header-cell">Liters</th>
                <th className="table-header-cell">Price/L</th>
                <th className="table-header-cell">Total Cost</th>
                <th className="table-header-cell">Station</th>
                <th className="table-header-cell">Full Tank</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="table-cell text-center py-8 text-gray-500">No fuel records found</td></tr>
              ) : (
                filtered.map((r) => {
                  const vehicle = vehicles.find((v) => v.id === r.vehicleId);
                  return (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="table-cell">{formatDate(r.fuelDate)}</td>
                      <td className="table-cell">
                        <div className="font-medium">{vehicle?.plateNumber || '-'}</div>
                        <div className="text-xs text-gray-500">{vehicle ? `${vehicle.brand} ${vehicle.model}` : ''}</div>
                      </td>
                      <td className="table-cell">{r.mileage.toLocaleString()} km</td>
                      <td className="table-cell">{r.liters.toFixed(1)} L</td>
                      <td className="table-cell">{formatCurrency(r.pricePerLiter, currency)}</td>
                      <td className="table-cell font-medium">{formatCurrency(r.totalCost, currency)}</td>
                      <td className="table-cell">{r.station}</td>
                      <td className="table-cell">
                        <span className={`badge ${r.fullTank ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-600'}`}>
                          {r.fullTank ? 'Yes' : 'Partial'}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center space-x-2">
                          <button onClick={() => { setEditingRecord(r); setShowAddModal(true); }} className="p-1 text-gray-600 hover:bg-gray-100 rounded"><Edit className="h-4 w-4" /></button>
                          <button onClick={() => { if (confirm('Delete this fuel record?')) deleteFuelRecord(r.id); }} className="p-1 text-danger-600 hover:bg-danger-50 rounded"><Trash2 className="h-4 w-4" /></button>
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
            <div className="modal-panel">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h3 className="text-lg font-medium">{editingRecord ? 'Edit' : 'Add'} Fuel Record</h3>
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
                      <label className="form-label">Date *</label>
                      <input name="fuelDate" type="date" required defaultValue={editingRecord?.fuelDate || new Date().toISOString().split('T')[0]} className="input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Mileage (km) *</label>
                      <input name="mileage" type="number" min="0" required defaultValue={editingRecord?.mileage} className="input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Liters *</label>
                      <input name="liters" type="number" min="0" step="0.01" required defaultValue={editingRecord?.liters} className="input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Price per Liter ({currency}) *</label>
                      <input name="pricePerLiter" type="number" min="0" step="0.001" required defaultValue={editingRecord?.pricePerLiter} className="input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Station *</label>
                      <input name="station" type="text" required defaultValue={editingRecord?.station} className="input" placeholder="e.g. ADNOC, Aramco" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Fuel Card ID</label>
                      <input name="fuelCardId" type="text" defaultValue={editingRecord?.fuelCardId} className="input" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Receipt Number</label>
                      <input name="receiptNumber" type="text" defaultValue={editingRecord?.receiptNumber} className="input" />
                    </div>
                  </div>
                  <div className="form-group mt-2 flex items-center">
                    <input name="fullTank" type="checkbox" id="fullTank" defaultChecked={editingRecord?.fullTank} className="h-4 w-4 text-primary-600 border-gray-300 rounded mr-2" />
                    <label htmlFor="fullTank" className="text-sm text-gray-700">Full Tank</label>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Notes</label>
                    <textarea name="notes" rows={2} defaultValue={editingRecord?.notes} className="input resize-none" />
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
