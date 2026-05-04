import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Camera, AlertCircle, CheckCircle, ArrowLeft, Loader2, MinusCircle, Info } from 'lucide-react';

const InspectionForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [location, setLocation] = useState(null);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocation = async () => {
      const docSnap = await getDoc(doc(db, "locations", id));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setLocation(data);
        const init = {};
        data.checkItems?.forEach(item => {
          // item 現在預期是物件 { id, name, category, standard }
          // 如果是舊的字串格式，我們做個簡單相容處理
          const itemId = item.id || item;
          init[itemId] = { 
            status: 'normal', 
            note: '', 
            anomalyDesc: '', 
            handling: '', 
            expectedDate: '',
            photo: null 
          };
        });
        setResults(init);
      }
      setLoading(false);
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
    // 驗證必填 (異常時必填說明與處理)
    const items = location.checkItems || [];
    for (let item of items) {
      const itemId = item.id || item;
      const res = results[itemId];
      if (res.status === 'abnormal') {
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
        timestamp: serverTimestamp()
      });
      alert("巡檢紀錄已自動產生並送出！");
      navigate('/dashboard');
    } catch (err) {
      alert("提交失敗，請檢查網路。");
    }
  };

  if (loading) return <div className="h-screen bg-[#020617] flex items-center justify-center text-blue-500"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-6 pb-24">
      <div className="max-w-md mx-auto">
        <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-slate-500"><ArrowLeft size={18}/> 返回清單</button>
        <h1 className="text-2xl font-bold mb-8">{location?.name} 巡檢中</h1>

        <div className="space-y-6">
          {(location?.checkItems || []).map((item) => {
            const itemId = item.id || item;
            const res = results[itemId];
            const status = res.status;

            // 定義背景與邊框顏色
            let cardStyle = "border-slate-800 bg-[#0f172a]";
            if (status === 'normal') cardStyle = "border-green-500/50 bg-green-500/5";
            if (status === 'watch') cardStyle = "border-orange-500/50 bg-orange-500/5";
            if (status === 'abnormal') cardStyle = "border-red-500/50 bg-red-500/5";

            return (
              <div key={itemId} className={`p-6 rounded-[2rem] border-2 shadow-lg transition-all duration-300 ${cardStyle}`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.category || '一般項目'}</span>
                  {status === 'abnormal' && <AlertCircle size={18} className="text-red-500 animate-pulse" />}
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{item.name || item}</h3>
                <p className="text-xs text-slate-500 mb-6">標準：{item.standard || '符合規範，運作正常'}</p>

                {/* 判定選項 */}
                <div className="grid grid-cols-4 gap-2 mb-6">
                  <StatusBtn label="正常" active={status === 'normal'} color="green" onClick={() => handleStatusChange(itemId, 'normal')} />
                  <StatusBtn label="待注意" active={status === 'watch'} color="orange" onClick={() => handleStatusChange(itemId, 'watch')} />
                  <StatusBtn label="異常" active={status === 'abnormal'} color="red" onClick={() => handleStatusChange(itemId, 'abnormal')} />
                  <StatusBtn label="不適用" active={status === 'na'} color="slate" onClick={() => handleStatusChange(itemId, 'na')} />
                </div>

                {/* 備註欄 (待注意時顯示) */}
                {status === 'watch' && (
                  <div className="animate-in fade-in slide-in-from-top-2">
                    <textarea 
                      placeholder="請輸入備註說明..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm"
                      value={res.note}
                      onChange={(e) => setResults({...results, [itemId]: {...res, note: e.target.value}})}
                    />
                  </div>
                )}

                {/* 異常欄位 (異常時顯示) */}
                {status === 'abnormal' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <textarea 
                      placeholder="異常說明 (必填)"
                      className="w-full bg-slate-950 border border-red-900/50 rounded-xl p-3 text-sm focus:border-red-500 outline-none"
                      value={res.anomalyDesc}
                      onChange={(e) => setResults({...results, [itemId]: {...res, anomalyDesc: e.target.value}})}
                    />
                    <textarea 
                      placeholder="處理方式 (必填)"
                      className="w-full bg-slate-950 border border-red-900/50 rounded-xl p-3 text-sm focus:border-red-500 outline-none"
                      value={res.handling}
                      onChange={(e) => setResults({...results, [itemId]: {...res, handling: e.target.value}})}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="date" 
                        className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs"
                        onChange={(e) => setResults({...results, [itemId]: {...res, expectedDate: e.target.value}})}
                      />
                      <button className="flex items-center justify-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-blue-400">
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
          className="fixed bottom-6 left-6 right-6 max-w-md mx-auto bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-3xl shadow-2xl shadow-blue-900/40 transition-all active:scale-95 z-20"
        >
          送出巡檢紀錄
        </button>
      </div>
    </div>
  );
};

// 狀態按鈕組件
const StatusBtn = ({ label, active, color, onClick }) => {
  const colors = {
    green: active ? 'bg-green-600 text-white' : 'bg-slate-800 text-green-500/50',
    orange: active ? 'bg-orange-600 text-white' : 'bg-slate-800 text-orange-500/50',
    red: active ? 'bg-red-600 text-white' : 'bg-slate-800 text-red-500/50',
    slate: active ? 'bg-slate-600 text-white' : 'bg-slate-800 text-slate-400/50'
  };
  return (
    <button onClick={onClick} className={`py-2 text-[10px] font-black rounded-xl transition-all ${colors[color]}`}>
      {label}
    </button>
  );
};

export default InspectionForm;