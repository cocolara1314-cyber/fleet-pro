import { create } from 'zustand';
import type { 
  Vehicle, Driver, Maintenance, Insurance, Fine, 
  Repair, FuelRecord, Inspection, Company, DashboardStats 
} from '../types';
import { supabase } from '../lib/supabase';

interface VehicleState {
  companies: Company[];
  vehicles: Vehicle[];
  drivers: Driver[];
  maintenances: Maintenance[];
  insurances: Insurance[];
  fines: Fine[];
  repairs: Repair[];
  fuelRecords: FuelRecord[];
  inspections: Inspection[];
  currentCompanyId: string | null;
  loading: boolean;
  
  // 数据加载
  loadCompanies: () => Promise<void>;
  loadCompanyData: (companyId: string) => Promise<void>;
  
  // Company Actions
  addCompany: (company: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCompany: (id: string, updates: Partial<Company>) => Promise<void>;
  setCurrentCompany: (id: string) => void;
  
  // Vehicle Actions
  addVehicle: (vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;
  
  // Driver Actions
  addDriver: (driver: Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateDriver: (id: string, updates: Partial<Driver>) => Promise<void>;
  deleteDriver: (id: string) => Promise<void>;
  
  // Maintenance Actions
  addMaintenance: (maintenance: Omit<Maintenance, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateMaintenance: (id: string, updates: Partial<Maintenance>) => Promise<void>;
  deleteMaintenance: (id: string) => Promise<void>;
  
  // Insurance Actions
  addInsurance: (insurance: Omit<Insurance, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateInsurance: (id: string, updates: Partial<Insurance>) => Promise<void>;
  deleteInsurance: (id: string) => Promise<void>;
  
  // Fine Actions
  addFine: (fine: Omit<Fine, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateFine: (id: string, updates: Partial<Fine>) => Promise<void>;
  deleteFine: (id: string) => Promise<void>;
  
  // Repair Actions
  addRepair: (repair: Omit<Repair, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateRepair: (id: string, updates: Partial<Repair>) => Promise<void>;
  deleteRepair: (id: string) => Promise<void>;
  
  // Fuel Actions
  addFuelRecord: (record: Omit<FuelRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateFuelRecord: (id: string, updates: Partial<FuelRecord>) => Promise<void>;
  deleteFuelRecord: (id: string) => Promise<void>;
  
  // Inspection Actions
  addInspection: (inspection: Omit<Inspection, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateInspection: (id: string, updates: Partial<Inspection>) => Promise<void>;
  deleteInspection: (id: string) => Promise<void>;
  
  // Getters
  getCompanyVehicles: (companyId: string) => Vehicle[];
  getVehicleById: (id: string) => Vehicle | undefined;
  getDriverById: (id: string) => Driver | undefined;
  getVehicleMaintenances: (vehicleId: string) => Maintenance[];
  getVehicleInsurances: (vehicleId: string) => Insurance[];
  getVehicleFines: (vehicleId: string) => Fine[];
  getVehicleRepairs: (vehicleId: string) => Repair[];
  getVehicleFuelRecords: (vehicleId: string) => FuelRecord[];
  getVehicleInspections: (vehicleId: string) => Inspection[];
  getDashboardStats: () => DashboardStats;
}

const generateId = () => Math.random().toString(36).substring(2, 15);
const now = () => new Date().toISOString();

// 从 localStorage 读取 currentCompanyId
const getSavedCompanyId = (): string | null => {
  try {
    return localStorage.getItem('fleet-current-company');
  } catch {
    return null;
  }
};

export const useVehicleStore = create<VehicleState>()((set, get) => ({
  companies: [],
  vehicles: [],
  drivers: [],
  maintenances: [],
  insurances: [],
  fines: [],
  repairs: [],
  fuelRecords: [],
  inspections: [],
  currentCompanyId: getSavedCompanyId(),
  loading: false,
  
  // 加载所有公司
  loadCompanies: async () => {
    set({ loading: true });
    const { data, error } = await supabase.from('companies').select('*');
    if (error) {
      console.error('加载公司失败:', error);
    } else {
      set({ companies: data as unknown as Company[] });
    }
    set({ loading: false });
  },
  
  // 加载指定公司的所有数据
  loadCompanyData: async (companyId: string) => {
    set({ loading: true });
    try {
      const [
        { data: vehicles, error: vErr },
        { data: drivers, error: dErr },
        { data: maintenances, error: mErr },
        { data: insurances, error: iErr },
        { data: fines, error: fErr },
        { data: repairs, error: rErr },
        { data: fuelRecords, error: frErr },
        { data: inspections, error: inspErr },
      ] = await Promise.all([
        supabase.from('vehicles').select('*').eq('companyId', companyId),
        supabase.from('drivers').select('*').eq('companyId', companyId),
        supabase.from('maintenances').select('*').eq('companyId', companyId),
        supabase.from('insurances').select('*').eq('companyId', companyId),
        supabase.from('fines').select('*').eq('companyId', companyId),
        supabase.from('repairs').select('*').eq('companyId', companyId),
        supabase.from('fuel_records').select('*').eq('companyId', companyId),
        supabase.from('inspections').select('*').eq('companyId', companyId),
      ]);

      if (vErr || dErr || mErr || iErr || fErr || rErr || frErr || inspErr) {
        console.error('加载数据失败:', vErr || dErr || mErr || iErr || fErr || rErr || frErr || inspErr);
      } else {
        set({
          vehicles: (vehicles || []) as unknown as Vehicle[],
          drivers: (drivers || []) as unknown as Driver[],
          maintenances: (maintenances || []) as unknown as Maintenance[],
          insurances: (insurances || []) as unknown as Insurance[],
          fines: (fines || []) as unknown as Fine[],
          repairs: (repairs || []) as unknown as Repair[],
          fuelRecords: (fuelRecords || []) as unknown as FuelRecord[],
          inspections: (inspections || []) as unknown as Inspection[],
        });
      }
    } catch (err) {
      console.error('加载公司数据失败:', err);
    }
    set({ loading: false });
  },
  
  // Company Actions
  addCompany: async (company) => {
    const newCompany: Company = { ...company, id: generateId(), createdAt: now(), updatedAt: now() };
    const { data, error } = await supabase.from('companies').insert([newCompany]).select().single();
    if (error) {
      console.error('添加公司失败:', error);
    } else {
      set((state) => ({ companies: [...state.companies, data as unknown as Company] }));
    }
  },
  
  updateCompany: async (id, updates) => {
    const { data, error } = await supabase.from('companies').update({ ...updates, updatedAt: now() }).eq('id', id).select().single();
    if (error) {
      console.error('更新公司失败:', error);
    } else {
      set((state) => ({
        companies: state.companies.map((c) => c.id === id ? data as unknown as Company : c),
      }));
    }
  },
  
  setCurrentCompany: (id) => {
    try { localStorage.setItem('fleet-current-company', id); } catch {}
    set({ currentCompanyId: id });
    get().loadCompanyData(id);
  },
  
  // Vehicle Actions
  addVehicle: async (vehicle) => {
    const companyId = get().currentCompanyId;
    const newVehicle: Vehicle = { ...vehicle, id: generateId(), companyId: companyId || '', createdAt: now(), updatedAt: now() };
    const { data, error } = await supabase.from('vehicles').insert([newVehicle]).select().single();
    if (error) {
      console.error('添加车辆失败:', error);
    } else {
      set((state) => ({ vehicles: [...state.vehicles, data as unknown as Vehicle] }));
    }
  },
  
  updateVehicle: async (id, updates) => {
    const { data, error } = await supabase.from('vehicles').update({ ...updates, updatedAt: now() }).eq('id', id).select().single();
    if (error) {
      console.error('更新车辆失败:', error);
    } else {
      set((state) => ({
        vehicles: state.vehicles.map((v) => v.id === id ? data as unknown as Vehicle : v),
      }));
    }
  },
  
  deleteVehicle: async (id) => {
    const { error } = await supabase.from('vehicles').delete().eq('id', id);
    if (error) {
      console.error('删除车辆失败:', error);
    } else {
      set((state) => ({
        vehicles: state.vehicles.filter((v) => v.id !== id),
      }));
    }
  },
  
  // Driver Actions
  addDriver: async (driver) => {
    const companyId = get().currentCompanyId;
    const newDriver: Driver = { ...driver, id: generateId(), companyId: companyId || '', createdAt: now(), updatedAt: now() };
    const { data, error } = await supabase.from('drivers').insert([newDriver]).select().single();
    if (error) {
      console.error('添加驾驶员失败:', error);
    } else {
      set((state) => ({ drivers: [...state.drivers, data as unknown as Driver] }));
    }
  },
  
  updateDriver: async (id, updates) => {
    const { data, error } = await supabase.from('drivers').update({ ...updates, updatedAt: now() }).eq('id', id).select().single();
    if (error) {
      console.error('更新驾驶员失败:', error);
    } else {
      set((state) => ({
        drivers: state.drivers.map((d) => d.id === id ? data as unknown as Driver : d),
      }));
    }
  },
  
  deleteDriver: async (id) => {
    const { error } = await supabase.from('drivers').delete().eq('id', id);
    if (error) {
      console.error('删除驾驶员失败:', error);
    } else {
      set((state) => ({
        drivers: state.drivers.filter((d) => d.id !== id),
      }));
    }
  },
  
  // Maintenance Actions
  addMaintenance: async (maintenance) => {
    const companyId = get().currentCompanyId;
    const newMaintenance: Maintenance = { ...maintenance, id: generateId(), companyId: companyId || '', createdAt: now(), updatedAt: now() };
    const { data, error } = await supabase.from('maintenances').insert([newMaintenance]).select().single();
    if (error) {
      console.error('添加保养记录失败:', error);
    } else {
      set((state) => ({ maintenances: [...state.maintenances, data as unknown as Maintenance] }));
    }
  },
  
  updateMaintenance: async (id, updates) => {
    const { data, error } = await supabase.from('maintenances').update({ ...updates, updatedAt: now() }).eq('id', id).select().single();
    if (error) {
      console.error('更新保养记录失败:', error);
    } else {
      set((state) => ({
        maintenances: state.maintenances.map((m) => m.id === id ? data as unknown as Maintenance : m),
      }));
    }
  },
  
  deleteMaintenance: async (id) => {
    const { error } = await supabase.from('maintenances').delete().eq('id', id);
    if (error) {
      console.error('删除保养记录失败:', error);
    } else {
      set((state) => ({
        maintenances: state.maintenances.filter((m) => m.id !== id),
      }));
    }
  },
  
  // Insurance Actions
  addInsurance: async (insurance) => {
    const companyId = get().currentCompanyId;
    const newInsurance: Insurance = { ...insurance, id: generateId(), companyId: companyId || '', createdAt: now(), updatedAt: now() };
    const { data, error } = await supabase.from('insurances').insert([newInsurance]).select().single();
    if (error) {
      console.error('添加保险记录失败:', error);
    } else {
      set((state) => ({ insurances: [...state.insurances, data as unknown as Insurance] }));
    }
  },
  
  updateInsurance: async (id, updates) => {
    const { data, error } = await supabase.from('insurances').update({ ...updates, updatedAt: now() }).eq('id', id).select().single();
    if (error) {
      console.error('更新保险记录失败:', error);
    } else {
      set((state) => ({
        insurances: state.insurances.map((i) => i.id === id ? data as unknown as Insurance : i),
      }));
    }
  },
  
  deleteInsurance: async (id) => {
    const { error } = await supabase.from('insurances').delete().eq('id', id);
    if (error) {
      console.error('删除保险记录失败:', error);
    } else {
      set((state) => ({
        insurances: state.insurances.filter((i) => i.id !== id),
      }));
    }
  },
  
  // Fine Actions
  addFine: async (fine) => {
    const companyId = get().currentCompanyId;
    const newFine: Fine = { ...fine, id: generateId(), companyId: companyId || '', createdAt: now(), updatedAt: now() };
    const { data, error } = await supabase.from('fines').insert([newFine]).select().single();
    if (error) {
      console.error('添加罚款记录失败:', error);
    } else {
      set((state) => ({ fines: [...state.fines, data as unknown as Fine] }));
    }
  },
  
  updateFine: async (id, updates) => {
    const { data, error } = await supabase.from('fines').update({ ...updates, updatedAt: now() }).eq('id', id).select().single();
    if (error) {
      console.error('更新罚款记录失败:', error);
    } else {
      set((state) => ({
        fines: state.fines.map((f) => f.id === id ? data as unknown as Fine : f),
      }));
    }
  },
  
  deleteFine: async (id) => {
    const { error } = await supabase.from('fines').delete().eq('id', id);
    if (error) {
      console.error('删除罚款记录失败:', error);
    } else {
      set((state) => ({
        fines: state.fines.filter((f) => f.id !== id),
      }));
    }
  },
  
  // Repair Actions
  addRepair: async (repair) => {
    const companyId = get().currentCompanyId;
    const newRepair: Repair = { ...repair, id: generateId(), companyId: companyId || '', createdAt: now(), updatedAt: now() };
    const { data, error } = await supabase.from('repairs').insert([newRepair]).select().single();
    if (error) {
      console.error('添加维修记录失败:', error);
    } else {
      set((state) => ({ repairs: [...state.repairs, data as unknown as Repair] }));
    }
  },
  
  updateRepair: async (id, updates) => {
    const { data, error } = await supabase.from('repairs').update({ ...updates, updatedAt: now() }).eq('id', id).select().single();
    if (error) {
      console.error('更新维修记录失败:', error);
    } else {
      set((state) => ({
        repairs: state.repairs.map((r) => r.id === id ? data as unknown as Repair : r),
      }));
    }
  },
  
  deleteRepair: async (id) => {
    const { error } = await supabase.from('repairs').delete().eq('id', id);
    if (error) {
      console.error('删除维修记录失败:', error);
    } else {
      set((state) => ({
        repairs: state.repairs.filter((r) => r.id !== id),
      }));
    }
  },
  
  // Fuel Actions
  addFuelRecord: async (record) => {
    const companyId = get().currentCompanyId;
    const newRecord: FuelRecord = { ...record, id: generateId(), companyId: companyId || '', createdAt: now(), updatedAt: now() };
    const { data, error } = await supabase.from('fuel_records').insert([newRecord]).select().single();
    if (error) {
      console.error('添加燃油记录失败:', error);
    } else {
      set((state) => ({ fuelRecords: [...state.fuelRecords, data as unknown as FuelRecord] }));
    }
  },
  
  updateFuelRecord: async (id, updates) => {
    const { data, error } = await supabase.from('fuel_records').update({ ...updates, updatedAt: now() }).eq('id', id).select().single();
    if (error) {
      console.error('更新燃油记录失败:', error);
    } else {
      set((state) => ({
        fuelRecords: state.fuelRecords.map((r) => r.id === id ? data as unknown as FuelRecord : r),
      }));
    }
  },
  
  deleteFuelRecord: async (id) => {
    const { error } = await supabase.from('fuel_records').delete().eq('id', id);
    if (error) {
      console.error('删除燃油记录失败:', error);
    } else {
      set((state) => ({
        fuelRecords: state.fuelRecords.filter((r) => r.id !== id),
      }));
    }
  },
  
  // Inspection Actions
  addInspection: async (inspection) => {
    const companyId = get().currentCompanyId;
    const newInspection: Inspection = { ...inspection, id: generateId(), companyId: companyId || '', createdAt: now(), updatedAt: now() };
    const { data, error } = await supabase.from('inspections').insert([newInspection]).select().single();
    if (error) {
      console.error('添加年检记录失败:', error);
    } else {
      set((state) => ({ inspections: [...state.inspections, data as unknown as Inspection] }));
    }
  },
  
  updateInspection: async (id, updates) => {
    const { data, error } = await supabase.from('inspections').update({ ...updates, updatedAt: now() }).eq('id', id).select().single();
    if (error) {
      console.error('更新年检记录失败:', error);
    } else {
      set((state) => ({
        inspections: state.inspections.map((i) => i.id === id ? data as unknown as Inspection : i),
      }));
    }
  },
  
  deleteInspection: async (id) => {
    const { error } = await supabase.from('inspections').delete().eq('id', id);
    if (error) {
      console.error('删除年检记录失败:', error);
    } else {
      set((state) => ({
        inspections: state.inspections.filter((i) => i.id !== id),
      }));
    }
  },
  
  // Getters
  getCompanyVehicles: (companyId) => {
    return get().vehicles.filter((v) => v.companyId === companyId);
  },
  
  getVehicleById: (id) => {
    return get().vehicles.find((v) => v.id === id);
  },
  
  getDriverById: (id) => {
    return get().drivers.find((d) => d.id === id);
  },
  
  getVehicleMaintenances: (vehicleId) => {
    return get().maintenances
      .filter((m) => m.vehicleId === vehicleId)
      .sort((a, b) => new Date(b.maintenanceDate).getTime() - new Date(a.maintenanceDate).getTime());
  },
  
  getVehicleInsurances: (vehicleId) => {
    return get().insurances
      .filter((i) => i.vehicleId === vehicleId)
      .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
  },
  
  getVehicleFines: (vehicleId) => {
    return get().fines
      .filter((f) => f.vehicleId === vehicleId)
      .sort((a, b) => new Date(b.fineDate).getTime() - new Date(a.fineDate).getTime());
  },
  
  getVehicleRepairs: (vehicleId) => {
    return get().repairs
      .filter((r) => r.vehicleId === vehicleId)
      .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
  },
  
  getVehicleFuelRecords: (vehicleId) => {
    return get().fuelRecords
      .filter((r) => r.vehicleId === vehicleId)
      .sort((a, b) => new Date(b.fuelDate).getTime() - new Date(a.fuelDate).getTime());
  },
  
  getVehicleInspections: (vehicleId) => {
    return get().inspections
      .filter((i) => i.vehicleId === vehicleId)
      .sort((a, b) => new Date(b.inspectionDate).getTime() - new Date(a.inspectionDate).getTime());
  },
  
  getDashboardStats: () => {
    const state = get();
    const companyId = state.currentCompanyId;
    
    let vehicles = state.vehicles;
    if (companyId) {
      vehicles = vehicles.filter((v) => v.companyId === companyId);
    }
    
    const activeVehicles = vehicles.filter((v) => v.status === 'active');
    const inMaintenance = vehicles.filter((v) => v.status === 'maintenance');
    
    let drivers = state.drivers;
    if (companyId) {
      drivers = drivers.filter((d) => d.companyId === companyId);
    }
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const vehicleIds = vehicles.map((v) => v.id);
    
    const monthlyFuel = state.fuelRecords
      .filter((r) => vehicleIds.includes(r.vehicleId) && new Date(r.fuelDate) >= startOfMonth)
      .reduce((sum, r) => sum + r.totalCost, 0);
    
    const monthlyMaintenance = state.maintenances
      .filter((m) => vehicleIds.includes(m.vehicleId) && new Date(m.maintenanceDate) >= startOfMonth)
      .reduce((sum, m) => sum + m.totalCost, 0);
    
    const monthlyRepair = state.repairs
      .filter((r) => vehicleIds.includes(r.vehicleId) && r.actualCost && new Date(r.requestDate) >= startOfMonth)
      .reduce((sum, r) => sum + (r.actualCost || 0), 0);
    
    const monthlyFine = state.fines
      .filter((f) => vehicleIds.includes(f.vehicleId) && f.status === 'paid' && f.paidDate && new Date(f.paidDate) >= startOfMonth)
      .reduce((sum, f) => sum + (f.paidAmount || f.amount), 0);
    
    const monthlyInsurance = state.insurances
      .filter((i) => vehicleIds.includes(i.vehicleId) && new Date(i.startDate) >= startOfMonth)
      .reduce((sum, i) => sum + i.premium, 0);
    
    const pendingFines = state.fines.filter(
      (f) => vehicleIds.includes(f.vehicleId) && f.status === 'pending'
    );
    
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const upcomingInspections = state.inspections.filter(
      (i) => vehicleIds.includes(i.vehicleId) && new Date(i.expiryDate) <= thirtyDaysFromNow && new Date(i.expiryDate) >= now
    );
    
    const upcomingMaintenance = state.maintenances.filter(
      (m) => vehicleIds.includes(m.vehicleId) && m.nextMaintenanceDate && new Date(m.nextMaintenanceDate) <= thirtyDaysFromNow && new Date(m.nextMaintenanceDate) >= now
    );
    
    const expiringInsurance = state.insurances.filter(
      (i) => vehicleIds.includes(i.vehicleId) && i.status === 'active' && new Date(i.endDate) <= thirtyDaysFromNow
    );
    
    return {
      totalVehicles: vehicles.length,
      activeVehicles: activeVehicles.length,
      inMaintenance: inMaintenance.length,
      totalDrivers: drivers.length,
      monthlyFuelCost: monthlyFuel,
      monthlyMaintenanceCost: monthlyMaintenance,
      monthlyRepairCost: monthlyRepair,
      monthlyFineCost: monthlyFine,
      monthlyInsuranceCost: monthlyInsurance,
      pendingFines: pendingFines.length,
      pendingFinesAmount: pendingFines.reduce((sum, f) => sum + f.amount, 0),
      upcomingInspections: upcomingInspections.length,
      upcomingMaintenance: upcomingMaintenance.length,
      expiringInsurance: expiringInsurance.length,
    };
  },
}));
