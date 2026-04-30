import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Car,
  Users,
  Wrench,
  Shield,
  AlertTriangle,
  Settings,
  FileText,
  Fuel,
  ClipboardCheck,
  Menu,
  X,
  Building2,
  ChevronDown,
} from 'lucide-react';
import { useVehicleStore } from '../store/vehicleStore';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Vehicles', href: '/vehicles', icon: Car },
  { name: 'Drivers', href: '/drivers', icon: Users },
  { name: 'Maintenance', href: '/maintenance', icon: Wrench },
  { name: 'Insurance', href: '/insurance', icon: Shield },
  { name: 'Fines', href: '/fines', icon: AlertTriangle },
  { name: 'Repairs', href: '/repairs', icon: Settings },
  { name: 'Fuel', href: '/fuel', icon: Fuel },
  { name: 'Inspections', href: '/inspections', icon: ClipboardCheck },
  { name: 'Reports', href: '/reports', icon: FileText },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const { companies, currentCompanyId, setCurrentCompany } = useVehicleStore();
  const currentCompany = companies.find((c) => c.id === currentCompanyId);
  

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-gray-900/50" 
            onClick={() => setSidebarOpen(false)} 
          />
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between px-6 border-b">
              <span className="text-xl font-bold text-primary-600">FleetPro</span>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>
            <nav className="mt-4 px-3 space-y-1">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    isActive
                      ? 'sidebar-link-active'
                      : 'sidebar-link-inactive'
                  }
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-1 bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-6 border-b border-gray-200">
            <span className="text-xl font-bold text-primary-600">FleetPro</span>
          </div>
          <nav className="flex-1 mt-4 px-3 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  isActive
                    ? 'sidebar-link-active'
                    : 'sidebar-link-inactive'
                }
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </NavLink>
            ))}
          </nav>
          <div className="p-4 border-t border-gray-200">
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                isActive
                  ? 'sidebar-link-active'
                  : 'sidebar-link-inactive'
              }
            >
              <Settings className="mr-3 h-5 w-5" />
              Settings
            </NavLink>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-500 hover:text-gray-700"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
            
            {/* Company Selector */}
            <div className="flex items-center space-x-4">
              {companies.length > 0 && (
                <div className="relative">
                  <select
                    value={currentCompanyId || ''}
                    onChange={(e) => setCurrentCompany(e.target.value)}
                    className="appearance-none bg-gray-50 border border-gray-300 rounded-lg py-2 pl-10 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">All Companies</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name} ({company.country === 'SA' ? 'SA' : 'AE'})
                      </option>
                    ))}
                  </select>
                  <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
                </div>
              )}
              
              {currentCompany && (
                <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
                  <span className="font-medium">{currentCompany.city}</span>
                  <span className="text-gray-400">|</span>
                  <span>{currentCompany.currency}</span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="py-6 px-4 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
