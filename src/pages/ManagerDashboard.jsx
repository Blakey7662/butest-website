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
  LogOut,
  ShieldCheck
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
        // 並行抓取所有需要的統計數據，提升載入速度
        const [locs, reps, usrs] = await Promise.all([
          getDocs(collection(db, "locations")),
          getDocs(collection(db, "reports")),
          getDocs(collection(db, "users"))
        ]);
        
        // 篩選異常狀態的報告
        const abnormal = reps.docs.filter(d => d.data().status === 'abnormal');

        setStats({
          locationCount: locs.size,
          reportCount: reps.size,
          abnormalCount: abnormal.length,
          userCount: usrs.size
        });

        // 抓取最近 5 筆巡檢報告
        const q = query(collection(db, "reports"), orderBy("timestamp", "desc"), limit(5));
        const recentSnap = await getDocs(q);
        setRecentReports(recentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Dashboard 資料抓取失敗:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="h-screen bg-[#020617] flex items-center justify-center text-blue-400 font-medium">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          正在同步管理數據...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-12">
      {/* 頂部導覽列 */}
      <nav className="bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2 font-bold text-xl text-white">
          <ShieldCheck className="text-blue-500" />
          控制台 <span className="text-slate-500 font-light text-sm ml-2">v1.0</span>
        </div>
        <button 
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-red-900/30 hover:text-red-400 transition-all text-slate-400 text-sm font-medium"
        >
          <LogOut size={18} />
          <span>登出系統</span>
        </button>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        {/* 數據卡片區 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="巡檢地點" value={stats.locationCount} icon={<MapPin size={20}/>} color="blue" />
          <StatCard title="累計報告" value={stats.reportCount} icon={<ClipboardList size={20}/>} color="indigo" />
          <StatCard title="異常件數" value={stats.abnormalCount} icon={<AlertCircle size={20}/>} color="red" isAlert={stats.abnormalCount > 0} />
          <StatCard title="工作人員" value={stats.userCount} icon={<Users size={20}/>} color="slate" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左側：最新巡檢動態 */}
          <div className="lg:col-span-2 bg-[#0f172a] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
              <h2 className="font-bold text-white flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                即時巡檢動態
              </h2>
            </div>
            <div className="divide-y divide-slate-800">
              {recentReports.length > 0 ? recentReports.map((report) => (
                <div key={report.id} className="p-4 flex items-center justify-between hover:bg-slate-800/50 transition cursor-default">
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-200">{report.locationName}</span>
                    <span className="text-[11px] text-slate-500 mt-1">
                      {report.inspectorName} · {report.timestamp ? new Date(report.timestamp.seconds * 1000).toLocaleString() : '時間未知'}
                    </span>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    report.status === 'normal' 
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {report.status === 'normal' ? '正常' : '異常'}
                  </div>
                </div>
              )) : (
                <div className="p-20 text-center text-slate-600 italic">目前尚無任何巡檢資料</div>
              )}
            </div>
          </div>

          {/* 右側：系統管理與快速跳轉 */}
          <div className="space-y-4">
            <h2 className="font-bold text-slate-400 px-2 text-[10px] uppercase tracking-widest">系統管理面板</h2>
            
            <ActionButton 
              title="人員帳號管理" 
              subtitle="權限審核、角色設定與帳號刪除" 
              onClick={() => navigate('/admin/users')}
              icon={<Users className="text-blue-400" />}
            />
            
            <ActionButton 
              title="巡檢地點設定" 
              subtitle="新增掃描點、編輯地點與描述" 
              onClick={() => navigate('/admin/locations')} // 👈 這裡已修正路徑
              icon={<MapPin className="text-indigo-400" />}
            />
            
            <div className="mt-8 p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10">
              <p className="text-[10px] text-blue-400/60 leading-relaxed uppercase tracking-tighter">
                提示：管理員可透過「人員管理」直接修改帳號角色代碼 (admin / supervisor / inspector)。
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// 子組件：深色統計卡片
const StatCard = ({ title, value, icon, color, isAlert }) => {
  const colors = {
    blue: "border-blue-500/20 text-blue-400 shadow-blue-900/5",
    indigo: "border-indigo-500/20 text-indigo-400 shadow-indigo-900/5",
    red: "border-red-500/20 text-red-400 shadow-red-900/5",
    slate: "border-slate-500/20 text-slate-400 shadow-slate-900/5"
  };
  
  return (
    <div className={`bg-[#0f172a] p-5 rounded-2xl border ${colors[color]} shadow-lg relative overflow-hidden group transition-all hover:scale-[1.02]`}>
      <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-30 transition-opacity`}>
        {icon}
      </div>
      <p className="text-slate-500 text-[10px] font-black mb-1 uppercase tracking-widest">{title}</p>
      <p className={`text-3xl font-black tracking-tight ${isAlert ? 'text-red-500 animate-pulse' : 'text-white'}`}>
        {value}
      </p>
    </div>
  );
};

// 子組件：深色操作按鈕
const ActionButton = ({ title, subtitle, onClick, icon }) => (
  <button 
    onClick={onClick}
    className="w-full bg-[#0f172a] p-4 rounded-2xl border border-slate-800 flex items-center gap-4 hover:border-blue-500/40 hover:bg-[#1e293b] transition-all text-left group shadow-lg"
  >
    <div className="p-3 bg-slate-900 rounded-xl group-hover:bg-blue-500/10 transition-colors shadow-inner">
      {icon}
    </div>
    <div className="flex-1">
      <p className="font-bold text-slate-100 text-sm group-hover:text-blue-400 transition-colors">{title}</p>
      <p className="text-[10px] text-slate-500 uppercase mt-1 tracking-tighter">{subtitle}</p>
    </div>
    <ChevronRight className="text-slate-700 group-hover:text-blue-500 transition-all group-hover:translate-x-1" size={16} />
  </button>
);

export default ManagerDashboard;