import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Camera, AlertCircle, CheckCircle, ArrowLeft, Loader2, Home, Info } from 'lucide-react';

const InspectionForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [location, setLocation] = useState(null);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const docSnap = await getDoc(doc(db, "locations", id));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setLocation(data);
          
          const init = {};
          data.checkItems?.forEach((item, index) => {
            const itemId = item.id || (typeof item === 'string' ? item : `item-${index}`);
            init[itemId] = { 
              status: null, // ✅ 預設改為 null，強制使用者選取
              note: '', 
              anomalyDesc: '', 
              handling: '', 
              expectedDate: '',
              photo: null 
            };
          });
          setResults(init);
        }
      } catch (error) {
        console.error("讀取地點失敗:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLocation();
  }, [id]);

  const handleStatusChange = (itemId, status) => {
    setResults(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], status }
    }));
  };

  const handleSubmit = async () => {
    const items = location?.checkItems || [];
    
    // 1. 驗證是否每一項都已判定
    for (let item of items) {
      const itemId = item.id || (typeof item === 'string' ? item : '');
      if (!results[itemId]?.status) {
        alert(`項目「${item.name || item}」尚未選擇判定結果！`);
        return;
      }
    }

    // 2. 驗證異常必填項
    for (let item of items) {
      const itemId = item.id || (typeof item === 'string' ? item : '');
      const res = results[itemId];
      if (res?.status === 'abnormal') {
        if (!res.anomalyDesc || !res.handling) {
          alert(`請填寫「${item.name || item}」的異常說明與處理方式`);
          return;
        }
      }
    }

    const now = new Date();
    const anomalyCount = Object.values(results).filter(r => r.status === 'abnormal').length;

    try {
      await addDoc(collection(db, "reports"), {
        locationId: id,
        locationName: location.name,
        inspectorName: user.displayName || user.email,
        date: now.toISOString().split('T')[0],
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        details: results,
        anomalyCount,
        status: anomalyCount > 0 ? 'abnormal' : 'normal',
        reviewStatus: 'pending', // 初始複核狀態為待審核
        timestamp: serverTimestamp()
      });
      alert("巡檢紀錄已提交！");
      navigate('/home');
    } catch (err) {
      alert("提交失敗，請檢查網路。");
    }
  };

  if (loading) return (
    <div className="h-screen bg-[#020617] flex items-center justify-center text-blue-500">
      <Loader2 className="animate-spin" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-6 pb-24">
      <div className="max-w-md mx-auto">
        {/* 頂部導覽：雙按鈕設計 */}
        <div className="flex justify-between items-center mb-8">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors">
            <ArrowLeft size={18}/> 返回清單
          </button>
          <button onClick={() => navigate('/home')} className="flex items-center gap-2 text-slate-500 hover:text-blue-400 transition-colors">
            <Home size={18}/> 回首頁
          </button>
        </div>
        
        <h1 className="text-2xl font-black mb-2 text-white">{location?.name || '載入中...'}</h1>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-8">Inspection Checklist</p>

        <div className="space-y-6">
          {(location?.checkItems || []).map((item, index) => {
            const itemId = item.id || (typeof item === 'string' ? item : `item-${index}`);
            const res = results[itemId];
            const status = res?.status;

            // 定義動態樣式
            let cardStyle = "border-slate-800 bg-[#0f172a]/50"; // 預設（未選取）
            if (status === 'normal') cardStyle = "border-green-500/50 bg-green-500/5";
            if (status === 'watch') cardStyle = "border-orange-500/50 bg-orange-500/5";
            if (status === 'abnormal') cardStyle = "border-red-500/50 bg-red-500/5";
            if (status === 'na') cardStyle = "border-slate-600 bg-slate-800/30";

            return (
              <div key={itemId} className={`p-6 rounded-[2.5rem] border-2 shadow-xl transition-all duration-300 ${cardStyle}`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                    {item.category || '一般項目'}
                  </span>
                  {status === 'abnormal' && <AlertCircle size={18} className="text-red-500 animate-pulse" />}
                  {!status && <Info size={16} className="text-blue-500/40" />}
                </div>
                
                <h3 className="text-lg font-bold text-white mb-1">{item.name || item}</h3>
                <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                  標準：{item.standard || '符合規範，運作正常'}
                </p>

                {/* 判定選項：四選一 */}
                <div className="grid grid-cols-4 gap-2 mb-6">
                  <StatusBtn label="正常" active={status === 'normal'} color="green" onClick={() => handleStatusChange(itemId, 'normal')} />
                  <StatusBtn label="待注意" active={status === 'watch'} color="orange" onClick={() => handleStatusChange(itemId, 'watch')} />
                  <StatusBtn label="異常" active={status === 'abnormal'} color="red" onClick={() => handleStatusChange(itemId, 'abnormal')} />
                  <StatusBtn label="不適用" active={status === 'na'} color="slate" onClick={() => handleStatusChange(itemId, 'na')} />
                </div>

                {/* 動態顯示：備註欄 */}
                {status === 'watch' && (
                  <div className="animate-in fade-in slide-in-from-top-2">
                    <textarea 
                      placeholder="請輸入待注意原因..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white outline-none focus:border-orange-500/50 transition-all"
                      value={res?.note || ''}
                      onChange={(e) => setResults({...results, [itemId]: {...res, note: e.target.value}})}
                    />
                  </div>
                )}

                {/* 動態顯示：異常欄位 */}
                {status === 'abnormal' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <textarea 
                      placeholder="異常詳細說明 (必填)"
                      className="w-full bg-slate-950 border border-red-900/50 rounded-2xl p-4 text-sm text-white focus:border-red-500 outline-none transition-all"
                      value={res?.anomalyDesc || ''}
                      onChange={(e) => setResults({...results, [itemId]: {...res, anomalyDesc: e.target.value}})}
                    />
                    <textarea 
                      placeholder="擬處理方式 (必填)"
                      className="w-full bg-slate-950 border border-red-900/50 rounded-2xl p-4 text-sm text-white focus:border-red-500 outline-none transition-all"
                      value={res?.handling || ''}
                      onChange={(e) => setResults({...results, [itemId]: {...res, handling: e.target.value}})}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <span className="absolute left-3 top-[-8px] bg-[#0f172a] px-1 text-[8px] font-bold text-slate-500 uppercase">預計完成日</span>
                        <input 
                          type="date" 
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-blue-500"
                          value={res?.expectedDate || ''}
                          onChange={(e) => setResults({...results, [itemId]: {...res, expectedDate: e.target.value}})}
                        />
                      </div>
                      <button className="flex items-center justify-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-blue-400 hover:bg-slate-900 transition-colors">
                        <Camera size={16} /> 拍照上傳
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button 
          onClick={handleSubmit}
          className="fixed bottom-6 left-6 right-6 max-w-md mx-auto bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-[2rem] shadow-2xl shadow-blue-900/40 transition-all active:scale-95 z-20 flex items-center justify-center gap-2"
        >
          <ClipboardCheck size={20} /> 送出巡檢紀錄
        </button>
      </div>
    </div>
  );
};

// 狀態按鈕組件
const StatusBtn = ({ label, active, color, onClick }) => {
  const colors = {
    green: active ? 'bg-green-600 text-white shadow-lg shadow-green-900/20' : 'bg-slate-800/50 text-slate-500 hover:bg-slate-800',
    orange: active ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20' : 'bg-slate-800/50 text-slate-500 hover:bg-slate-800',
    red: active ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' : 'bg-slate-800/50 text-slate-500 hover:bg-slate-800',
    slate: active ? 'bg-slate-500 text-white shadow-lg shadow-slate-900/20' : 'bg-slate-800/50 text-slate-500 hover:bg-slate-800'
  };
  return (
    <button 
      type="button"
      onClick={onClick} 
      className={`py-3 text-[10px] font-black rounded-xl transition-all duration-200 ${colors[color]}`}
    >
      {label}
    </button>
  );
};

export default InspectionForm;