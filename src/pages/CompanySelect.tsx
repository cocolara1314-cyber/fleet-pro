import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVehicleStore } from '../store/vehicleStore';
import { seedDemoData } from '../lib/seedData';

export default function CompanySelect() {
  const { companies, loading, loadCompanies, setCurrentCompany } = useVehicleStore();
  const navigate = useNavigate();
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    loadCompanies();
  }, []);

  const handleSelect = (id: string) => {
    setCurrentCompany(id);
    navigate('/');
  };

  const handleSeedDemo = async () => {
    if (!confirm('创建示范数据？这将向 Supabase 写入示例公司、车辆、司机等数据。')) return;
    setSeeding(true);
    try {
      console.log('开始创建示范数据...');
      await seedDemoData();
      console.log('示范数据创建完成，正在加载公司列表...');
      await loadCompanies();
      const state = useVehicleStore.getState();
      console.log('公司列表:', state.companies);
      if (state.companies.length > 0) {
        console.log('自动选择公司:', state.companies[0].name);
        handleSelect(state.companies[0].id);
      } else {
        alert('数据已创建，但无法加载公司列表，请刷新页面。');
      }
    } catch (err: any) {
      console.error('创建示范数据失败:', err);
      alert('创建示范数据失败：' + (err.message || err));
    }
    setSeeding(false);
  };

  const formatCurrency = (country: string) =>
    country === 'SA' ? 'SAR' : 'AED';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-3">
      <div className="w-full max-w-2l">
        <h1 className="text-2l font-bold text-center text-gray-800 mb-2">FleetPro</h1>
        <p className="text-center text-gray-500 mb-8">选择您的公司/地区</p>

        {loading || seeding ? (
          <div className="text-center py-12 text-gray-400">{seeding ? '正在创建示范数据...' : '加载中...'}</div>
        ) : companies.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">尚未创建公司信息</p>
            <button
              onClick={handleSeedDemo}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              创建示范公司
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {companies.map((c) => (
              <button
                key={c.id}
                onClick={() => handleSelect(c.id)}
                className="text-left p-6 bg-white rounded-xl border border-gray-200 hover:border-primary-500 hover:shadow-md transition"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{c.country === 'SA' ? '🇸🇦' : '🇦🇪'}</span>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">{c.name}</h2>
                    {c.nameAr && (
                      <p className="text-sm text-gray-500" dir="rtl">{c.nameAr}</p>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-500">{c.city} · {formatCurrency(c.country)}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
