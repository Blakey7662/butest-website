import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Camera, AlertCircle, CheckCircle, Info, MinusCircle, ArrowLeft } from 'lucide-react';

const InspectionForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [location, setLocation] = useState(null);
  const [formMeta, setFormMeta] = useState({ shift: '早班', weather: '晴天' });
  const [results, setResults] = useState({});

  useEffect(() => {
    const fetchLocation = async () => {
      const docSnap = await getDoc(doc(db, "locations", id));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setLocation(data);
        // 初始化複雜狀態物件
        const init = {};
        data.checkItems?.forEach(item => {
          init[item.id] = { result: 'normal', desc: '', handling: '', expectedDate: '', photo: null };
        });
        setResults(init);
      }
    };
    fetchLocation();
  }, [id]);

  const handleStatusChange = (itemId, status) => {
    setResults(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], result: status }
    }));
  };

  const getCardStyle = (status) => {
    switch(status) {
      case 'abnormal': return 'border-red-500 bg-red-500/5';
      case 'watch': return 'border-orange-500 bg-orange-500/5';
      case 'normal': return 'border-green-500/30 bg-green-500/5';
      default: return 'border-slate-800 bg-slate-900/30';
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-10">
      {/* 頂部資訊 (班別/天氣) 略 */}
      
      <main className="max-w-md mx-auto p-6 space-y-6">
        {location?.checkItems?.map((item) => (
          <div key={item.id} className={`p-5 rounded-[2rem] border-2 transition-all duration-300 ${getCardStyle(results[item.id]?.result)}`}>
            <div className="flex justify-between mb-2">
              <span className="text-[10px] font-black text-slate-500 uppercase">{item.category}</span>
              {item.isRequired && <span className="text-[10px] text-red-500">必填</span>}
            </div>
            <h3 className="font-bold text-lg mb-1">{item.name}</h3>
            <p className="text-xs text-slate-400 mb-4">標準：{item.standard}</p>

            {/* 四選一按鈕組 */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <StatusBtn active={results[item.id]?.result === 'normal'} label="正常" color="green" onClick={() => handleStatusChange(item.id, 'normal')} />
              <StatusBtn active={results[item.id]?.result === 'watch'} label="待注意" color="orange" onClick={() => handleStatusChange(item.id, 'watch')} />
              <StatusBtn active={results[item.id]?.result === 'abnormal'} label="異常" color="red" onClick={() => handleStatusChange(item.id, 'abnormal')} />
              <StatusBtn active={results[item.id]?.result === 'na'} label="不適用" color="slate" onClick={() => handleStatusChange(item.id, 'na')} />
            </div>

            {/* 動態顯示欄位 */}
            {(results[item.id]?.result === 'abnormal' || results[item.id]?.result === 'watch') && (
              <div className="space-y-3 mt-4 animate-in fade-in slide-in-from-top-2">
                <textarea 
                  placeholder={results[item.id]?.result === 'abnormal' ? "請輸入詳細異常說明 (必填)" : "備註說明"}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm"
                  onChange={(e) => setResults({...results, [item.id]: {...results[item.id], desc: e.target.value}})}
                />
                {results[item.id]?.result === 'abnormal' && (
                  <>
                    <input type="text" placeholder="處理方式 (必填)" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm" />
                    <div className="flex items-center gap-4 bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <Camera size={20} className="text-blue-500" />
                      <span className="text-xs text-slate-500">拍照並上傳 (必填)</span>
                      <input type="file" className="hidden" />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
        
        <button className="w-full bg-blue-600 py-4 rounded-[2rem] font-black text-lg shadow-xl">送出巡檢紀錄</button>
      </main>
    </div>
  );
};

const StatusBtn = ({ active, label, color, onClick }) => {
  const colors = {
    green: active ? 'bg-green-600 text-white' : 'bg-slate-800 text-green-500/50',
    orange: active ? 'bg-orange-600 text-white' : 'bg-slate-800 text-orange-500/50',
    red: active ? 'bg-red-600 text-white' : 'bg-slate-800 text-red-500/50',
    slate: active ? 'bg-slate-600 text-white' : 'bg-slate-800 text-slate-500/50'
  };
  return (
    <button onClick={onClick} className={`py-2 text-[10px] font-black rounded-xl transition-all ${colors[color]}`}>
      {label}
    </button>
  );
};

export default InspectionForm;