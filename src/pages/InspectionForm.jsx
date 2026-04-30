import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, storage, auth } from '../firebase';
import { 
  doc, getDoc, collection, addDoc, serverTimestamp, updateDoc 
} from 'firebase/firestore';
import { 
  ref, uploadBytes, getDownloadURL 
} from 'firebase/storage';
import { 
  ChevronLeft, Camera, AlertTriangle, CheckCircle, 
  Info, MinusCircle, Loader2, Check
} from 'lucide-react';

const InspectionForm = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  
  const [location, setLocation] = useState(null);
  const [items, setItems] = useState([]);
  const [results, setResults] = useState({}); 
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingItemId, setUploadingItemId] = useState(null);
  const [existingRecordId, setExistingRecordId] = useState(null);

  // 初始化資料與回填邏輯 (與之前相同)
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const docRef = doc(db, "locations", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const locData = docSnap.data();
          setLocation(locData);

          const allItems = getItemsByLocation(id);
          setItems(allItems);

          const todayStr = new Date().toISOString().split('T')[0];
          const lastDate = locData.lastInspected?.toDate 
            ? locData.lastInspected.toDate().toISOString().split('T')[0] 
            : null;

          let initialResults = {};

          if (lastDate === todayStr && locData.lastRecordId) {
            const recordSnap = await getDoc(doc(db, "inspectionRecords", locData.lastRecordId));
            if (recordSnap.exists()) {
              initialResults = recordSnap.data().results;
              setExistingRecordId(locData.lastRecordId);
            }
          } else {
            allItems.forEach(item => {
              initialResults[item.id] = { 
                status: '', desc: '', action: '', note: '', photo: null,
                category: item.category, title: item.title
              };
            });
          }
          setResults(initialResults);
        }
      } catch (err) {
        console.error("載入失敗:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [id]);

  const getItemsByLocation = (locId) => {
    const common = [
      { id: 'g1', category: '消防安全', title: '滅火器有效期限', standard: '指針需在綠區' },
      { id: 'g2', category: '消防安全', title: '消防設備外觀', standard: '無破損、鏽蝕、遮蔽' },
      { id: 'g3', category: '設備設施', title: '緊急照明或出口指示', standard: '燈具正常放亮' },
      { id: 'g4', category: '環境衛生', title: '地面清潔', standard: '無積塵、紙屑、油污' },
      { id: 'g5', category: '環境衛生', title: '是否有積水', standard: '地面乾燥，無容器積水' },
      { id: 'g6', category: '環境衛生', title: '是否有異味', standard: '無腐敗或化學異味' },
      { id: 'g7', category: '設備設施', title: '照明是否正常', standard: '燈管無閃爍、損壞' },
      { id: 'g8', category: '保全管控', title: '門禁或鎖具', standard: '開關順暢，鎖頭無鬆動' },
      { id: 'g9', category: '保全管控', title: 'CCTV監視設備', standard: '鏡頭無遮蔽、角度正確' },
    ];
    return common;
  };

  const updateResult = (itemId, field, value) => {
    setResults(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value }
    }));
  };

  const handlePhotoUpload = async (itemId, e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingItemId(itemId);
    try {
      const storageRef = ref(storage, `inspections/${new Date().toISOString().split('T')[0]}/${id}_${itemId}_${Date.now()}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      updateResult(itemId, 'photo', url);
    } catch (error) {
      alert("上傳失敗");
    } finally {
      setUploadingItemId(null);
    }
  };

  const handleSubmit = async () => {
    const incomplete = items.some(item => !results[item.id].status);
    if (incomplete) { alert("請完成所有項目判定！"); return; }

    const abnormalError = items.some(item => {
      const r = results[item.id];
      return r.status === '異常' && (!r.desc || !r.action || !r.photo);
    });
    if (abnormalError) { alert("異常項目必須填寫說明、處理方式並拍照！"); return; }

    setSubmitting(true);
    try {
      const isAbnormal = items.some(item => results[item.id].status === '異常');
      const finalStatus = isAbnormal ? '異常待處理' : '正常';
      
      const recordData = {
        locationId: id,
        locationName: location.name,
        inspector: auth.currentUser?.email || "測試人員",
        results: results,
        status: finalStatus,
        updatedAt: serverTimestamp(),
        inspectionDate: new Date().toISOString().split('T')[0]
      };

      let recordId = existingRecordId;
      if (existingRecordId) {
        await updateDoc(doc(db, "inspectionRecords", existingRecordId), recordData);
      } else {
        recordData.createdAt = serverTimestamp();
        const docRef = await addDoc(collection(db, "inspectionRecords"), recordData);
        recordId = docRef.id;
      }

      await updateDoc(doc(db, "locations", id), {
        lastInspected: serverTimestamp(),
        lastStatus: finalStatus,
        lastRecordId: recordId
      });

      alert("紀錄已成功儲存！");
      navigate('/dashboard');
    } catch (error) {
      alert("儲存失敗");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen bg-[#020617] text-blue-500 font-bold">載入中...</div>;

  // 1. 卡片整體背景樣式調整：降低飽和度，避免搶走按鈕風采
  const cardStyles = {
    '正常': 'border-t-4 border-green-500 bg-green-950/20',
    '待注意': 'border-t-4 border-orange-500 bg-orange-950/30',
    '異常': 'border-t-4 border-red-500 bg-red-950/30',
    '不適用': 'border-t-4 border-slate-600 bg-slate-900/50'
  };

  // 2. 判定按鈕的霓虹燈發光樣式定義 (重點優化)
  const statusBtnMap = {
    '正常': {
      active: 'bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.6)]',
      icon: CheckCircle
    },
    '待注意': {
      active: 'bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.6)]',
      icon: AlertTriangle
    },
    '異常': {
      active: 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.6)]',
      icon: AlertTriangle
    },
    '不適用': {
      active: 'bg-slate-500 text-white shadow-[0_0_15px_rgba(148,163,184,0.4)]',
      icon: MinusCircle
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] pb-28 text-slate-100">
      {/* Header */}
      <div className="bg-[#0f172a] border-b border-slate-800 p-5 sticky top-0 z-30 flex items-center shadow-lg">
        <button onClick={() => navigate('/dashboard')} className="mr-3 text-slate-400 p-1"><ChevronLeft /></button>
        <div>
          <h1 className="text-lg font-bold text-white">{location?.name}</h1>
          <p className="text-[10px] text-slate-500">{existingRecordId ? '⚠️ 編輯今日紀錄' : '🆕 新巡檢表單'}</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {items.map((item) => {
          const res = results[item.id] || {};
          return (
            <div key={item.id} className={`rounded-2xl border border-slate-800 shadow-xl transition-all duration-300 ${res.status ? cardStyles[res.status] : 'bg-[#0f172a]'}`}>
              <div className="p-5">
                <div className="flex justify-between items-start">
                   <div className="flex-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.category}</span>
                      <h3 className="text-base font-bold text-slate-100 mt-1">{item.title}</h3>
                   </div>
                   {res.status === '正常' && <Check className="text-green-400 w-5 h-5 animate-in zoom-in" />}
                </div>
                <p className="text-xs text-slate-400 mt-1 italic opacity-70">標：{item.standard}</p>

                {/* 按鈕區 - 優化後的樣式邏輯 */}
                <div className="grid grid-cols-4 gap-2.5 mt-5">
                  {['正常', '待注意', '異常', '不適用'].map(label => {
                    const isSelected = res.status === label;
                    const btnStyle = statusBtnMap[label];
                    const Icon = btnStyle.icon;

                    return (
                      <button
                        key={label}
                        onClick={() => updateResult(item.id, 'status', label)}
                        className={`py-4 rounded-xl flex flex-col items-center justify-center transition-all duration-300 active:scale-95 ${
                          isSelected 
                          ? `${btnStyle.active}` // 選取時：霓虹燈亮起
                          : 'bg-slate-900 text-slate-600 border border-slate-800 hover:border-slate-600 hover:text-slate-400' // 未選取：淡化背景
                        }`}
                      >
                        <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-white' : 'text-slate-700'}`} />
                        <span className="text-[11px] font-black tracking-tight">{label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* 條件渲染區塊 (樣式稍微微調以適應按鈕) */}
                {res.status === '待注意' && (
                  <div className="mt-5 p-3 bg-slate-950 rounded-xl border border-orange-500/30 animate-in fade-in slide-in-from-top-1">
                    <textarea 
                      className="w-full text-sm bg-transparent text-slate-200 outline-none placeholder:text-slate-700" 
                      placeholder="請輸入備註..."
                      value={res.note} 
                      onChange={(e) => updateResult(item.id, 'note', e.target.value)}
                    />
                  </div>
                )}

                {res.status === '異常' && (
                  <div className="mt-5 space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-red-500/30">
                      <p className="text-[10px] font-bold text-red-400 mb-1.5 tracking-wider">異常說明 *</p>
                      <textarea className="w-full text-sm bg-transparent text-slate-200 outline-none placeholder:text-slate-700" value={res.desc} onChange={(e) => updateResult(item.id, 'desc', e.target.value)} placeholder="說明損壞情況..." />
                    </div>
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-red-500/30">
                      <p className="text-[10px] font-bold text-red-400 mb-1.5 tracking-wider">處理方式 *</p>
                      <input className="w-full text-sm bg-transparent text-slate-200 outline-none placeholder:text-slate-700" value={res.action} onChange={(e) => updateResult(item.id, 'action', e.target.value)} placeholder="已報修/現場排除..." />
                    </div>
                    <label className="flex items-center justify-center w-full py-4 bg-slate-900 border-2 border-dashed border-slate-700 rounded-xl text-slate-500 relative active:bg-slate-800 transition-colors">
                      {uploadingItemId === item.id ? <Loader2 className="animate-spin" /> : res.photo ? <img src={res.photo} className="w-full h-32 object-cover rounded-lg" /> : <><Camera className="mr-2"/> 拍照上傳 *</>}
                      <input type="file" accept="image/*" capture="environment" className="absolute inset-0 opacity-0" onChange={(e) => handlePhotoUpload(item.id, e)} />
                    </label>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 底部按鈕 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0f172a]/95 backdrop-blur-md border-t border-slate-800 z-40">
        <button
          onClick={handleSubmit} disabled={submitting}
          className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-[0_0_20px_rgba(37,99,235,0.3)] active:scale-95 transition-all disabled:opacity-50"
        >
          {submitting ? <Loader2 className="animate-spin mx-auto" /> : existingRecordId ? '更新今日巡檢' : '送出巡檢紀錄'}
        </button>
      </div>
    </div>
  );
};

export default InspectionForm;