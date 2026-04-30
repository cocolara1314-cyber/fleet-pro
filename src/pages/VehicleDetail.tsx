import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Car, 
  Edit, 
  Wrench, 
  Shield, 
  AlertTriangle,
  Fuel,
  ClipboardCheck,
  Settings,
  User,
  Calendar,
  Gauge
} from 'lucide-react';
import { useVehicleStore } from '../store/vehicleStore';
import { 
  formatCurrency, 
  getStatusColor, 
  getStatusLabel, 
  formatDate,
  getVehicleAge,
  calculateAverageConsumption
} from '../utils/helpers';

export default function VehicleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'maintenance' | 'insurance' | 'fines' | 'repairs' | 'fuel'>('overview');
  
  const { 
    companies,
    vehicles, 
    drivers,
    maintenances,
    insurances,
    fines,
    repairs,
    fuelRecords,
    inspections,
    getVehicleById,
    getVehicleMaintenances,
    getVehicleInsurances,
    getVehicleFines,
    getVehicleRepairs,
    getVehicleFuelRecords,
    getVehicleInspections
  } = useVehicleStore();

  const vehicle = id ? getVehicleById(id) : undefined;
  const driver = vehicle?.assignedDriverId ? drivers.find(d => d.id === vehicle.assignedDriverId) : null;
  const company = vehicle ? companies.find(c => c.id === vehicle.companyId) : null;
  
  const vehicleMaintenances = vehicle ? getVehicleMaintenances(vehicle.id) : [];
  const vehicleInsurances = vehicle ? getVehicleInsurances(vehicle.id) : [];
  const vehicleFines = vehicle ? getVehicleFines(vehicle.id) : [];
  const vehicleRepairs = vehicle ? getVehicleRepairs(vehicle.id) : [];
  const vehicleFuelRecords = vehicle ? getVehicleFuelRecords(vehicle.id) : [];
  const vehicleInspections = vehicle ? getVehicleInspections(vehicle.id) : [];

  if (!vehicle) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Vehicle not found</p>
        <button onClick={() => navigate('/vehicles')} className="btn-primary mt-4">
          Back to Vehicles
        </button>
      </div>
    );
  }

  const currency = company?.currency || 'AED';
  const avgConsumption = calculateAverageConsumption(vehicleFuelRecords);
  
  // 计算总成本
  const totalMaintenanceCost = vehicleMaintenances.reduce((sum, m) => sum + m.totalCost, 0);
  const totalInsuranceCost = vehicleInsurances.reduce((sum, i) => sum + i.premium, 0);
  const totalFineCost = vehicleFines.reduce((sum, f) => sum + (f.paidAmount || f.amount), 0);
  const totalRepairCost = vehicleRepairs.reduce((sum, r) => sum + (r.actualCost || 0), 0);
  const totalFuelCost = vehicleFuelRecords.reduce((sum, f) => sum + f.totalCost, 0);
  const totalCost = vehicle.purchasePrice + totalMaintenanceCost + totalInsuranceCost + totalFineCost + totalRepairCost + totalFuelCost;

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Car },
    { id: 'maintenance', name: 'Maintenance', icon: Wrench },
    { id: 'insurance', name: 'Insurance', icon: Shield },
    { id: 'fines', name: 'Fines', icon: AlertTriangle },
    { id: 'repairs', name: 'Repairs', icon: Settings },
    { id: 'fuel', name: 'Fuel', icon: Fuel },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/vehicles')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Vehicles
        </button>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center">
            <div className="h-16 w-16 rounded-xl bg-primary-100 flex items-center justify-center">
              <Car className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {vehicle.brand} {vehicle.model}
              </h1>
              <div className="flex items-center mt-1 space-x-3">
                <span className="text-lg font-medium text-gray-600">{vehicle.plateNumber}</span>
                <span className={`badge ${getStatusColor(vehicle.status)}`}>
                  {getStatusLabel(vehicle.status)}
                </span>
                <span className="text-sm text-gray-500">({vehicle.plateCountry})</span>
              </div>
            </div>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button
              onClick={() => navigate(`/vehicles/${vehicle.id}/edit`)}
              className="btn-secondary"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs mb-6">
        <nav className="tab-list">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={activeTab === tab.id ? 'tab-active' : 'tab-inactive'}
            >
              <tab.icon className="h-4 w-4 mr-2 inline" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Vehicle Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <div className="card-body">
                <h3 className="text-sm font-medium text-gray-500 mb-4">Vehicle Information</h3>
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">VIN</dt>
                    <dd className="text-sm font-medium text-gray-900">{vehicle.vin}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Year</dt>
                    <dd className="text-sm font-medium text-gray-900">{vehicle.year}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Color</dt>
                    <dd className="text-sm font-medium text-gray-900">{vehicle.color || '-'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Fuel Type</dt>
                    <dd className="text-sm font-medium text-gray-900">{getStatusLabel(vehicle.fuelType)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Age</dt>
                    <dd className="text-sm font-medium text-gray-900">{getVehicleAge(vehicle.year)} years</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Department</dt>
                    <dd className="text-sm font-medium text-gray-900">{vehicle.department || '-'}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <h3 className="text-sm font-medium text-gray-500 mb-4">Assignment</h3>
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Driver</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {driver ? driver.name : <span className="text-gray-400">Unassigned</span>}
                    </dd>
                  </div>
                  {driver && (
                    <>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500">License</dt>
                        <dd className="text-sm font-medium text-gray-900">{driver.licenseNumber}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500">License Expiry</dt>
                        <dd className="text-sm font-medium text-gray-900">{formatDate(driver.licenseExpiryDate)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-500">Phone</dt>
                        <dd className="text-sm font-medium text-gray-900">{driver.phone}</dd>
                      </div>
                    </>
                  )}
                </dl>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <h3 className="text-sm font-medium text-gray-500 mb-4">Financial Summary</h3>
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Purchase Price</dt>
                    <dd className="text-sm font-medium text-gray-900">{formatCurrency(vehicle.purchasePrice, currency)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Total Maintenance</dt>
                    <dd className="text-sm font-medium text-gray-900">{formatCurrency(totalMaintenanceCost, currency)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Total Insurance</dt>
                    <dd className="text-sm font-medium text-gray-900">{formatCurrency(totalInsuranceCost, currency)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Total Fines</dt>
                    <dd className="text-sm font-medium text-gray-900">{formatCurrency(totalFineCost, currency)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Total Repairs</dt>
                    <dd className="text-sm font-medium text-gray-900">{formatCurrency(totalRepairCost, currency)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Total Fuel</dt>
                    <dd className="text-sm font-medium text-gray-900">{formatCurrency(totalFuelCost, currency)}</dd>
                  </div>
                  <div className="flex justify-between pt-3 border-t">
                    <dt className="text-sm font-medium text-gray-900">Total Cost of Ownership</dt>
                    <dd className="text-sm font-bold text-primary-600">{formatCurrency(totalCost, currency)}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          {/* Mileage & Fuel Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <div className="card-body flex items-center">
                <div className="p-3 bg-primary-50 rounded-lg">
                  <Gauge className="h-6 w-6 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Current Mileage</p>
                  <p className="text-2xl font-bold text-gray-900">{vehicle.currentMileage.toLocaleString()} km</p>
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="card-body flex items-center">
                <div className="p-3 bg-success-50 rounded-lg">
                  <Fuel className="h-6 w-6 text-success-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Average Fuel Consumption</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {avgConsumption > 0 ? `${avgConsumption.toFixed(1)} L/100km` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {vehicleMaintenances.slice(0, 2).map((m) => (
                  <div key={m.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <Wrench className="h-5 w-5 text-primary-600 mr-3" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Maintenance - {formatDate(m.maintenanceDate)}</p>
                      <p className="text-sm text-gray-500">{m.items.map(i => i.name).join(', ')}</p>
                    </div>
                    <span className="font-medium text-gray-900">{formatCurrency(m.totalCost, currency)}</span>
                  </div>
                ))}
                
                {vehicleFuelRecords.slice(0, 2).map((f) => (
                  <div key={f.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <Fuel className="h-5 w-5 text-success-600 mr-3" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Fuel - {formatDate(f.fuelDate)}</p>
                      <p className="text-sm text-gray-500">{f.liters}L @ {f.station}</p>
                    </div>
                    <span className="font-medium text-gray-900">{formatCurrency(f.totalCost, currency)}</span>
                  </div>
                ))}
                
                {vehicleMaintenances.length === 0 && vehicleFuelRecords.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No recent activity</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'maintenance' && (
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Maintenance History</h3>
            <span className="badge bg-primary-100 text-primary-800">{vehicleMaintenances.length} records</span>
          </div>
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Date</th>
                  <th className="table-header-cell">Mileage</th>
                  <th className="table-header-cell">Type</th>
                  <th className="table-header-cell">Items</th>
                  <th className="table-header-cell">Provider</th>
                  <th className="table-header-cell">Cost</th>
                  <th className="table-header-cell">Next Due</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {vehicleMaintenances.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="table-cell text-center py-8 text-gray-500">
                      No maintenance records
                    </td>
                  </tr>
                ) : (
                  vehicleMaintenances.map((m) => (
                    <tr key={m.id}>
                      <td className="table-cell">{formatDate(m.maintenanceDate)}</td>
                      <td className="table-cell">{m.mileage.toLocaleString()} km</td>
                      <td className="table-cell">
                        <span className={`badge ${getStatusColor(m.type)}`}>
                          {getStatusLabel(m.type)}
                        </span>
                      </td>
                      <td className="table-cell">{m.items.map(i => i.name).join(', ')}</td>
                      <td className="table-cell">{m.provider}</td>
                      <td className="table-cell">{formatCurrency(m.totalCost, currency)}</td>
                      <td className="table-cell">
                        {m.nextMaintenanceDate ? formatDate(m.nextMaintenanceDate) : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'insurance' && (
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Insurance History</h3>
            <span className="badge bg-primary-100 text-primary-800">{vehicleInsurances.length} records</span>
          </div>
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Policy Number</th>
                  <th className="table-header-cell">Company</th>
                  <th className="table-header-cell">Type</th>
                  <th className="table-header-cell">Start Date</th>
                  <th className="table-header-cell">End Date</th>
                  <th className="table-header-cell">Premium</th>
                  <th className="table-header-cell">Status</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {vehicleInsurances.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="table-cell text-center py-8 text-gray-500">
                      No insurance records
                    </td>
                  </tr>
                ) : (
                  vehicleInsurances.map((i) => (
                    <tr key={i.id}>
                      <td className="table-cell">{i.policyNumber}</td>
                      <td className="table-cell">{i.company}</td>
                      <td className="table-cell">{getStatusLabel(i.type)}</td>
                      <td className="table-cell">{formatDate(i.startDate)}</td>
                      <td className="table-cell">{formatDate(i.endDate)}</td>
                      <td className="table-cell">{formatCurrency(i.premium, currency)}</td>
                      <td className="table-cell">
                        <span className={`badge ${getStatusColor(i.status)}`}>
                          {getStatusLabel(i.status)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'fines' && (
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Traffic Fines</h3>
            <span className="badge bg-danger-100 text-danger-800">{vehicleFines.length} records</span>
          </div>
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Date</th>
                  <th className="table-header-cell">Violation</th>
                  <th className="table-header-cell">Location</th>
                  <th className="table-header-cell">Amount</th>
                  <th className="table-header-cell">Status</th>
                  <th className="table-header-cell">Paid Date</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {vehicleFines.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="table-cell text-center py-8 text-gray-500">
                      No fine records
                    </td>
                  </tr>
                ) : (
                  vehicleFines.map((f) => (
                    <tr key={f.id}>
                      <td className="table-cell">{formatDate(f.fineDate)}</td>
                      <td className="table-cell">{getStatusLabel(f.violationType)}</td>
                      <td className="table-cell">{f.location || '-'}</td>
                      <td className="table-cell">{formatCurrency(f.amount, currency)}</td>
                      <td className="table-cell">
                        <span className={`badge ${getStatusColor(f.status)}`}>
                          {getStatusLabel(f.status)}
                        </span>
                      </td>
                      <td className="table-cell">{f.paidDate ? formatDate(f.paidDate) : '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'repairs' && (
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Repair History</h3>
            <span className="badge bg-primary-100 text-primary-800">{vehicleRepairs.length} records</span>
          </div>
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Request Date</th>
                  <th className="table-header-cell">Description</th>
                  <th className="table-header-cell">Priority</th>
                  <th className="table-header-cell">Status</th>
                  <th className="table-header-cell">Provider</th>
                  <th className="table-header-cell">Cost</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {vehicleRepairs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="table-cell text-center py-8 text-gray-500">
                      No repair records
                    </td>
                  </tr>
                ) : (
                  vehicleRepairs.map((r) => (
                    <tr key={r.id}>
                      <td className="table-cell">{formatDate(r.requestDate)}</td>
                      <td className="table-cell">{r.description}</td>
                      <td className="table-cell">
                        <span className={`badge ${getStatusColor(r.priority)}`}>
                          {getStatusLabel(r.priority)}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${getStatusColor(r.status)}`}>
                          {getStatusLabel(r.status)}
                        </span>
                      </td>
                      <td className="table-cell">{r.provider}</td>
                      <td className="table-cell">
                        {r.actualCost ? formatCurrency(r.actualCost, currency) : 
                         r.estimatedCost ? `~${formatCurrency(r.estimatedCost, currency)}` : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'fuel' && (
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Fuel Records</h3>
            <span className="badge bg-success-100 text-success-800">{vehicleFuelRecords.length} records</span>
          </div>
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Date</th>
                  <th className="table-header-cell">Mileage</th>
                  <th className="table-header-cell">Liters</th>
                  <th className="table-header-cell">Price/Liter</th>
                  <th className="table-header-cell">Total Cost</th>
                  <th className="table-header-cell">Station</th>
                  <th className="table-header-cell">Full Tank</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {vehicleFuelRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="table-cell text-center py-8 text-gray-500">
                      No fuel records
                    </td>
                  </tr>
                ) : (
                  vehicleFuelRecords.map((f) => (
                    <tr key={f.id}>
                      <td className="table-cell">{formatDate(f.fuelDate)}</td>
                      <td className="table-cell">{f.mileage.toLocaleString()} km</td>
                      <td className="table-cell">{f.liters} L</td>
                      <td className="table-cell">{formatCurrency(f.pricePerLiter, currency)}</td>
                      <td className="table-cell">{formatCurrency(f.totalCost, currency)}</td>
                      <td className="table-cell">{f.station}</td>
                      <td className="table-cell">{f.fullTank ? 'Yes' : 'No'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
