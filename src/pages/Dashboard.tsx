import { useEffect, useState } from 'react';
import { 
  Car, 
  Users, 
  AlertTriangle, 
  Wrench, 
  Shield,
  TrendingUp,
  TrendingDown,
  Calendar
} from 'lucide-react';
import { useVehicleStore } from '../store/vehicleStore';
import { formatCurrency, getStatusColor, getStatusLabel, formatDate, getDaysUntilExpiry, getAlertLevel } from '../utils/helpers';
import type { DashboardStats, Insurance, Inspection, Maintenance, Fine } from '../types';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [alerts, setAlerts] = useState<{
    insurances: Insurance[];
    inspections: Inspection[];
    maintenances: Maintenance[];
    fines: Fine[];
  }>({ insurances: [], inspections: [], maintenances: [], fines: [] });
  
  const { 
    companies, 
    currentCompanyId, 
    getDashboardStats, 
    insurances, 
    inspections, 
    maintenances, 
    fines,
    vehicles 
  } = useVehicleStore();

  const currentCompany = companies.find((c) => c.id === currentCompanyId);
  const currency = currentCompany?.currency || 'AED';

  useEffect(() => {
    const dashboardStats = getDashboardStats();
    setStats(dashboardStats);
    
    // 收集预警信息
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const vehicleIds = currentCompanyId 
      ? vehicles.filter(v => v.companyId === currentCompanyId).map(v => v.id)
      : vehicles.map(v => v.id);
    
    setAlerts({
      insurances: insurances.filter(
        (i) => vehicleIds.includes(i.vehicleId) && i.status === 'active' && new Date(i.endDate) <= thirtyDaysFromNow
      ),
      inspections: inspections.filter(
        (i) => vehicleIds.includes(i.vehicleId) && new Date(i.expiryDate) <= thirtyDaysFromNow && new Date(i.expiryDate) >= new Date()
      ),
      maintenances: maintenances.filter(
        (m) => vehicleIds.includes(m.vehicleId) && m.nextMaintenanceDate && new Date(m.nextMaintenanceDate) <= thirtyDaysFromNow && new Date(m.nextMaintenanceDate) >= new Date()
      ),
      fines: fines.filter(
        (f) => vehicleIds.includes(f.vehicleId) && f.status === 'pending'
      ),
    });
  }, [getDashboardStats, insurances, inspections, maintenances, fines, vehicles, currentCompanyId]);

  if (!stats) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  const statCards = [
    { 
      name: 'Total Vehicles', 
      value: stats.totalVehicles, 
      icon: Car, 
      color: 'bg-primary-50 text-primary-600',
      subtext: `${stats.activeVehicles} active, ${stats.inMaintenance} in maintenance`
    },
    { 
      name: 'Total Drivers', 
      value: stats.totalDrivers, 
      icon: Users, 
      color: 'bg-success-50 text-success-600',
      subtext: 'Active drivers'
    },
    { 
      name: 'Pending Fines', 
      value: formatCurrency(stats.pendingFinesAmount, currency), 
      icon: AlertTriangle, 
      color: 'bg-danger-50 text-danger-600',
      subtext: `${stats.pendingFines} unpaid fines`
    },
    { 
      name: 'Monthly Costs', 
      value: formatCurrency(
        stats.monthlyFuelCost + stats.monthlyMaintenanceCost + stats.monthlyRepairCost + stats.monthlyFineCost,
        currency
      ), 
      icon: TrendingUp, 
      color: 'bg-warning-50 text-warning-600',
      subtext: 'This month total'
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-description">
          Overview of your fleet management system
          {currentCompany && ` - ${currentCompany.name}`}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.name} className="stat-card">
            <div className="flex items-center">
              <div className={`flex-shrink-0 rounded-lg p-3 ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="stat-label">{stat.name}</p>
                <p className="stat-value">{stat.value}</p>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500">{stat.subtext}</p>
          </div>
        ))}
      </div>

      {/* Monthly Cost Breakdown */}
      <div className="mt-8 card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Monthly Cost Breakdown</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Fuel</p>
              <p className="text-xl font-semibold text-gray-900">{formatCurrency(stats.monthlyFuelCost, currency)}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Maintenance</p>
              <p className="text-xl font-semibold text-gray-900">{formatCurrency(stats.monthlyMaintenanceCost, currency)}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Repairs</p>
              <p className="text-xl font-semibold text-gray-900">{formatCurrency(stats.monthlyRepairCost, currency)}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Fines</p>
              <p className="text-xl font-semibold text-gray-900">{formatCurrency(stats.monthlyFineCost, currency)}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Insurance</p>
              <p className="text-xl font-semibold text-gray-900">{formatCurrency(stats.monthlyInsuranceCost, currency)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Renewals */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-warning-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Upcoming Renewals</h3>
            </div>
            <span className="badge bg-warning-100 text-warning-800">
              {alerts.insurances.length + alerts.inspections.length + alerts.maintenances.length}
            </span>
          </div>
          <div className="card-body">
            {alerts.insurances.length === 0 && alerts.inspections.length === 0 && alerts.maintenances.length === 0 ? (
              <div className="empty-state">
                <p className="empty-state-description">No upcoming renewals</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.insurances.slice(0, 3).map((insurance) => {
                  const daysUntil = getDaysUntilExpiry(insurance.endDate);
                  const level = getAlertLevel(daysUntil);
                  const vehicle = vehicles.find(v => v.id === insurance.vehicleId);
                  return (
                    <div key={insurance.id} className={`flex items-center justify-between p-3 rounded-lg border ${
                      level === 'danger' ? 'bg-danger-50 border-danger-200' : 
                      level === 'warning' ? 'bg-warning-50 border-warning-200' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div>
                        <p className="font-medium text-gray-900">Insurance Expiry</p>
                        <p className="text-sm text-gray-500">{vehicle?.plateNumber} - {insurance.company}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${
                          level === 'danger' ? 'text-danger-600' : 
                          level === 'warning' ? 'text-warning-600' : 'text-gray-600'
                        }`}>
                          {daysUntil < 0 ? 'Expired' : `${daysUntil} days left`}
                        </p>
                        <p className="text-xs text-gray-500">{formatDate(insurance.endDate)}</p>
                      </div>
                    </div>
                  );
                })}
                
                {alerts.inspections.slice(0, 3).map((inspection) => {
                  const daysUntil = getDaysUntilExpiry(inspection.expiryDate);
                  const level = getAlertLevel(daysUntil);
                  const vehicle = vehicles.find(v => v.id === inspection.vehicleId);
                  return (
                    <div key={inspection.id} className={`flex items-center justify-between p-3 rounded-lg border ${
                      level === 'danger' ? 'bg-danger-50 border-danger-200' : 
                      level === 'warning' ? 'bg-warning-50 border-warning-200' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div>
                        <p className="font-medium text-gray-900">Inspection Due</p>
                        <p className="text-sm text-gray-500">{vehicle?.plateNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${
                          level === 'danger' ? 'text-danger-600' : 
                          level === 'warning' ? 'text-warning-600' : 'text-gray-600'
                        }`}>
                          {daysUntil < 0 ? 'Expired' : `${daysUntil} days left`}
                        </p>
                        <p className="text-xs text-gray-500">{formatDate(inspection.expiryDate)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Pending Fines */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-danger-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Pending Fines</h3>
            </div>
            <span className="badge bg-danger-100 text-danger-800">{alerts.fines.length}</span>
          </div>
          <div className="card-body">
            {alerts.fines.length === 0 ? (
              <div className="empty-state">
                <p className="empty-state-description">No pending fines</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.fines.slice(0, 5).map((fine) => {
                  const vehicle = vehicles.find(v => v.id === fine.vehicleId);
                  return (
                    <div key={fine.id} className="flex items-center justify-between p-3 bg-danger-50 rounded-lg border border-danger-200">
                      <div>
                        <p className="font-medium text-gray-900">{getStatusLabel(fine.violationType)}</p>
                        <p className="text-sm text-gray-500">{vehicle?.plateNumber} - {fine.location}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-danger-600">{formatCurrency(fine.amount, currency)}</p>
                        <p className="text-xs text-gray-500">{formatDate(fine.fineDate)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="card-body flex items-center">
            <div className="p-3 bg-primary-50 rounded-lg">
              <Shield className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Expiring Insurance</p>
              <p className="text-2xl font-bold text-gray-900">{stats.expiringInsurance}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body flex items-center">
            <div className="p-3 bg-warning-50 rounded-lg">
              <Calendar className="h-6 w-6 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Upcoming Inspections</p>
              <p className="text-2xl font-bold text-gray-900">{stats.upcomingInspections}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body flex items-center">
            <div className="p-3 bg-success-50 rounded-lg">
              <Wrench className="h-6 w-6 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Due Maintenance</p>
              <p className="text-2xl font-bold text-gray-900">{stats.upcomingMaintenance}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
