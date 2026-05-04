import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { 
  collection, query, where, onSnapshot, doc, updateDoc, 
  serverTimestamp, orderBy 
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { 
  AlertCircle, Activity, CheckCircle2, Clock, Filter, 
  Search, ArrowLeft, Camera, User, Calendar, MapPin,
  ChevronDown, ExternalLink, MessageSquare
} from 'lucide-react';

const AnomalyTracker = () => {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [anomalies, setAnomalies] = useState([]);
  
  // 篩選器狀態
  const [filters, setFilters] = useState({
    status: 'all', // all, 異常未處理, 待追蹤, 已改善, 已結案
    location: 'all',
    searchTerm: ''
  });

  useEffect(() => {
    // 監聽所有「異常」或「待注意」的紀錄
    // 注意：這裡假設您的 report 結構中 status 為 'abnormal' 或 'watch'
    const q = query(
      collection(db, "reports"), 
      where("status", "in", ["abnormal", "watch"]),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAnomalies(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 處理主管複核提交
  const handleReview = async (reportId, reviewData) => {
    try {
      const reportRef = doc(db, "reports", reportId);
      await updateDoc(reportRef, {
        ...reviewData,
        reviewUser: user.displayName || user.email,
        reviewTime: serverTimestamp(),
        // 根據複核結果更新總體狀態
      });
      alert("複核成功！");
    } catch (error) {
      console.error("複核失敗:", error);
    }
  };

  // 篩選邏輯
  const filteredData = anomalies.filter(item => {
    const matchStatus = filters.status === 'all' || item.processingStatus === filters.status;
    const matchLocation = filters.location === 'all' || item.locationName === filters.location;
    const matchSearch = item.locationName.includes(filters.searchTerm) || item.inspectorName.includes(filters.searchTerm);
    return matchStatus && matchLocation && matchSearch;
  });

  if (loading) return <div className="h-screen bg-[#020617] flex items-center justify-center text-blue-500">載入中...</div>;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-10">
      {/* 標頭 */}
      <nav className="p-6 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-[#020617]/90 backdrop-blur-md z-30">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/home')} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-black flex items-center gap-2">
            <Activity className="text-red-500" /> 異常追蹤管理
          </h1>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        {/* 快速篩選列 */}
        <section className="bg-[#0f172a] p-4 rounded-3xl border border-slate-800 flex flex-wrap gap-3 shadow-lg">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="搜尋巡檢點、人員..." 
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs outline-none focus:border-blue-500"
              onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
            />
          </div>
          <select 
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs outline-none focus:border-blue-500"
            onChange={(e) => setFilters({...filters, status: e.target.value})}
          >
            <option value="all">所有狀態</option>
            <option value="異常未處理">異常未處理</option>
            <option value="待追蹤">待追蹤</option>
            <option value="已改善">已改善</option>
            <option value="已結案">已結案</option>
          </select>
        </section>

        {/* 異常清單 */}
        <div className="space-y-6">
          {filteredData.length > 0 ? filteredData.map((item) => (
            <AnomalyCard 
              key={item.id} 
              data={item} 
              role={role} 
              onReview={handleReview}
            />
          )) : (
            <div className="text-center py-20 bg-[#0f172a]/30 rounded-[3rem] border-2 border-dashed border-slate-800">
              <p className="text-slate-600 font-bold italic">目前沒有需要處理的異常項目</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

// 異常項目卡片元件
const AnomalyCard = ({ data, role, onReview }) => {
  const [expand, setExpand] = useState(false);
  const isAbnormal = data.status === 'abnormal';

  return (
    <div className={`bg-[#0f172a] rounded-[2.5rem] border-2 overflow-hidden transition-all duration-500 shadow-xl ${isAbnormal ? 'border-red-500/20' : 'border-orange-500/20'}`}>
      <div className="p-6">
        {/* 卡片標頭：狀態與地點 */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${isAbnormal ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'}`}>
              {isAbnormal ? <AlertCircle size={24}/> : <Activity size={24}/>}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-white">{data.locationName}</h3>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest ${isAbnormal ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'}`}>
                  {isAbnormal ? '異常' : '待注意'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-1">
                <MapPin size={12} /> {data.category || '未分類'} · <Calendar size={12}/> {data.date}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-black text-slate-600 uppercase block mb-1">目前處理狀態</span>
            <span className={`text-xs font-bold ${data.processingStatus === '已改善' ? 'text-green-500' : 'text-blue-500'}`}>
              {data.processingStatus || '待處理'}
            </span>
          </div>
        </div>

        {/* 異常內容描述 */}
        <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">異常說明</span>
              <p className="text-sm mt-1 text-slate-200">{data.anomalyDesc || '無詳細說明'}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">處理方式</span>
              <p className="text-sm mt-1 text-slate-200">{data.handlingMethod || '尚未填寫'}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t border-slate-900">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <User size={14} /> 巡檢員: <span className="text-slate-300">{data.inspectorName}</span>
            </div>
            {data.photoUrl && (
              <button className="flex items-center gap-1 text-xs text-blue-500 font-bold hover:underline">
                <Camera size={14} /> 查看照片
              </button>
            )}
          </div>
        </div>

        {/* 主管複核區域 (僅限主管/管理員) */}
        {(role === 'supervisor' || role === 'admin') && (
          <div className="mt-6 pt-6 border-t border-slate-800">
            <div className="flex items-center gap-2 mb-4 text-sm font-black text-indigo-400 uppercase tracking-widest">
              <MessageSquare size={16} /> 主管複核
            </div>
            
            <div className="space-y-4">
              <textarea 
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm outline-none focus:border-indigo-500 transition-all"
                placeholder="輸入複核意見或指示..."
                defaultValue={data.reviewDesc}
                id={`review-${data.id}`}
              />
              
              <div className="flex flex-wrap gap-2">
                {['追蹤中', '已改善', '已結案'].map(status => (
                  <button 
                    key={status}
                    onClick={() => onReview(data.id, {
                      processingStatus: status,
                      reviewDesc: document.getElementById(`review-${data.id}`).value
                    })}
                    className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-indigo-600 hover:bg-indigo-500 text-white transition-all active:scale-95"
                  >
                    標記為 {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 複核紀錄展示 (一般巡檢員可看) */}
        {data.reviewTime && (
          <div className="mt-4 p-3 bg-green-500/5 rounded-xl border border-green-500/10">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-black text-green-500/70 uppercase">主管複核紀錄</span>
              <span className="text-[10px] text-slate-600">{new Date(data.reviewTime?.seconds * 1000).toLocaleString()}</span>
            </div>
            <p className="text-xs text-slate-400 italic">"{data.reviewDesc}" — {data.reviewUser}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnomalyTracker;