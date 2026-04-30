import { useState } from 'react';
import { Building2, Plus, Trash2, Database, Check, Loader2 } from 'lucide-react';
import { useVehicleStore } from '../store/vehicleStore';
import { seedDemoData } from '../lib/seedData';
import type { Company } from '../types';

export default function SettingsPage() {
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoLoaded, setDemoLoaded] = useState(false);
  const [showCompanyForm, setShowCompanyForm] = useState(false);

  const store = useVehicleStore();
  const { companies, addCompany, loadCompanies } = store;

  const handleLoadDemo = async () => {
    if (!confirm('Load demo data? This will add sample companies, vehicles, drivers and records to Supabase.')) return;
    setDemoLoading(true);
    try {
      await seedDemoData();
      await loadCompanies();
      const state = useVehicleStore.getState();
      if (state.companies.length > 0) {
        const firstCompany = state.companies[0];
        store.setCurrentCompany(firstCompany.id);
      }
      setDemoLoaded(true);
    } catch (err) {
      console.error('Demo data error:', err);
      alert('Error loading demo data. Check console.');
    }
    setDemoLoading(false);
  };

  const handleAddCompany = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    addCompany({
      name: fd.get('name') as string,
      country: fd.get('country') as 'SA' | 'AE',
      city: fd.get('city') as string,
      currency: fd.get('currency') as 'SAR' | 'AED',
      timezone: fd.get('timezone') as string,
    });
    setShowCompanyForm(false);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-description">Manage companies and application preferences</p>
      </div>

      {/* Demo Data */}
      <div className="card mb-8">
        <div className="card-header flex items-center justify-between">
          <div className="flex items-center">
            <Database className="h-5 w-5 text-primary-600 mr-2" />
            <h3 className="text-base font-medium">Demo Data</h3>
          </div>
        </div>
        <div className="card-body">
          <p className="text-sm text-gray-600 mb-4">
            Load sample data for a Riyadh (KSA) and Dubai (UAE) company to explore all features.
          </p>
          {demoLoaded ? (
            <div className="flex items-center text-success-600">
              <Check className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Demo data loaded! Select a company to explore.</span>
            </div>
          ) : demoLoading ? (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading demo data to Supabase...</span>
            </div>
          ) : (
            <button onClick={handleLoadDemo} className="btn-primary">
              <Database className="h-4 w-4 mr-2" />Load Demo Data
            </button>
          )}
        </div>
      </div>

      {/* Companies */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <div className="flex items-center">
            <Building2 className="h-5 w-5 text-primary-600 mr-2" />
            <h3 className="text-base font-medium">Companies</h3>
          </div>
          <button onClick={() => setShowCompanyForm(true)} className="btn-primary btn-sm">
            <Plus className="h-4 w-4 mr-2" />Add Company
          </button>
        </div>
        <div className="card-body">
          {companies.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Building2 className="h-10 w-10 mx-auto mb-3 text-gray-300" />
              <p>No companies yet. Add a company or load demo data to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {companies.map((company) => (
                <div key={company.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center mr-4">
                      <span className="text-lg">{company.country === 'SA' ? '🇸🇦' : '🇦🇪'}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{company.name}</p>
                      <p className="text-sm text-gray-500">{company.city} · {company.currency} · {company.timezone}</p>
                    </div>
                  </div>
                  <span className={`badge ${company.country === 'SA' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {company.country === 'SA' ? 'Saudi Arabia' : 'UAE'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Company Modal */}
      {showCompanyForm && (
        <div className="modal-container">
          <div className="modal-overlay" onClick={() => setShowCompanyForm(false)} />
          <div className="modal-content">
            <div className="modal-panel">
              <form onSubmit={handleAddCompany}>
                <div className="modal-header">
                  <h3 className="text-lg font-medium">Add Company</h3>
                </div>
                <div className="modal-body">
                  <div className="space-y-4">
                    <div className="form-group">
                      <label className="form-label">Company Name *</label>
                      <input name="name" type="text" required className="input" placeholder="e.g. ABC Corp – Riyadh" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Country *</label>
                      <select name="country" required defaultValue="AE" className="select" onChange={(e) => {
                        const form = e.currentTarget.form;
                        if (form) {
                          const currencyField = form.elements.namedItem('currency') as HTMLSelectElement;
                          const timezoneField = form.elements.namedItem('timezone') as HTMLInputElement;
                          if (e.target.value === 'SA') {
                            currencyField.value = 'SAR';
                            timezoneField.value = 'Asia/Riyadh';
                          } else {
                            currencyField.value = 'AED';
                            timezoneField.value = 'Asia/Dubai';
                          }
                        }
                      }}>
                        <option value="SA">Saudi Arabia</option>
                        <option value="AE">UAE</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">City *</label>
                      <input name="city" type="text" required className="input" placeholder="e.g. Riyadh, Dubai" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Currency *</label>
                      <select name="currency" required defaultValue="AED" className="select">
                        <option value="SAR">SAR – Saudi Riyal</option>
                        <option value="AED">AED – UAE Dirham</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Timezone *</label>
                      <input name="timezone" type="text" required defaultValue="Asia/Dubai" className="input" />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" onClick={() => setShowCompanyForm(false)} className="btn-secondary mr-3">Cancel</button>
                  <button type="submit" className="btn-primary">Add Company</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
