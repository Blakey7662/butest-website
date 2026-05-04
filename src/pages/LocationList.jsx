import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { MapPin, ChevronRight, Search, Loader2, LogOut, ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LocationList = () => {
  const [locations, setLocations] = useState([]);
  const [todayReports, setTodayReports] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. 抓取所有巡檢點
        const locSnap = await getDocs(query(collection(db, "locations"), orderBy("name", "asc")));
        const locs = locSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLocations(locs);

        // 2. 抓取今日已完成的紀錄
        const today = new Date().toISOString().split('T')[0];
        const reportSnap = await getDocs(query(collection(db, "reports"), where("date", "==", today)));
        
        const reportMap = {};
        reportSnap.docs.forEach(doc => {
          const data = doc.data();
          // 以 locationId 為 key，儲存該地點今日最新的狀態
          reportMap[data.locationId] = {
            status: data.status, // normal or abnormal
            anomalyCount: data.anomalyCount || 0,
            time: data.time
          };
        });
        setTodayReports(reportMap);
      } catch (error) {
        console.error("資料讀取失敗:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredLocations = locations.filter(loc =>
    loc.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="h-screen bg-[#020617] flex items-center justify-center">
      <Loader2 className="text-blue-500 animate-spin" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <nav className="bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2 font-bold text-lg text-white">
          <ShieldCheck className="text-blue-500" size={20} /> 巡檢系統
        </div>
        <button onClick={() => window.confirm("確定登出？") && logout()} className="p-2 text-slate-400 hover:text-red-400"><LogOut size={20}/></button>
      </nav>

      <main className="max-w-md mx-auto p-6">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">巡檢點清單</h1>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-black">16 Locations Progress</p>
        </header>

        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text" placeholder="搜尋地點名稱..."
            className="w-full bg-[#0f172a] border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-blue-500/50 outline-none transition shadow-inner"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="space-y-4">
          {filteredLocations.map((loc) => {
            const report = todayReports[loc.id];
            const isDone = !!report;

            return (
              <button
                key={loc.id}
                onClick={() => navigate(`/inspect/${loc.id}`)}
                className={`w-full p-5 rounded-[2rem] border-2 transition-all flex items-center justify-between group shadow-xl ${
                  isDone ? 'bg-slate-900/50 border-blue-500/30' : 'bg-[#0f172a] border-slate-800'
                }`}
              >
                <div className="flex items-center gap-4 text-left">
                  <div className={`p-3 rounded-2xl ${isDone ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                    <MapPin size={22} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-100 flex items-center gap-2">
                      {loc.name}
                      {isDone && <CheckCircle2 size={14} className="text-blue-400" />}
                    </div>
                    <div className="text-[10px] mt-1 font-bold space-y-1">
                      <p className={isDone ? 'text-blue-400' : 'text-slate-500'}>
                        {isDone ? '● 已完成' : '○ 未完成'}
                      </p>
                      {isDone && (
                        <p className="text-slate-500">
                          最後時間: {report.time} | <span className={report.anomalyCount > 0 ? 'text-red-500' : 'text-green-500'}>
                            異常: {report.anomalyCount}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight className="text-slate-700 group-hover:text-blue-500 group-hover:translate-x-1" size={20} />
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default LocationList;