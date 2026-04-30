import { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { FileText, TrendingUp, Car, Fuel, Wrench, Shield, AlertTriangle, Download } from 'lucide-react';
import { useVehicleStore } from '../store/vehicleStore';
import { formatCurrency, formatDate, exportToCSV } from '../utils/helpers';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'cost' | 'vehicle' | 'compliance' | 'fuel'>('cost');
  const [monthsRange, setMonthsRange] = useState(6);

  const {
    companies, currentCompanyId, vehicles, drivers,
    maintenances, insurances, fines, repairs, fuelRecords, inspections
  } = useVehicleStore();

  const currentCompany = companies.find((c) => c.id === currentCompanyId);
  const currency = currentCompany?.currency || 'AED';

  const companyVehicles = useMemo(() =>
    currentCompanyId ? vehicles.filter((v) => v.companyId === currentCompanyId) : vehicles,
    [vehicles, currentCompanyId]
  );
  const vehicleIds = companyVehicles.map((v) => v.id);

  // 生成月份列表
  const monthLabels = useMemo(() => {
    return Array.from({ length: monthsRange }, (_, i) => {
      const d = subMonths(new Date(), monthsRange - 1 - i);
      return { label: format(d, 'MMM yy'), start: startOfMonth(d), end: endOfMonth(d) };
    });
  }, [monthsRange]);

  // 月度费用趋势
  const monthlyCostData = useMemo(() => {
    return monthLabels.map(({ label, start, end }) => {
      const inRange = (dateStr: string) => isWithinInterval(new Date(dateStr), { start, end });
      const fuel = fuelRecords.filter((r) => vehicleIds.includes(r.vehicleId) && inRange(r.fuelDate)).reduce((s, r) => s + r.totalCost, 0);
      const maint = maintenances.filter((m) => vehicleIds.includes(m.vehicleId) && inRange(m.maintenanceDate)).reduce((s, m) => s + m.totalCost, 0);
      const repair = repairs.filter((r) => vehicleIds.includes(r.vehicleId) && r.actualCost && inRange(r.requestDate)).reduce((s, r) => s + (r.actualCost || 0), 0);
      const fine = fines.filter((f) => vehicleIds.includes(f.vehicleId) && f.paidDate && inRange(f.paidDate)).reduce((s, f) => s + (f.paidAmount || f.amount), 0);
      return { month: label, Fuel: Math.round(fuel), Maintenance: Math.round(maint), Repair: Math.round(repair), Fines: Math.round(fine) };
    });
  }, [monthLabels, fuelRecords, maintenances, repairs, fines, vehicleIds]);

  // 费用类型占比
  const costBreakdown = useMemo(() => {
    const fuel = fuelRecords.filter((r) => vehicleIds.includes(r.vehicleId)).reduce((s, r) => s + r.totalCost, 0);
    const maint = maintenances.filter((m) => vehicleIds.includes(m.vehicleId)).reduce((s, m) => s + m.totalCost, 0);
    const repair = repairs.filter((r) => vehicleIds.includes(r.vehicleId) && r.actualCost).reduce((s, r) => s + (r.actualCost || 0), 0);
    const fine = fines.filter((f) => vehicleIds.includes(f.vehicleId)).reduce((s, f) => s + f.amount, 0);
    const ins = insurances.filter((i) => vehicleIds.includes(i.vehicleId)).reduce((s, i) => s + i.premium, 0);
    return [
      { name: 'Fuel', value: Math.round(fuel) },
      { name: 'Maintenance', value: Math.round(maint) },
      { name: 'Repair', value: Math.round(repair) },
      { name: 'Fines', value: Math.round(fine) },
      { name: 'Insurance', value: Math.round(ins) },
    ].filter((d) => d.value > 0);
  }, [fuelRecords, maintenances, repairs, fines, insurances, vehicleIds]);

  // 每辆车总成本
  const vehicleCostData = useMemo(() => {
    return companyVehicles.map((v) => {
      const fuel = fuelRecords.filter((r) => r.vehicleId === v.id).reduce((s, r) => s + r.totalCost, 0);
      const maint = maintenances.filter((m) => m.vehicleId === v.id).reduce((s, m) => s + m.totalCost, 0);
      const repair = repairs.filter((r) => r.vehicleId === v.id && r.actualCost).reduce((s, r) => s + (r.actualCost || 0), 0);
      const fine = fines.filter((f) => f.vehicleId === v.id).reduce((s, f) => s + f.amount, 0);
      return {
        plate: v.plateNumber,
        vehicle: `${v.brand} ${v.model}`,
        total: Math.round(fuel + maint + repair + fine),
        fuel: Math.round(fuel), maint: Math.round(maint), repair: Math.round(repair), fine: Math.round(fine),
      };
    }).sort((a, b) => b.total - a.total);
  }, [companyVehicles, fuelRecords, maintenances, repairs, fines]);

  // 油耗趋势（按月平均）
  const fuelTrendData = useMemo(() => {
    return monthLabels.map(({ label, start, end }) => {
      const inRange = (d: string) => isWithinInterval(new Date(d), { start, end });
      const records = fuelRecords.filter((r) => vehicleIds.includes(r.vehicleId) && inRange(r.fuelDate));
      const totalL = records.reduce((s, r) => s + r.liters, 0);
      const totalCost = records.reduce((s, r) => s + r.totalCost, 0);
      return { month: label, Liters: Math.round(totalL), Cost: Math.round(totalCost) };
    });
  }, [monthLabels, fuelRecords, vehicleIds]);

  // 合规概览
  const now = new Date();
  const thirtyDays = new Date();
  thirtyDays.setDate(thirtyDays.getDate() + 30);

  const complianceData = {
    expiredInsurance: insurances.filter((i) => vehicleIds.includes(i.vehicleId) && new Date(i.endDate) < now).length,
    expiringInsurance: insurances.filter((i) => vehicleIds.includes(i.vehicleId) && new Date(i.endDate) >= now && new Date(i.endDate) <= thirtyDays).length,
    expiredInspection: inspections.filter((i) => vehicleIds.includes(i.vehicleId) && new Date(i.expiryDate) < now).length,
    expiringInspection: inspections.filter((i) => vehicleIds.includes(i.vehicleId) && new Date(i.expiryDate) >= now && new Date(i.expiryDate) <= thirtyDays).length,
    pendingFines: fines.filter((f) => vehicleIds.includes(f.vehicleId) && f.status === 'pending').length,
    expiringLicenses: drivers.filter((d) => {
      const expiry = new Date(d.licenseExpiryDate);
      return expiry >= now && expiry <= thirtyDays;
    }).length,
  };

  const handleExportCosts = () => {
    exportToCSV(monthlyCostData, 'monthly-costs.csv');
  };
  const handleExportVehicles = () => {
    exportToCSV(vehicleCostData, 'vehicle-costs.csv');
  };

  return (
    <div>
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-description">Fleet performance and cost analysis</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <select value={monthsRange} onChange={(e) => setMonthsRange(parseInt(e.target.value))} className="select w-36">
            <option value={3}>Last 3 months</option>
            <option value={6}>Last 6 months</option>
            <option value={12}>Last 12 months</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs mb-6">
        <nav className="tab-list">
          {[
            { id: 'cost', label: 'Cost Analysis', icon: TrendingUp },
            { id: 'vehicle', label: 'Per Vehicle', icon: Car },
            { id: 'fuel', label: 'Fuel Trend', icon: Fuel },
            { id: 'compliance', label: 'Compliance', icon: Shield },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)} className={activeTab === tab.id ? 'tab-active' : 'tab-inactive'}>
              <tab.icon className="h-4 w-4 mr-2 inline" />{tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Cost Analysis Tab */}
      {activeTab === 'cost' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button onClick={handleExportCosts} className="btn-secondary btn-sm">
              <Download className="h-4 w-4 mr-2" />Export CSV
            </button>
          </div>

          {/* Monthly Cost Trend */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-base font-medium">Monthly Cost Trend ({currency})</h3>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyCostData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v) => v.toLocaleString()} />
                  <Tooltip formatter={(v: number) => formatCurrency(v, currency)} />
                  <Legend />
                  <Bar dataKey="Fuel" fill="#22c55e" />
                  <Bar dataKey="Maintenance" fill="#3b82f6" />
                  <Bar dataKey="Repair" fill="#f59e0b" />
                  <Bar dataKey="Fines" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cost Breakdown Pie */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-base font-medium">Total Cost Breakdown</h3>
            </div>
            <div className="card-body">
              {costBreakdown.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No cost data available</p>
              ) : (
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={costBreakdown} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {costBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatCurrency(v, currency)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 min-w-48">
                    {costBreakdown.map((item, i) => (
                      <div key={item.name} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-sm text-gray-700">{item.name}</span>
                        </div>
                        <span className="text-sm font-medium">{formatCurrency(item.value, currency)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-3 font-semibold">
                      <span>Total</span>
                      <span>{formatCurrency(costBreakdown.reduce((s, d) => s + d.value, 0), currency)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Per Vehicle Tab */}
      {activeTab === 'vehicle' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button onClick={handleExportVehicles} className="btn-secondary btn-sm">
              <Download className="h-4 w-4 mr-2" />Export CSV
            </button>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="text-base font-medium">Total Cost of Ownership by Vehicle ({currency})</h3>
            </div>
            <div className="card-body">
              {vehicleCostData.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No vehicle data available</p>
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(250, vehicleCostData.length * 50)}>
                  <BarChart data={vehicleCostData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(v) => v.toLocaleString()} />
                    <YAxis type="category" dataKey="plate" width={80} />
                    <Tooltip formatter={(v: number) => formatCurrency(v, currency)} />
                    <Legend />
                    <Bar dataKey="fuel" name="Fuel" fill="#22c55e" stackId="a" />
                    <Bar dataKey="maint" name="Maintenance" fill="#3b82f6" stackId="a" />
                    <Bar dataKey="repair" name="Repair" fill="#f59e0b" stackId="a" />
                    <Bar dataKey="fine" name="Fines" fill="#ef4444" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="card">
            <div className="card-header"><h3 className="text-base font-medium">Vehicle Cost Detail</h3></div>
            <div className="table-container">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Plate</th>
                    <th className="table-header-cell">Vehicle</th>
                    <th className="table-header-cell">Fuel</th>
                    <th className="table-header-cell">Maintenance</th>
                    <th className="table-header-cell">Repair</th>
                    <th className="table-header-cell">Fines</th>
                    <th className="table-header-cell">Total</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {vehicleCostData.map((v) => (
                    <tr key={v.plate} className="hover:bg-gray-50">
                      <td className="table-cell font-medium">{v.plate}</td>
                      <td className="table-cell text-gray-500">{v.vehicle}</td>
                      <td className="table-cell">{formatCurrency(v.fuel, currency)}</td>
                      <td className="table-cell">{formatCurrency(v.maint, currency)}</td>
                      <td className="table-cell">{formatCurrency(v.repair, currency)}</td>
                      <td className="table-cell">{formatCurrency(v.fine, currency)}</td>
                      <td className="table-cell font-semibold text-primary-600">{formatCurrency(v.total, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Fuel Trend Tab */}
      {activeTab === 'fuel' && (
        <div className="space-y-6">
          <div className="card">
            <div className="card-header"><h3 className="text-base font-medium">Monthly Fuel Consumption & Cost</h3></div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={fuelTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" tickFormatter={(v) => `${v}L`} />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => v.toLocaleString()} />
                  <Tooltip formatter={(v: number, name: string) => name === 'Cost' ? formatCurrency(v, currency) : `${v} L`} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="Liters" stroke="#22c55e" strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="Cost" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Compliance Tab */}
      {activeTab === 'compliance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Expired Insurance', value: complianceData.expiredInsurance, color: 'danger', icon: Shield },
              { label: 'Insurance Expiring (30d)', value: complianceData.expiringInsurance, color: 'warning', icon: Shield },
              { label: 'Expired Inspection', value: complianceData.expiredInspection, color: 'danger', icon: AlertTriangle },
              { label: 'Inspection Expiring (30d)', value: complianceData.expiringInspection, color: 'warning', icon: AlertTriangle },
              { label: 'Pending Fines', value: complianceData.pendingFines, color: 'danger', icon: AlertTriangle },
              { label: 'Driver License Expiring (30d)', value: complianceData.expiringLicenses, color: 'warning', icon: Wrench },
            ].map((item) => (
              <div key={item.label} className={`card p-4 border-l-4 ${item.color === 'danger' ? 'border-l-danger-500' : 'border-l-warning-500'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{item.label}</p>
                    <p className={`text-3xl font-bold mt-1 ${item.color === 'danger' ? (item.value > 0 ? 'text-danger-600' : 'text-gray-400') : (item.value > 0 ? 'text-warning-600' : 'text-gray-400')}`}>
                      {item.value}
                    </p>
                  </div>
                  <item.icon className={`h-8 w-8 ${item.value > 0 ? (item.color === 'danger' ? 'text-danger-300' : 'text-warning-300') : 'text-gray-200'}`} />
                </div>
              </div>
            ))}
          </div>

          {/* Compliance Score */}
          <div className="card">
            <div className="card-header"><h3 className="text-base font-medium">Compliance Score</h3></div>
            <div className="card-body">
              {(() => {
                const issues = complianceData.expiredInsurance + complianceData.expiredInspection + complianceData.pendingFines;
                const warnings = complianceData.expiringInsurance + complianceData.expiringInspection + complianceData.expiringLicenses;
                const total = companyVehicles.length || 1;
                const score = Math.max(0, 100 - (issues * 15) - (warnings * 5));
                return (
                  <div className="text-center">
                    <div className={`text-6xl font-bold mb-2 ${score >= 80 ? 'text-success-600' : score >= 60 ? 'text-warning-600' : 'text-danger-600'}`}>
                      {score}
                    </div>
                    <p className="text-lg text-gray-600">Compliance Score</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {issues === 0 && warnings === 0 ? '✅ All vehicles are fully compliant.' :
                        `${issues} critical issue${issues !== 1 ? 's' : ''} and ${warnings} warning${warnings !== 1 ? 's' : ''} require attention.`}
                    </p>
                    <div className="mt-4 bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div className={`h-4 rounded-full transition-all ${score >= 80 ? 'bg-success-500' : score >= 60 ? 'bg-warning-500' : 'bg-danger-500'}`} style={{ width: `${score}%` }} />
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
