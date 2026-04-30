import { supabase } from './supabase';

const now = () => new Date().toISOString();
const genId = () => Math.random().toString(36).substring(2, 15);

export async function seedDemoData() {
  const saId = genId();
  const aeId = genId();
  const dSAId = genId();
  const dAEId = genId();
  const v1SAId = genId();
  const v2SAId = genId();
  const v1AEId = genId();
  const v2AEId = genId();

  // 1. Companies
  await supabase.from('companies').insert([
    { id: saId, name: 'ABC Corp – Riyadh', country: 'SA', city: 'Riyadh', currency: 'SAR', timezone: 'Asia/Riyadh', createdAt: now(), updatedAt: now() },
    { id: aeId, name: 'ABC Corp – Dubai', country: 'AE', city: 'Dubai', currency: 'AED', timezone: 'Asia/Dubai', createdAt: now(), updatedAt: now() },
  ]).select();

  // 2. Drivers
  await supabase.from('drivers').insert([
    { id: dSAId, companyId: saId, name: 'Abdullah Al-Rasheed', licenseNumber: 'SA-123456', licenseIssueDate: '2020-01-15', licenseExpiryDate: '2026-01-15', licenseType: ['Light'], phone: '+966501234567', joinDate: '2021-03-01', status: 'active', createdAt: now(), updatedAt: now() },
    { id: dAEId, companyId: aeId, name: 'Mohammed Khalid', licenseNumber: 'AE-789012', licenseIssueDate: '2021-06-01', licenseExpiryDate: '2026-06-01', licenseType: ['Light', 'Heavy'], phone: '+971501234567', joinDate: '2022-01-01', status: 'active', createdAt: now(), updatedAt: now() },
  ]).select();

  // 3. Vehicles
  await supabase.from('vehicles').insert([
    { id: v1SAId, companyId: saId, plateNumber: 'أ ب ج 1234', plateCountry: 'SA', brand: 'Toyota', model: 'Land Cruiser', year: 2022, color: 'White', purchaseDate: '2022-03-15', purchasePrice: 185000, currentMileage: 42000, status: 'active', assignedDriverId: dSAId, department: 'Operations', fuelType: 'petrol', createdAt: now(), updatedAt: now() },
    { id: v2SAId, companyId: saId, plateNumber: 'د ه و 5678', plateCountry: 'SA', brand: 'Ford', model: 'F-150', year: 2021, color: 'Silver', purchaseDate: '2021-06-10', purchasePrice: 145000, currentMileage: 78000, status: 'active', department: 'Logistics', fuelType: 'petrol', createdAt: now(), updatedAt: now() },
    { id: v1AEId, companyId: aeId, plateNumber: 'Dubai A 12345', plateCountry: 'AE', brand: 'GMC', model: 'Yukon', year: 2023, color: 'Black', purchaseDate: '2023-01-20', purchasePrice: 220000, currentMileage: 18000, status: 'active', assignedDriverId: dAEId, department: 'Executive', fuelType: 'petrol', createdAt: now(), updatedAt: now() },
    { id: v2AEId, companyId: aeId, plateNumber: 'Dubai B 67890', plateCountry: 'AE', brand: 'Toyota', model: 'Camry', year: 2020, color: 'Grey', purchaseDate: '2020-09-05', purchasePrice: 85000, currentMileage: 115000, status: 'maintenance', department: 'Admin', fuelType: 'petrol', createdAt: now(), updatedAt: now() },
  ]).select();

  // 4. Insurances
  await supabase.from('insurances').insert([
    { id: genId(), vehicleId: v1SAId, companyId: saId, policyNumber: 'POL-SA-2024-001', company: 'Tawuniya', type: 'comprehensive', startDate: '2024-03-15', endDate: '2025-03-15', premium: 3200, coverageAmount: 185000, status: 'active', createdAt: now(), updatedAt: now() },
    { id: genId(), vehicleId: v2SAId, companyId: saId, policyNumber: 'POL-SA-2024-002', company: 'SABB Takaful', type: 'third_party', startDate: '2024-06-10', endDate: '2025-06-10', premium: 1800, coverageAmount: 0, status: 'active', createdAt: now(), updatedAt: now() },
    { id: genId(), vehicleId: v1AEId, companyId: aeId, policyNumber: 'POL-AE-2024-001', company: 'ADNIC', type: 'comprehensive', startDate: '2024-01-20', endDate: '2025-01-20', premium: 4100, coverageAmount: 220000, status: 'active', createdAt: now(), updatedAt: now() },
    { id: genId(), vehicleId: v2AEId, companyId: aeId, policyNumber: 'POL-AE-2023-002', company: 'AXA Gulf', type: 'comprehensive', startDate: '2023-09-05', endDate: '2026-05-15', premium: 2600, coverageAmount: 85000, status: 'active', createdAt: now(), updatedAt: now() },
  ]).select();

  // 5. Maintenances
  await supabase.from('maintenances').insert([
    { id: genId(), vehicleId: v1SAId, companyId: saId, maintenanceDate: '2024-10-01', mileage: 35000, type: 'routine', items: [{ name: 'Oil Change', cost: 350 }, { name: 'Oil Filter', cost: 120 }, { name: 'Air Filter', cost: 180 }], totalCost: 650, provider: 'Toyota Service Centre Riyadh', nextMaintenanceDate: '2025-04-01', nextMaintenanceMileage: 45000, createdAt: now(), updatedAt: now() },
    { id: genId(), vehicleId: v2SAId, companyId: saId, maintenanceDate: '2024-09-15', mileage: 70000, type: 'routine', items: [{ name: 'Full Service', cost: 1200 }, { name: 'Brake Pads', cost: 600 }], totalCost: 1800, provider: 'Al-Jazirah Ford', nextMaintenanceDate: '2025-03-15', createdAt: now(), updatedAt: now() },
    { id: genId(), vehicleId: v1AEId, companyId: aeId, maintenanceDate: '2024-11-10', mileage: 15000, type: 'routine', items: [{ name: 'Oil Change', cost: 380 }, { name: 'Tire Rotation', cost: 200 }], totalCost: 580, provider: 'Al-Futtaim GMC Dubai', nextMaintenanceDate: '2025-05-10', createdAt: now(), updatedAt: now() },
    { id: genId(), vehicleId: v2AEId, companyId: aeId, maintenanceDate: '2024-08-20', mileage: 105000, type: 'repair', items: [{ name: 'AC Compressor Replacement', cost: 3500 }], totalCost: 3500, provider: 'Emirates Motor Co.', createdAt: now(), updatedAt: now() },
  ]).select();

  // 6. Fines
  await supabase.from('fines').insert([
    { id: genId(), vehicleId: v1SAId, companyId: saId, driverId: dSAId, fineNumber: 'MRF-2024-0012', fineDate: '2024-11-05', violationType: 'speeding', location: 'King Fahd Road, Riyadh', amount: 500, status: 'paid', paidDate: '2024-11-12', paidAmount: 500, createdAt: now(), updatedAt: now() },
    { id: genId(), vehicleId: v2SAId, companyId: saId, fineDate: '2024-12-01', violationType: 'parking', location: 'Olaya, Riyadh', amount: 200, status: 'pending', createdAt: now(), updatedAt: now() },
    { id: genId(), vehicleId: v1AEId, companyId: aeId, driverId: dAEId, fineNumber: 'RTA-2024-5678', fineDate: '2024-10-22', violationType: 'red_light', location: 'Sheikh Zayed Road, Dubai', amount: 800, status: 'paid', paidDate: '2024-10-28', paidAmount: 800, createdAt: now(), updatedAt: now() },
    { id: genId(), vehicleId: v2AEId, companyId: aeId, fineDate: '2025-01-15', violationType: 'parking', location: 'DIFC, Dubai', amount: 400, status: 'pending', createdAt: now(), updatedAt: now() },
  ]).select();

  // 7. Repairs
  await supabase.from('repairs').insert([
    { id: genId(), vehicleId: v2AEId, companyId: aeId, requestDate: '2024-08-18', startDate: '2024-08-19', completionDate: '2024-08-22', description: 'AC not cooling, engine check light on', diagnosis: 'Faulty AC compressor, replaced under warranty', priority: 'high', status: 'completed', estimatedCost: 3800, actualCost: 3500, provider: 'Emirates Motor Co.', parts: [{ name: 'AC Compressor', partNumber: 'TOY-AC-88912', quantity: 1, unitCost: 2800, totalCost: 2800 }], laborCost: 700, createdBy: 'Admin', createdAt: now(), updatedAt: now() },
    { id: genId(), vehicleId: v1SAId, companyId: saId, requestDate: '2025-01-10', description: 'Windscreen crack', priority: 'medium', status: 'pending', estimatedCost: 900, provider: 'Auto Glass Riyadh', parts: [], laborCost: 0, createdBy: 'Admin', createdAt: now(), updatedAt: now() },
  ]).select();

  // 8. Fuel Records
  const fuelTy = (vid: string, date: string, km: number, liters: number, price: number, station: string) => ({
    id: genId(), vehicleId: vid, companyId: vid === v1SAId || vid === v2SAId ? saId : aeId,
    fuelDate: date, mileage: km, liters, pricePerLiter: price, totalCost: liters * price,
    station, fullTank: true, createdBy: 'Demo', createdAt: now(), updatedAt: now(),
  });
  await supabase.from('fuel_records').insert([
    fuelTy(v1SAId, '2024-11-01', 38000, 65, 0.91, 'Aramco Station'),
    fuelTy(v1SAId, '2024-11-20', 40500, 60, 0.91, 'Aramco Station'),
    fuelTy(v2SAId, '2024-11-05', 73000, 80, 0.91, 'Aramco Station'),
    fuelTy(v2SAId, '2024-11-25', 76000, 75, 0.91, 'Aramco Station'),
    fuelTy(v1AEId, '2024-11-03', 16000, 70, 2.98, 'ENOC Dubai'),
    fuelTy(v1AEId, '2024-11-22', 17800, 65, 2.98, 'ENOC Dubai'),
    fuelTy(v2AEId, '2024-11-10', 110000, 50, 2.89, 'ENOC Dubai'),
  ]).select();

  // 9. Inspections
  await supabase.from('inspections').insert([
    { id: genId(), vehicleId: v1SAId, companyId: saId, inspectionDate: '2024-03-10', expiryDate: '2025-03-10', result: 'pass', center: 'Fahas – Riyadh South', centerLocation: 'Riyadh', cost: 120, createdAt: now(), updatedAt: now() },
    { id: genId(), vehicleId: v2SAId, companyId: saId, inspectionDate: '2024-06-05', expiryDate: '2025-06-05', result: 'pass', center: 'Fahas – Riyadh North', centerLocation: 'Riyadh', cost: 120, createdAt: now(), updatedAt: now() },
    { id: genId(), vehicleId: v2AEId, companyId: aeId, inspectionDate: '2024-09-01', expiryDate: '2025-05-01', result: 'conditional', center: 'Tajdeed VTC', centerLocation: 'Dubai', cost: 150, notes: 'Minor brake adjustment required within 30 days', createdAt: now(), updatedAt: now() },
  ]).select();
}
