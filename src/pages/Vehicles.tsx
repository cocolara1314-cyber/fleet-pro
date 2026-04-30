import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Car, Edit, Trash2, Eye } from 'lucide-react';
import { useVehicleStore } from '../store/vehicleStore';
import { formatCurrency, getStatusColor, getStatusLabel, getVehicleAge } from '../utils/helpers';
import type { Vehicle, VehicleStatus } from '../types';

const statusOptions: VehicleStatus[] = ['active', 'maintenance', 'inactive', 'retired'];

export default function Vehicles() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  
  const { 
    companies, 
    currentCompanyId, 
    vehicles, 
    drivers,
    addVehicle, 
    updateVehicle, 
    deleteVehicle,
    getCompanyVehicles 
  } = useVehicleStore();

  const currentCompany = companies.find((c) => c.id === currentCompanyId);
  const companyVehicles = currentCompanyId ? getCompanyVehicles(currentCompanyId) : vehicles;
  
  const filteredVehicles = companyVehicles.filter((vehicle) => {
    const matchesSearch = 
      vehicle.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.vin.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddVehicle = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const vehicleData = {
      companyId: currentCompanyId || companies[0]?.id || '',
      plateNumber: formData.get('plateNumber') as string,
      plateCountry: (formData.get('plateCountry') as 'SA' | 'AE') || 'AE',
      brand: formData.get('brand') as string,
      model: formData.get('model') as string,
      year: parseInt(formData.get('year') as string),
      vin: formData.get('vin') as string,
      color: formData.get('color') as string,
      engineNumber: formData.get('engineNumber') as string,
      purchaseDate: formData.get('purchaseDate') as string,
      purchasePrice: parseFloat(formData.get('purchasePrice') as string) || 0,
      currentMileage: parseInt(formData.get('currentMileage') as string) || 0,
      status: (formData.get('status') as VehicleStatus) || 'active',
      assignedDriverId: formData.get('assignedDriverId') as string || undefined,
      department: formData.get('department') as string,
      fuelType: (formData.get('fuelType') as 'petrol' | 'diesel' | 'hybrid' | 'electric') || 'petrol',
    };
    
    if (editingVehicle) {
      updateVehicle(editingVehicle.id, vehicleData);
    } else {
      addVehicle(vehicleData);
    }
    
    setShowAddModal(false);
    setEditingVehicle(null);
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setShowAddModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this vehicle?')) {
      deleteVehicle(id);
    }
  };

  const companyDrivers = currentCompanyId 
    ? drivers.filter(d => d.companyId === currentCompanyId)
    : drivers;

  return (
    <div>
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Vehicles</h1>
          <p className="page-description">Manage your fleet vehicles</p>
        </div>
        <button
          onClick={() => {
            setEditingVehicle(null);
            setShowAddModal(true);
          }}
          className="btn-primary mt-4 sm:mt-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Vehicle
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by plate, brand, model, or VIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as VehicleStatus | 'all')}
            className="select w-40"
          >
            <option value="all">All Status</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>{getStatusLabel(status)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Vehicles Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Vehicle</th>
                <th className="table-header-cell">Plate Number</th>
                <th className="table-header-cell">Driver</th>
                <th className="table-header-cell">Mileage</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Age</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-cell text-center py-8 text-gray-500">
                    No vehicles found
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((vehicle) => {
                  const driver = drivers.find((d) => d.id === vehicle.assignedDriverId);
                  return (
                    <tr key={vehicle.id} className="hover:bg-gray-50">
                      <td className="table-cell">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <Car className="h-5 w-5 text-primary-600" />
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-gray-900">
                              {vehicle.brand} {vehicle.model}
                            </div>
                            <div className="text-sm text-gray-500">{vehicle.year}</div>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="font-medium">{vehicle.plateNumber}</span>
                        <span className="ml-2 text-xs text-gray-500">({vehicle.plateCountry})</span>
                      </td>
                      <td className="table-cell">
                        {driver ? driver.name : <span className="text-gray-400">Unassigned</span>}
                      </td>
                      <td className="table-cell">
                        {vehicle.currentMileage.toLocaleString()} km
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${getStatusColor(vehicle.status)}`}>
                          {getStatusLabel(vehicle.status)}
                        </span>
                      </td>
                      <td className="table-cell">
                        {getVehicleAge(vehicle.year)} years
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                            className="p-1 text-primary-600 hover:bg-primary-50 rounded"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(vehicle)}
                            className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(vehicle.id)}
                            className="p-1 text-danger-600 hover:bg-danger-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="modal-container">
          <div className="modal-overlay" onClick={() => setShowAddModal(false)} />
          <div className="modal-content">
            <div className="modal-panel max-w-2xl">
              <form onSubmit={handleAddVehicle}>
                <div className="modal-header">
                  <h3 className="text-lg font-medium text-gray-900">
                    {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
                  </h3>
                </div>
                <div className="modal-body">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">Plate Number *</label>
                      <input
                        name="plateNumber"
                        type="text"
                        required
                        defaultValue={editingVehicle?.plateNumber}
                        className="input"
                        placeholder="e.g., ABC 1234"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Country *</label>
                      <select
                        name="plateCountry"
                        required
                        defaultValue={editingVehicle?.plateCountry || currentCompany?.country || 'AE'}
                        className="select"
                      >
                        <option value="SA">Saudi Arabia</option>
                        <option value="AE">UAE</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Brand *</label>
                      <input
                        name="brand"
                        type="text"
                        required
                        defaultValue={editingVehicle?.brand}
                        className="input"
                        placeholder="e.g., Toyota"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Model *</label>
                      <input
                        name="model"
                        type="text"
                        required
                        defaultValue={editingVehicle?.model}
                        className="input"
                        placeholder="e.g., Land Cruiser"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Year *</label>
                      <input
                        name="year"
                        type="number"
                        required
                        min="1990"
                        max={new Date().getFullYear() + 1}
                        defaultValue={editingVehicle?.year || new Date().getFullYear()}
                        className="input"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">VIN *</label>
                      <input
                        name="vin"
                        type="text"
                        required
                        minLength={17}
                        maxLength={17}
                        defaultValue={editingVehicle?.vin}
                        className="input"
                        placeholder="17 characters"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Color</label>
                      <input
                        name="color"
                        type="text"
                        defaultValue={editingVehicle?.color}
                        className="input"
                        placeholder="e.g., White"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Fuel Type</label>
                      <select
                        name="fuelType"
                        defaultValue={editingVehicle?.fuelType || 'petrol'}
                        className="select"
                      >
                        <option value="petrol">Petrol</option>
                        <option value="diesel">Diesel</option>
                        <option value="hybrid">Hybrid</option>
                        <option value="electric">Electric</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Purchase Date</label>
                      <input
                        name="purchaseDate"
                        type="date"
                        defaultValue={editingVehicle?.purchaseDate}
                        className="input"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Purchase Price ({currentCompany?.currency || 'AED'})</label>
                      <input
                        name="purchasePrice"
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={editingVehicle?.purchasePrice}
                        className="input"
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Current Mileage (km)</label>
                      <input
                        name="currentMileage"
                        type="number"
                        min="0"
                        defaultValue={editingVehicle?.currentMileage}
                        className="input"
                        placeholder="0"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Status</label>
                      <select
                        name="status"
                        defaultValue={editingVehicle?.status || 'active'}
                        className="select"
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>{getStatusLabel(status)}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Assigned Driver</label>
                      <select
                        name="assignedDriverId"
                        defaultValue={editingVehicle?.assignedDriverId || ''}
                        className="select"
                      >
                        <option value="">Unassigned</option>
                        {companyDrivers.map((driver) => (
                          <option key={driver.id} value={driver.id}>{driver.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Department</label>
                      <input
                        name="department"
                        type="text"
                        defaultValue={editingVehicle?.department}
                        className="input"
                        placeholder="e.g., Operations"
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="btn-secondary mr-3"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingVehicle ? 'Update' : 'Add'} Vehicle
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
