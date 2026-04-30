-- FleetPro 数据库建表 SQL（最终正确版）
-- 在 Supabase SQL Editor 中执行

DROP TABLE IF EXISTS inspections CASCADE;
DROP TABLE IF EXISTS fuel_records CASCADE;
DROP TABLE IF EXISTS repairs CASCADE;
DROP TABLE IF EXISTS fines CASCADE;
DROP TABLE IF EXISTS insurances CASCADE;
DROP TABLE IF EXISTS maintenances CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS drivers CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- 1. companies
CREATE TABLE companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  "nameAr" TEXT,
  country TEXT CHECK (country IN ('SA', 'AE')) NOT NULL,
  city TEXT NOT NULL,
  currency TEXT CHECK (currency IN ('SAR', 'AED')) NOT NULL,
  timezone TEXT DEFAULT 'Asia/Riyadh',
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-- 2. drivers
CREATE TABLE drivers (
  id TEXT PRIMARY KEY,
  "companyId" TEXT REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  "nameAr" TEXT,
  "licenseNumber" TEXT,
  "licenseIssueDate" DATE,
  "licenseExpiryDate" DATE,
  "licenseType" TEXT[],
  phone TEXT,
  email TEXT,
  nationality TEXT,
  "dateOfBirth" DATE,
  "joinDate" DATE,
  status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-- 3. vehicles
CREATE TABLE vehicles (
  id TEXT PRIMARY KEY,
  "companyId" TEXT REFERENCES companies(id) ON DELETE CASCADE,
  "plateNumber" TEXT NOT NULL,
  "plateCountry" TEXT CHECK ("plateCountry" IN ('SA', 'AE')) DEFAULT 'SA',
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  vin TEXT,
  color TEXT,
  "engineNumber" TEXT,
  "purchaseDate" DATE,
  "purchasePrice" NUMERIC,
  "currentMileage" INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('active', 'maintenance', 'inactive', 'retired')) DEFAULT 'active',
  "assignedDriverId" TEXT REFERENCES drivers(id) ON DELETE SET NULL,
  department TEXT,
  "fuelType" TEXT CHECK ("fuelType" IN ('petrol', 'diesel', 'hybrid', 'electric')) DEFAULT 'petrol',
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-- 4. maintenances (添加 companyId)
CREATE TABLE maintenances (
  id TEXT PRIMARY KEY,
  "vehicleId" TEXT REFERENCES vehicles(id) ON DELETE CASCADE,
  "companyId" TEXT REFERENCES companies(id) ON DELETE CASCADE,
  "maintenanceDate" DATE NOT NULL,
  mileage INTEGER,
  type TEXT CHECK (type IN ('routine', 'repair', 'inspection')) NOT NULL,
  items JSONB DEFAULT '[]'::jsonb,
  "totalCost" NUMERIC,
  provider TEXT,
  "providerPhone" TEXT,
  notes TEXT,
  "nextMaintenanceDate" DATE,
  "nextMaintenanceMileage" INTEGER,
  "performedBy" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-- 5. insurances (添加 companyId)
CREATE TABLE insurances (
  id TEXT PRIMARY KEY,
  "vehicleId" TEXT REFERENCES vehicles(id) ON DELETE CASCADE,
  "companyId" TEXT REFERENCES companies(id) ON DELETE CASCADE,
  "policyNumber" TEXT NOT NULL,
  company TEXT NOT NULL,
  "companyPhone" TEXT,
  type TEXT CHECK (type IN ('third_party', 'comprehensive')) NOT NULL,
  "startDate" DATE NOT NULL,
  "endDate" DATE NOT NULL,
  premium NUMERIC,
  "coverageAmount" NUMERIC,
  status TEXT CHECK (status IN ('active', 'expired', 'cancelled')) DEFAULT 'active',
  documents TEXT[],
  notes TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-- 6. fines (添加 companyId)
CREATE TABLE fines (
  id TEXT PRIMARY KEY,
  "vehicleId" TEXT REFERENCES vehicles(id) ON DELETE CASCADE,
  "companyId" TEXT REFERENCES companies(id) ON DELETE CASCADE,
  "driverId" TEXT REFERENCES drivers(id) ON DELETE SET NULL,
  "fineNumber" TEXT,
  "fineDate" DATE NOT NULL,
  "violationType" TEXT CHECK ("violationType" IN ('speeding', 'parking', 'red_light', 'seatbelt', 'phone', 'other')) NOT NULL,
  "violationDetails" TEXT,
  location TEXT,
  amount NUMERIC NOT NULL,
  status TEXT CHECK (status IN ('pending', 'paid', 'disputed')) DEFAULT 'pending',
  "paidDate" DATE,
  "paidAmount" NUMERIC,
  documents TEXT[],
  notes TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-- 7. repairs (添加 companyId)
CREATE TABLE repairs (
  id TEXT PRIMARY KEY,
  "vehicleId" TEXT REFERENCES vehicles(id) ON DELETE CASCADE,
  "companyId" TEXT REFERENCES companies(id) ON DELETE CASCADE,
  "requestDate" DATE NOT NULL,
  "startDate" DATE,
  "completionDate" DATE,
  description TEXT NOT NULL,
  diagnosis TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
  "estimatedCost" NUMERIC,
  "actualCost" NUMERIC,
  provider TEXT,
  "providerPhone" TEXT,
  parts JSONB DEFAULT '[]'::jsonb,
  "laborCost" NUMERIC DEFAULT 0,
  notes TEXT,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-- 8. fuel_records (添加 companyId)
CREATE TABLE fuel_records (
  id TEXT PRIMARY KEY,
  "vehicleId" TEXT REFERENCES vehicles(id) ON DELETE CASCADE,
  "companyId" TEXT REFERENCES companies(id) ON DELETE CASCADE,
  "fuelDate" DATE NOT NULL,
  mileage INTEGER,
  liters NUMERIC NOT NULL,
  "pricePerLiter" NUMERIC NOT NULL,
  "totalCost" NUMERIC NOT NULL,
  station TEXT,
  "fuelCardId" TEXT,
  "receiptNumber" TEXT,
  "fullTank" BOOLEAN DEFAULT true,
  notes TEXT,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-- 9. inspections (添加 companyId)
CREATE TABLE inspections (
  id TEXT PRIMARY KEY,
  "vehicleId" TEXT REFERENCES vehicles(id) ON DELETE CASCADE,
  "companyId" TEXT REFERENCES companies(id) ON DELETE CASCADE,
  "inspectionDate" DATE NOT NULL,
  "expiryDate" DATE NOT NULL,
  result TEXT CHECK (result IN ('pass', 'fail', 'conditional')) NOT NULL,
  center TEXT,
  "centerLocation" TEXT,
  cost NUMERIC,
  "certificateNumber" TEXT,
  notes TEXT,
  documents TEXT[],
  "nextInspectionDate" DATE,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

-- 禁用行级安全
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE drivers DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE maintenances DISABLE ROW LEVEL SECURITY;
ALTER TABLE insurances DISABLE ROW LEVEL SECURITY;
ALTER TABLE fines DISABLE ROW LEVEL SECURITY;
ALTER TABLE repairs DISABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE inspections DISABLE ROW LEVEL SECURITY;

-- 授权 anon 角色
GRANT ALL ON companies TO anon;
GRANT ALL ON drivers TO anon;
GRANT ALL ON vehicles TO anon;
GRANT ALL ON maintenances TO anon;
GRANT ALL ON insurances TO anon;
GRANT ALL ON fines TO anon;
GRANT ALL ON repairs TO anon;
GRANT ALL ON fuel_records TO anon;
GRANT ALL ON inspections TO anon;

-- 更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER update_maintenances_updated_at BEFORE UPDATE ON maintenances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER update_insurances_updated_at BEFORE UPDATE ON insurances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER update_fines_updated_at BEFORE UPDATE ON fines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER update_repairs_updated_at BEFORE UPDATE ON repairs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER update_fuel_records_updated_at BEFORE UPDATE ON fuel_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE OR REPLACE TRIGGER update_inspections_updated_at BEFORE UPDATE ON inspections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 刷新 REST API schema 缓存
SELECT pg_notify('pgrst', 'reload schema');
