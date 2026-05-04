import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { MapPin, ChevronRight, Search, Loader2 } from 'lucide-react';

const LocationList = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        // 確保這裡抓取的集合名稱是 "locations"
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
    <div className="min-h-screen bg-[#020617] text-slate-200 p-6">
      <div className="max-w-md mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">巡檢地點清單</h1>
          <p className="text-slate-500 text-sm">請選擇您目前所在的區域進行巡檢</p>
        </header>

        {/* 搜尋框 */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="搜尋地點名稱..."
            className="w-full bg-[#0f172a] border border-slate-800 rounded-2xl py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 transition"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* 地點列表 */}
        <div className="space-y-4">
          {filteredLocations.length > 0 ? (
            filteredLocations.map((loc) => (
              <button
                key={loc.id}
                onClick={() => navigate(`/inspect/${loc.id}`)}
                className="w-full bg-[#0f172a] p-5 rounded-2xl border border-slate-800 flex items-center justify-between hover:border-blue-500/50 hover:bg-slate-800/50 transition group shadow-lg"
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-100">{loc.name}</div>
                    <div className="text-xs text-slate-500">{loc.description || '無備註資訊'}</div>
                  </div>
                </div>
                <ChevronRight className="text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" size={20} />
              </button>
            ))
          ) : (
            <div className="text-center py-20 text-slate-600 italic">
              目前沒有可巡檢的地點
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationList;