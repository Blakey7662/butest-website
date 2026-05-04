import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
// ✅ 已補上 ClipboardCheck 與 CheckCircle2 的匯入
import { 
  Camera, AlertCircle, ArrowLeft, Loader2, Home, 
  Info, ClipboardCheck, CheckCircle2 
} from 'lucide-react';

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
          // 確保 checkItems 存在才執行迴圈
          if (data.checkItems && Array.isArray(data.checkItems)) {
            data.checkItems.forEach((item, index) => {
              // 統一 itemId 生成邏輯，確保與渲染時一致
              const itemId = item.id || `item-${index}`;
              init[itemId] = { 
                status: null, // 預設不選取
                note: '', 
                anomalyDesc: '', 
                handling: '', 
                expectedDate: '',
                photo: null 
              };
            });
          }
          setResults(init);
        } else {
          console.error("找不到該巡檢點資料");
          navigate('/dashboard');
        }
      } catch (error) {
        console.error("讀取資料失敗:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLocation();
  }, [id, navigate]);

  const handleStatusChange = (itemId, status) => {
    setResults(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], status }
    }));
  };

  const handleSubmit = async () => {
    const items = location?.checkItems || [];
    
    // 驗證是否每一項都已判定
    for (let i = 0; i < items.length; i++) {
      const itemId = items[i].id || `item-${i}`;
      if (!results[itemId]?.status) {
        alert(`項目「${items[i].name || '未命名'}」尚未選擇判定結果！`);
        return;
      }
      
      // 驗證異常必填項
      if (results[itemId].status === 'abnormal') {
        if (!results[itemId].anomalyDesc || !results[itemId].handling) {
          alert(`請填寫「${items[i].name}」的異常說明與處理方式`);
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
        inspectorName: user?.displayName || user?.email || '未知人員',
        date: now.toISOString().split('T')[0],
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        details: results,
        anomalyCount,
        status: anomalyCount > 0 ? 'abnormal' : 'normal',
        reviewStatus: 'pending',
        timestamp: serverTimestamp()
      });
      alert("巡檢紀錄已提交！");
      navigate('/home');
    } catch (err) {
      console.error(err);
      alert("提交失敗，請檢查網路連線。");
    }
  };

  if (loading) return (
    <div className="h-screen bg-[#020617] flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-500" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-6 pb-24">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-8">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors">
            <ArrowLeft size={18}/> 返回清單
          </button>
          <button onClick={() => navigate('/home')} className="flex items-center gap-2 text-slate-500 hover:text-blue-400 transition-colors">
            <Home size={18}/> 回首頁
          </button>
        </div>
        
        <h1 className="text-2xl font-black mb-2 text-white">{location?.name}</h1>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-8">Inspection Checklist</p>

        <div className="space-y-6">
          {(location?.checkItems || []).map((item, index) => {
            const itemId = item.id || `item-${index}`;
            const res = results[itemId];
            const status = res?.status;

            let cardStyle = "border-slate-800 bg-[#0f172a]/50";
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
                </div>
                
                <h3 className="text-lg font-bold text-white mb-1">{item.name}</h3>
                <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                  標準：{item.standard || '符合規範'}
                </p>

                <div className="grid grid-cols-4 gap-2 mb-6">
                  <StatusBtn label="正常" active={status === 'normal'} color="green" onClick={() => handleStatusChange(itemId, 'normal')} />
                  <StatusBtn label="待注意" active={status === 'watch'} color="orange" onClick={() => handleStatusChange(itemId, 'watch')} />
                  <StatusBtn label="異常" active={status === 'abnormal'} color="red" onClick={() => handleStatusChange(itemId, 'abnormal')} />
                  <StatusBtn label="不適用" active={status === 'na'} color="slate" onClick={() => handleStatusChange(itemId, 'na')} />
                </div>

                {status === 'watch' && (
                  <textarea 
                    placeholder="請輸入原因..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white outline-none focus:border-orange-500/50 transition-all"
                    value={res?.note || ''}
                    onChange={(e) => setResults({...results, [itemId]: {...res, note: e.target.value}})}
                  />
                )}

                {status === 'abnormal' && (
                  <div className="space-y-4">
                    <textarea 
                      placeholder="異常說明 (必填)"
                      className="w-full bg-slate-950 border border-red-900/50 rounded-2xl p-4 text-sm text-white focus:border-red-500 outline-none"
                      value={res?.anomalyDesc || ''}
                      onChange={(e) => setResults({...results, [itemId]: {...res, anomalyDesc: e.target.value}})}
                    />
                    <textarea 
                      placeholder="處理方式 (必填)"
                      className="w-full bg-slate-950 border border-red-900/50 rounded-2xl p-4 text-sm text-white focus:border-red-500 outline-none"
                      value={res?.handling || ''}
                      onChange={(e) => setResults({...results, [itemId]: {...res, handling: e.target.value}})}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input 
                        type="date" 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
                        value={res?.expectedDate || ''}
                        onChange={(e) => setResults({...results, [itemId]: {...res, expectedDate: e.target.value}})}
                      />
                      <button className="flex items-center justify-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-blue-400">
                        <Camera size={16} /> 拍照
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
          className="fixed bottom-6 left-6 right-6 max-w-md mx-auto bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-[2rem] shadow-2xl z-20 flex items-center justify-center gap-2"
        >
          <ClipboardCheck size={20} /> 送出巡檢紀錄
        </button>
      </div>
    </div>
  );
};

const StatusBtn = ({ label, active, color, onClick }) => {
  const colors = {
    green: active ? 'bg-green-600 text-white shadow-lg shadow-green-900/20' : 'bg-slate-800/50 text-slate-500',
    orange: active ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20' : 'bg-slate-800/50 text-slate-500',
    red: active ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' : 'bg-slate-800/50 text-slate-500',
    slate: active ? 'bg-slate-500 text-white shadow-lg shadow-slate-900/20' : 'bg-slate-800/50 text-slate-500'
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