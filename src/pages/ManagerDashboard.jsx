import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { 
  LayoutDashboard, 
  Users, 
  MapPin, 
  ClipboardList, 
  AlertCircle,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    locationCount: 0,
    reportCount: 0,
    abnormalCount: 0,
    userCount: 0
  });
  const [recentReports, setRecentReports] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // 1. 抓取統計數據 (這裡假設你有這些 collection)
        const locationsSnap = await getDocs(collection(db, "locations"));
        const reportsSnap = await getDocs(collection(db, "reports"));
        const usersSnap = await getDocs(collection(db, "users"));
        
        // 篩選異常報告 (假設報告中有一個 status 欄位)
        const abnormal = reportsSnap.docs.filter(doc => doc.data().status === 'abnormal');

        setStats({
          locationCount: locationsSnap.size,
          reportCount: reportsSnap.size,
          abnormalCount: abnormal.length,
          userCount: usersSnap.size
        });

        // 2. 抓取最近 5 筆巡檢紀錄
        const q = query(collection(db, "reports"), orderBy("timestamp", "desc"), limit(5));
        const recentSnap = await getDocs(q);
        setRecentReports(recentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
      } catch (error) {
        console.error("抓取儀表板資料失敗:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">載入數據中...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* 頂部導覽列 */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2 font-bold text-xl text-slate-800">
          <LayoutDashboard className="text-blue-600" />
          主管後台
        </div>
        <button 
          onClick={logout}
          className="flex items-center gap-2 text-slate-500 hover:text-red-600 transition"
        >
          <LogOut size={20} />
          <span className="hidden sm:inline">登出系統</span>
        </button>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        {/* 統計數字區 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="巡檢地點" value={stats.locationCount} icon={<MapPin className="text-blue-600" />} />
          <StatCard title="累計報告" value={stats.reportCount} icon={<ClipboardList className="text-green-600" />} />
          <StatCard title="異常件數" value={stats.abnormalCount} icon={<AlertCircle className="text-red-600" />} color="text-red-600" />
          <StatCard title="工作人員" value={stats.userCount} icon={<Users className="text-purple-600" />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左側：最近巡檢紀錄 */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-bold text-slate-800">最新巡檢動態</h2>
              <button className="text-blue-600 text-sm font-medium hover:underline">查看全部</button>
            </div>
            <div className="divide-y divide-slate-50">
              {recentReports.length > 0 ? recentReports.map((report) => (
                <div key={report.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-700">{report.locationName}</span>
                    <span className="text-xs text-slate-400">{report.inspectorName} · {new Date(report.timestamp?.seconds * 1000).toLocaleString()}</span>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${report.status === 'normal' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {report.status === 'normal' ? '正常' : '異常'}
                  </div>
                </div>
              )) : (
                <div className="p-10 text-center text-slate-400">尚無巡檢紀錄</div>
              )}
            </div>
          </div>

          {/* 右側：快速操作 */}
          <div className="space-y-4">
            <h2 className="font-bold text-slate-800 px-2">快速管理</h2>
            <ActionButton 
              title="人員帳號管理" 
              subtitle="修改權限、重設密碼" 
              onClick={() => navigate('/admin/users')}
              icon={<Users className="text-slate-600" />}
            />
            <ActionButton 
              title="巡檢地點設定" 
              subtitle="新增或編輯掃描點" 
              onClick={() => navigate('/dashboard')}
              icon={<MapPin className="text-slate-600" />}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

// 子組件：統計卡片
const StatCard = ({ title, value, icon, color = "text-slate-800" }) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
    <div className="flex items-center justify-between mb-2">
      <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
    </div>
    <p className="text-slate-500 text-sm font-medium">{title}</p>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
  </div>
);

// 子組件：操作按鈕
const ActionButton = ({ title, subtitle, onClick, icon }) => (
  <button 
    onClick={onClick}
    className="w-full bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-blue-300 hover:bg-blue-50 transition text-left group"
  >
    <div className="p-3 bg-slate-100 rounded-xl group-hover:bg-white transition">{icon}</div>
    <div className="flex-1">
      <p className="font-bold text-slate-800">{title}</p>
      <p className="text-xs text-slate-500">{subtitle}</p>
    </div>
    <ChevronRight className="text-slate-300 group-hover:text-blue-500" size={18} />
  </button>
);

export default ManagerDashboard;