import { useState } from 'react';
import { Plus, Search, Edit, Trash2, Phone, Mail, Calendar, CreditCard } from 'lucide-react';
import { useVehicleStore } from '../store/vehicleStore';
import { formatDate, getStatusColor, getStatusLabel } from '../utils/helpers';
import type { Driver } from '../types';

export default function Drivers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  
  const { 
    companies, 
    currentCompanyId, 
    drivers, 
    addDriver, 
    updateDriver, 
    deleteDriver 
  } = useVehicleStore();
  
  const companyDrivers = currentCompanyId 
    ? drivers.filter(d => d.companyId === currentCompanyId)
    : drivers;
  
  const filteredDrivers = companyDrivers.filter((driver) => {
    const matchesSearch = 
      driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.phone.includes(searchTerm) ||
      (driver.email && driver.email.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const handleAddDriver = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const driverData = {
      companyId: currentCompanyId || companies[0]?.id || '',
      name: formData.get('name') as string,
      employeeId: formData.get('employeeId') as string,
      licenseNumber: formData.get('licenseNumber') as string,
      licenseIssueDate: formData.get('licenseIssueDate') as string,
      licenseExpiryDate: formData.get('licenseExpiryDate') as string,
      licenseType: (formData.get('licenseType') as string).split(',').filter(Boolean),
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      nationality: formData.get('nationality') as string,
      dateOfBirth: formData.get('dateOfBirth') as string,
      joinDate: formData.get('joinDate') as string,
      status: (formData.get('status') as 'active' | 'inactive') || 'active',
    };
    
    if (editingDriver) {
      updateDriver(editingDriver.id, driverData);
    } else {
      addDriver(driverData);
    }
    
    setShowAddModal(false);
    setEditingDriver(null);
  };

  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setShowAddModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this driver?')) {
      deleteDriver(id);
    }
  };

  const isLicenseExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiry <= thirtyDaysFromNow && expiry >= new Date();
  };

  const isLicenseExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  return (
    <div>
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Drivers</h1>
          <p className="page-description">Manage your fleet drivers</p>
        </div>
        <button
          onClick={() => {
            setEditingDriver(null);
            setShowAddModal(true);
          }}
          className="btn-primary mt-4 sm:mt-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Driver
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, license number, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Drivers Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Driver</th>
                <th className="table-header-cell">License</th>
                <th className="table-header-cell">License Expiry</th>
                <th className="table-header-cell">Contact</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {filteredDrivers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-cell text-center py-8 text-gray-500">
                    No drivers found
                  </td>
                </tr>
              ) : (
                filteredDrivers.map((driver) => (
                  <tr key={driver.id} className="hover:bg-gray-50">
                    <td className="table-cell">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-600 font-medium">
                            {driver.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">{driver.name}</div>
                          {driver.employeeId && (
                            <div className="text-sm text-gray-500">ID: {driver.employeeId}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center">
                        <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
                        {driver.licenseNumber}
                      </div>
                      {driver.licenseType.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          Types: {driver.licenseType.join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="table-cell">
                      <div className={`flex items-center ${
                        isLicenseExpired(driver.licenseExpiryDate) ? 'text-danger-600' :
                        isLicenseExpiringSoon(driver.licenseExpiryDate) ? 'text-warning-600' : ''
                      }`}>
                        <Calendar className="h-4 w-4 mr-2" />
                        {formatDate(driver.licenseExpiryDate)}
                      </div>
                      {isLicenseExpired(driver.licenseExpiryDate) && (
                        <span className="badge bg-danger-100 text-danger-800 mt-1">Expired</span>
                      )}
                      {isLicenseExpiringSoon(driver.licenseExpiryDate) && (
                        <span className="badge bg-warning-100 text-warning-800 mt-1">Expiring Soon</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center mb-1">
                        <Phone className="h-4 w-4 text-gray-400 mr-2" />
                        {driver.phone}
                      </div>
                      {driver.email && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Mail className="h-4 w-4 text-gray-400 mr-2" />
                          {driver.email}
                        </div>
                      )}
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${getStatusColor(driver.status)}`}>
                        {getStatusLabel(driver.status)}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(driver)}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(driver.id)}
                          className="p-1 text-danger-600 hover:bg-danger-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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
              <form onSubmit={handleAddDriver}>
                <div className="modal-header">
                  <h3 className="text-lg font-medium text-gray-900">
                    {editingDriver ? 'Edit Driver' : 'Add New Driver'}
                  </h3>
                </div>
                <div className="modal-body">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">Full Name *</label>
                      <input
                        name="name"
                        type="text"
                        required
                        defaultValue={editingDriver?.name}
                        className="input"
                        placeholder="e.g., Ahmed Mohammed"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Employee ID</label>
                      <input
                        name="employeeId"
                        type="text"
                        defaultValue={editingDriver?.employeeId}
                        className="input"
                        placeholder="e.g., EMP001"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">License Number *</label>
                      <input
                        name="licenseNumber"
                        type="text"
                        required
                        defaultValue={editingDriver?.licenseNumber}
                        className="input"
                        placeholder="e.g., 12345678"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">License Types</label>
                      <input
                        name="licenseType"
                        type="text"
                        defaultValue={editingDriver?.licenseType.join(', ')}
                        className="input"
                        placeholder="e.g., Light, Heavy (comma separated)"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">License Issue Date</label>
                      <input
                        name="licenseIssueDate"
                        type="date"
                        defaultValue={editingDriver?.licenseIssueDate}
                        className="input"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">License Expiry Date *</label>
                      <input
                        name="licenseExpiryDate"
                        type="date"
                        required
                        defaultValue={editingDriver?.licenseExpiryDate}
                        className="input"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Phone *</label>
                      <input
                        name="phone"
                        type="tel"
                        required
                        defaultValue={editingDriver?.phone}
                        className="input"
                        placeholder="e.g., +966 50 123 4567"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input
                        name="email"
                        type="email"
                        defaultValue={editingDriver?.email}
                        className="input"
                        placeholder="e.g., driver@company.com"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Nationality</label>
                      <input
                        name="nationality"
                        type="text"
                        defaultValue={editingDriver?.nationality}
                        className="input"
                        placeholder="e.g., Saudi"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Date of Birth</label>
                      <input
                        name="dateOfBirth"
                        type="date"
                        defaultValue={editingDriver?.dateOfBirth}
                        className="input"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Join Date *</label>
                      <input
                        name="joinDate"
                        type="date"
                        required
                        defaultValue={editingDriver?.joinDate || new Date().toISOString().split('T')[0]}
                        className="input"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Status</label>
                      <select
                        name="status"
                        defaultValue={editingDriver?.status || 'active'}
                        className="select"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
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
                    {editingDriver ? 'Update' : 'Add'} Driver
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
