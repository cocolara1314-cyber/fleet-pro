import { format, parseISO, isAfter, isBefore, addDays, differenceInDays } from 'date-fns';
import type { Country, Currency, Vehicle, Insurance, Inspection, Maintenance, Fine, Repair, FuelRecord } from '../types';

// 货币格式化
export const formatCurrency = (amount: number, currency: Currency): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

// 日期格式化
export const formatDate = (date: string | Date, formatStr: string = 'yyyy-MM-dd'): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr);
};

// 获取货币符号
export const getCurrencySymbol = (currency: Currency): string => {
  const symbols: Record<Currency, string> = {
    SAR: 'ر.س',
    AED: 'د.إ',
  };
  return symbols[currency] || currency;
};

// 获取国家名称
export const getCountryName = (country: Country): string => {
  const names: Record<Country, string> = {
    SA: 'Saudi Arabia',
    AE: 'United Arab Emirates',
  };
  return names[country];
};

// 计算车辆年龄
export const getVehicleAge = (year: number): number => {
  return new Date().getFullYear() - year;
};

// 检查是否需要年检（根据地区法规）
export const needsInspection = (vehicle: Vehicle, country: Country): boolean => {
  const age = getVehicleAge(vehicle.year);
  if (country === 'SA') {
    return true;
  } else {
    return age > 3;
  }
};

// 获取状态颜色
export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    active: 'bg-success-100 text-success-600',
    inactive: 'bg-gray-100 text-gray-600',
    maintenance: 'bg-warning-100 text-warning-600',
    retired: 'bg-danger-100 text-danger-600',
    pending: 'bg-warning-100 text-warning-600',
    paid: 'bg-success-100 text-success-600',
    disputed: 'bg-danger-100 text-danger-600',
    completed: 'bg-success-100 text-success-600',
    in_progress: 'bg-primary-100 text-primary-600',
    cancelled: 'bg-gray-100 text-gray-600',
    pass: 'bg-success-100 text-success-600',
    fail: 'bg-danger-100 text-danger-600',
    conditional: 'bg-warning-100 text-warning-600',
    expired: 'bg-danger-100 text-danger-600',
    // types
    routine: 'bg-primary-100 text-primary-600',
    repair: 'bg-warning-100 text-warning-600',
    inspection: 'bg-success-100 text-success-600',
    third_party: 'bg-gray-100 text-gray-600',
    comprehensive: 'bg-primary-100 text-primary-600',
    // priorities
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-primary-100 text-primary-600',
    high: 'bg-warning-100 text-warning-600',
    urgent: 'bg-danger-100 text-danger-600',
    // fuel types
    petrol: 'bg-primary-100 text-primary-600',
    diesel: 'bg-gray-100 text-gray-600',
    hybrid: 'bg-success-100 text-success-600',
    electric: 'bg-success-100 text-success-600',
  };
  return colors[status] || 'bg-gray-100 text-gray-600';
};

// 获取状态标签
export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    active: 'Active',
    inactive: 'Inactive',
    maintenance: 'In Maintenance',
    retired: 'Retired',
    pending: 'Pending',
    paid: 'Paid',
    disputed: 'Disputed',
    completed: 'Completed',
    in_progress: 'In Progress',
    cancelled: 'Cancelled',
    pass: 'Pass',
    fail: 'Fail',
    conditional: 'Conditional',
    expired: 'Expired',
    routine: 'Routine',
    repair: 'Repair',
    inspection: 'Inspection',
    third_party: 'Third Party',
    comprehensive: 'Comprehensive',
    petrol: 'Petrol',
    diesel: 'Diesel',
    hybrid: 'Hybrid',
    electric: 'Electric',
    speeding: 'Speeding',
    parking: 'Parking',
    red_light: 'Red Light',
    seatbelt: 'No Seatbelt',
    phone: 'Phone Use',
    other: 'Other',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    urgent: 'Urgent',
  };
  return labels[status] || status;
};

