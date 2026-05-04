import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { MapPin, ChevronRight, Search, Loader2, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext'; // 1. 引入 AuthContext

const LocationList = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { logout } = useAuth(); // 2. 取得登出函式

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const q = query(collection(db, "locations"), orderBy("name", "asc"));
        const querySnapshot = await getDocs(q);
        const locData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setLocations(locData);
      } catch (error) {
        console.error("抓取地點失敗:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLocations();
  }, []);

  const filteredLocations = locations.filter(loc =>
    loc.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-screen bg-[#020617] flex items-center justify-center">
        <Loader2 className="text-blue-500 animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      {/* 頂部導覽列：與主管端色系一致 */}
      <nav className="bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2 font-bold text-lg text-white">
          <ShieldCheck className="text-blue-500" size={20} />
          巡檢系統
        </div>
        <button 
          onClick={() => {
            if(window.confirm("確定要登出系統嗎？")) logout();
          }}
          className="p-2 bg-slate-800 hover:bg-red-900/30 text-slate-400 hover:text-red-400 rounded-xl border border-slate-700 transition-all"
          title="登出"
        >
          <LogOut size={20} />
        </button>
      </nav>

      <main className="max-w-md mx-auto p-6">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">巡檢地點</h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black">Location Selection</p>
        </header>

        {/* 搜尋框 */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="搜尋地點名稱..."
            className="w-full bg-[#0f172a] border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-blue-500/50 transition shadow-inner"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* 地點清單 */}
        <div className="space-y-4">
          {filteredLocations.length > 0 ? (
            filteredLocations.map((loc) => (
              <button
                key={loc.id}
                onClick={() => navigate(`/inspect/${loc.id}`)}
                className="w-full bg-[#0f172a] p-5 rounded-3xl border border-slate-800 flex items-center justify-between hover:border-blue-500/30 hover:bg-slate-800/40 transition group shadow-xl"
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="p-3 bg-blue-500/5 rounded-2xl text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-inner">
                    <MapPin size={22} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-100 group-hover:text-blue-400 transition-colors">{loc.name}</div>
                    <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-tighter">
                      {loc.checkItems?.length || 0} 個檢查項目
                    </div>
                  </div>
                </div>
                <ChevronRight className="text-slate-700 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" size={20} />
              </button>
            ))
          ) : (
            <div className="text-center py-20 bg-[#0f172a]/30 rounded-3xl border border-dashed border-slate-800 text-slate-600 italic">
              查無相符的地點資料
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default LocationList;