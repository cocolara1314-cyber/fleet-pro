// 公司/地区相关
export type Country = 'SA' | 'AE';
export type Currency = 'SAR' | 'AED';

export interface Company {
  id: string;
  name: string;
  nameAr?: string;
  country: Country;
  city: string;
  currency: Currency;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

// 车辆状态
export type VehicleStatus = 'active' | 'maintenance' | 'inactive' | 'retired';

export interface Vehicle {
  id: string;
  companyId: string;
  plateNumber: string;
  plateCountry: Country;
  brand: string;
  model: string;
  year: number;
  vin: string;
  color: string;
  engineNumber?: string;
  purchaseDate: string;
  purchasePrice: number;
  currentMileage: number;
  status: VehicleStatus;
  assignedDriverId?: string;
  department?: string;
  fuelType: 'petrol' | 'diesel' | 'hybrid' | 'electric';
  createdAt: string;
  updatedAt: string;
}

// 驾驶员
export interface Driver {
  id: string;
  companyId: string;
  name: string;
  nameAr?: string;
  employeeId?: string;
  licenseNumber: string;
  licenseIssueDate: string;
  licenseExpiryDate: string;
  licenseType: string[];
  phone: string;
  email?: string;
  nationality?: string;
  dateOfBirth?: string;
  joinDate: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// 保养记录
export interface Maintenance {
  id: string;
  vehicleId: string;
  maintenanceDate: string;
  mileage: number;
  type: 'routine' | 'repair' | 'inspection';
  items: MaintenanceItem[];
  totalCost: number;
  provider: string;
  providerPhone?: string;
  notes?: string;
  nextMaintenanceDate?: string;
  nextMaintenanceMileage?: number;
  performedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceItem {
  name: string;
  description?: string;
  cost: number;
}

// 保险记录
export type InsuranceType = 'third_party' | 'comprehensive';
export type InsuranceStatus = 'active' | 'expired' | 'cancelled';

export interface Insurance {
  id: string;
  vehicleId: string;
  policyNumber: string;
  company: string;
  companyPhone?: string;
  type: InsuranceType;
  startDate: string;
  endDate: string;
  premium: number;
  coverageAmount: number;
  status: InsuranceStatus;
  documents?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// 罚款记录
export type FineStatus = 'pending' | 'paid' | 'disputed';
export type ViolationType = 
  | 'speeding' 
  | 'parking' 
  | 'red_light' 
  | 'seatbelt' 
  | 'phone' 
  | 'other';

export interface Fine {
  id: string;
  vehicleId: string;
  driverId?: string;
  fineNumber?: string;
  fineDate: string;
  violationType: ViolationType;
  violationDetails?: string;
  location?: string;
  amount: number;
  status: FineStatus;
  paidDate?: string;
  paidAmount?: number;
  documents?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// 维修记录
export type RepairStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type RepairPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Repair {
  id: string;
  vehicleId: string;
  requestDate: string;
  startDate?: string;
  completionDate?: string;
  description: string;
  diagnosis?: string;
  priority: RepairPriority;
  status: RepairStatus;
  estimatedCost?: number;
  actualCost?: number;
  provider: string;
  providerPhone?: string;
  parts: RepairPart[];
  laborCost: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface RepairPart {
  name: string;
  partNumber?: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

// 燃油记录
export interface FuelRecord {
  id: string;
  vehicleId: string;
  fuelDate: string;
  mileage: number;
  liters: number;
  pricePerLiter: number;
  totalCost: number;
  station: string;
  fuelCardId?: string;
  receiptNumber?: string;
  fullTank: boolean;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// 年检记录
export type InspectionResult = 'pass' | 'fail' | 'conditional';

export interface Inspection {
  id: string;
  vehicleId: string;
  inspectionDate: string;
  expiryDate: string;
  result: InspectionResult;
  center: string;
  centerLocation?: string;
  cost: number;
  certificateNumber?: string;
  notes?: string;
  documents?: string[];
  nextInspectionDate?: string;
  createdAt: string;
  updatedAt: string;
}

// 仪表盘统计
export interface DashboardStats {
  totalVehicles: number;
  activeVehicles: number;
  inMaintenance: number;
  totalDrivers: number;
  
  // 费用统计（本月）
  monthlyFuelCost: number;
  monthlyMaintenanceCost: number;
  monthlyRepairCost: number;
  monthlyFineCost: number;
  monthlyInsuranceCost: number;
  
  // 待处理事项
  pendingFines: number;
  pendingFinesAmount: number;
  upcomingInspections: number;
  upcomingMaintenance: number;
  expiringInsurance: number;
}

// 费用报表
export interface CostReport {
  period: string;
  vehicleId?: string;
  fuelCost: number;
  maintenanceCost: number;
  repairCost: number;
  insuranceCost: number;
  fineCost: number;
  totalCost: number;
}

// 用户设置
export interface UserSettings {
  language: 'en' | 'ar';
  currency: Currency;
  dateFormat: string;
  companyId?: string;
  notifications: {
    maintenance: boolean;
    insurance: boolean;
    inspection: boolean;
    fines: boolean;
  };
}