// 计算油耗
export const calculateFuelConsumption = (
  currentMileage: number,
  previousMileage: number,
  liters: number
): number => {
  const distance = currentMileage - previousMileage;
  if (distance <= 0 || liters <= 0) return 0;
  return liters / (distance / 100);
};

// 计算平均油耗
export const calculateAverageConsumption = (
  records: { mileage: number; liters: number; fuelDate: string }[]
): number => {
  if (records.length < 2) return 0;
  const sorted = [...records].sort(
    (a, b) => new Date(a.fuelDate).getTime() - new Date(b.fuelDate).getTime()
  );
  let totalDistance = 0;
  let totalLiters = 0;
  for (let i = 1; i < sorted.length; i++) {
    const distance = sorted[i].mileage - sorted[i - 1].mileage;
    if (distance > 0) {
      totalDistance += distance;
      totalLiters += sorted[i].liters;
    }
  }
  if (totalDistance === 0) return 0;
  return (totalLiters / totalDistance) * 100;
};

// 计算距离到期天数
export const getDaysUntilExpiry = (expiryDate: string): number => {
  const expiry = parseISO(expiryDate);
  const today = new Date();
  return differenceInDays(expiry, today);
};

// 获取预警级别
export const getAlertLevel = (daysUntil: number): 'normal' | 'warning' | 'danger' => {
  if (daysUntil < 0) return 'danger';
  if (daysUntil <= 7) return 'danger';
  if (daysUntil <= 30) return 'warning';
  return 'normal';
};

// 检查保险是否即将到期
export const isInsuranceExpiringSoon = (insurance: Insurance, days: number = 30): boolean => {
  const endDate = parseISO(insurance.endDate);
  const threshold = addDays(new Date(), days);
  return isBefore(endDate, threshold) && isAfter(endDate, new Date());
};

// 检查年检是否即将到期
export const isInspectionExpiringSoon = (inspection: Inspection, days: number = 30): boolean => {
  const expiryDate = parseISO(inspection.expiryDate);
  const threshold = addDays(new Date(), days);
  return isBefore(expiryDate, threshold) && isAfter(expiryDate, new Date());
};

// 检查保养是否即将到期
export const isMaintenanceDueSoon = (maintenance: Maintenance, days: number = 14): boolean => {
  if (!maintenance.nextMaintenanceDate) return false;
  const nextDate = parseISO(maintenance.nextMaintenanceDate);
  const threshold = addDays(new Date(), days);
  return isBefore(nextDate, threshold) && isAfter(nextDate, new Date());
};

// 导出CSV
export const exportToCSV = (data: Record<string, unknown>[], filename: string): void => {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((header) => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    ),
  ].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};

// 验证VIN码
export const isValidVIN = (vin: string): boolean => {
  if (!vin || vin.length !== 17) return false;
  const pattern = /^[A-HJ-NPR-Z0-9]{17}$/;
  return pattern.test(vin.toUpperCase());
};

// 计算总拥有成本
export const calculateTotalCostOfOwnership = (
  vehicle: Vehicle,
  maintenances: Maintenance[],
  insurances: Insurance[],
  fines: Fine[],
  repairs: Repair[],
  fuelRecords: FuelRecord[]
): number => {
  const maintenanceCost = maintenances.reduce((sum, m) => sum + m.totalCost, 0);
  const insuranceCost = insurances.reduce((sum, i) => sum + i.premium, 0);
  const fineCost = fines.reduce((sum, f) => sum + (f.paidAmount || f.amount), 0);
  const repairCost = repairs.reduce((sum, r) => sum + (r.actualCost || 0), 0);
  const fuelCost = fuelRecords.reduce((sum, f) => sum + f.totalCost, 0);
  return vehicle.purchasePrice + maintenanceCost + insuranceCost + fineCost + repairCost + fuelCost;
};
