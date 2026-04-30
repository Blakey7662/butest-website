import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 
import { 
  ChevronRight, 
  MapPin, 
  AlertCircle, 
  CheckCircle2, 
  LogOut, 
  UserCog,
  ClipboardCheck,
  LayoutDashboard
} from 'lucide-react';

const LocationList = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ completed: 0, abnormal: 0 });
  
  const navigate = useNavigate();
  const { logout, user, role } = useAuth(); 

  // 取得今天的日期字串 (YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    // 監聽所有巡檢點
    const q = query(collection(db, "locations"), orderBy("sort", "asc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const item = doc.data();
        
        // 核心邏輯：判斷該點最後巡檢日期是否為今天
        const lastDate = item.lastInspected?.toDate 
          ? item.lastInspected.toDate().toISOString().split('T')[0] 
          : null;
        
        return {
          id: doc.id,
          ...item,
          isCompletedToday: lastDate === todayStr
        };
      });

      // 動態計算今日統計
      const completedCount = data.filter(loc => loc.isCompletedToday).length;
      const abnormalCount = data.filter(loc => loc.isCompletedToday && loc.lastStatus === '異常待處理').length;

      setLocations(data);
      setStats({ completed: completedCount, abnormal: abnormalCount });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [todayStr]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-[#020617]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-blue-500 font-bold">同步社區數據...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] pb-24 text-slate-100">
      {/* 頂部導航欄 */}
      <div className="bg-[#0f172a]/90 backdrop-blur-md border-b border-slate-800 p-5 sticky top-0 z-20 shadow-xl flex justify-between items-center">
        <div>
          <h1 className="text-lg font-black text-white tracking-tight">社區巡檢管理系統</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">
             歡迎, {user?.email?.split('@')[0]} ({role === 'admin' ? '管理員' : role === 'supervisor' ? '主管' : '巡檢員'})
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* 管理員專屬按鈕 */}
          {role === 'admin' && (
            <button 
              onClick={() => navigate('/admin/users')}
              className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl border border-blue-500/20 active:scale-90 transition-all"
              title="人員管理"
            >
              <UserCog className="w-5 h-5" />
            </button>
          )}
          
          <button 
            onClick={logout}
            className="p-2.5 bg-slate-800 rounded-xl text-slate-400 active:bg-red-500/20 active:text-red-500 transition-all"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 統計看板 */}
      <div className="p-4 grid grid-cols-2 gap-4">
        <div className="bg-[#0f172a] p-5 rounded-3xl border border-slate-800 border-l-4 border-l-blue-500 shadow-2xl">
          <p className="text-slate-500 text-[10px] font-black uppercase mb-1">今日進度</p>
          <div className="flex items-baseline space-x-1">
            <span className="text-3xl font-black text-white">{stats.completed}</span>
            <span className="text-slate-700 text-sm font-bold">/ {locations.length}</span>
          </div>
          {/* 進度條 */}
          <div className="w-full bg-slate-900 h-1.5 mt-4 rounded-full overflow-hidden">
            <div 
              className="bg-blue-500 h-full transition-all duration-700 shadow-[0_0_8px_rgba(59,130,246,0.6)]" 
              style={{ width: `${(stats.completed / locations.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-[#0f172a] p-5 rounded-3xl border border-slate-800 border-l-4 border-l-red-500 shadow-2xl">
          <p className="text-slate-500 text-[10px] font-black uppercase mb-1">異常追蹤</p>
          <p className="text-3xl font-black text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]">
            {stats.abnormal}
          </p>
          <p className="text-[9px] text-slate-600 mt-3 font-bold">發現問題需即時處理</p>
        </div>
      </div>

      {/* 巡檢點清單 */}
      <div className="px-4 mt-2 space-y-3">
        <div className="flex justify-between items-center px-1 mb-2">
           <h2 className="text-xs font-black text-slate-600 uppercase tracking-widest">巡檢清單 ({todayStr})</h2>
        </div>

        {locations.map((loc) => {
          const isDone = loc.isCompletedToday;
          const isWarning = loc.lastStatus === '異常待處理';

          return (
            <button
              key={loc.id}
              onClick={() => navigate(`/inspect/${loc.id}`)}
              className={`w-full p-5 rounded-[2rem] flex items-center justify-between border transition-all duration-300 active:scale-[0.97] ${
                isDone 
                ? 'bg-green-500/5 border-green-500/20' 
                : 'bg-[#0f172a] border-slate-800 shadow-xl'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className={`p-3.5 rounded-2xl transition-all duration-500 ${
                  isDone 
                  ? 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]' 
                  : 'bg-slate-900 text-slate-600 border border-slate-800'
                }`}>
                  {isDone ? <CheckCircle2 className="w-6 h-6" /> : <MapPin className="w-6 h-6" />}
                </div>
                
                <div className="text-left">
                  <h3 className={`font-bold text-lg tracking-tight ${isDone ? 'text-green-400' : 'text-slate-200'}`}>
                    {loc.name}
                  </h3>
                  <div className="flex items-center mt-1">
                    {isDone ? (
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${
                        isWarning ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-500'
                      }`}>
                        {isWarning ? '⚠️ 偵測到異常' : '✅ 正常完成'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-600 flex items-center">
                        <CircleIcon />
                        尚未點檢
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                {isDone && isWarning && (
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-ping mr-3"></div>
                )}
                <ChevronRight className={`w-6 h-6 ${isDone ? 'text-green-900' : 'text-slate-800'}`} />
              </div>
            </button>
          );
        })}
      </div>

      {/* 底部導航欄 */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0f172a]/95 backdrop-blur-lg border-t border-slate-800 p-4 flex justify-around items-center z-20">
        <div className="flex flex-col items-center text-blue-500">
          <LayoutDashboard className="w-6 h-6" />
          <span className="text-[10px] font-black mt-1">首頁清單</span>
        </div>
        <div 
          className="flex flex-col items-center text-slate-600"
          onClick={() => alert('異常紀錄報表開發中')}
        >
          <ClipboardCheck className="w-6 h-6" />
          <span className="text-[10px] font-black mt-1">異常紀錄</span>
        </div>
      </div>
    </div>
  );
};

// 內部小組件：尚未點檢的小圓點
const CircleIcon = () => (
  <div className="w-1.5 h-1.5 bg-slate-800 rounded-full mr-2"></div>
);

export default LocationList;