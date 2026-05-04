import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';

const InspectionForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [location, setLocation] = useState(null);
  const [results, setResults] = useState({}); // 儲存各項目的檢查結果
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocation = async () => {
      const docRef = doc(db, "locations", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setLocation(data);
        // 初始化檢查結果狀態，預設皆為 'normal'
        const initialResults = {};
        data.checkItems?.forEach(item => {
          initialResults[item] = 'normal';
        });
        setResults(initialResults);
      }
      setLoading(false);
    };
    fetchLocation();
  }, [id]);

  const handleSubmit = async () => {
    // 判斷整體是否有異常
    const hasAbnormal = Object.values(results).includes('abnormal');
    
    await addDoc(collection(db, "reports"), {
      locationId: id,
      locationName: location.name,
      inspectorName: user.displayName || user.email,
      details: results,
      status: hasAbnormal ? 'abnormal' : 'normal',
      timestamp: serverTimestamp()
    });
    
    alert("巡檢報告已提交！");
    navigate('/dashboard');
  };

  if (loading) return <div className="h-screen bg-[#020617] flex items-center justify-center text-blue-500"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-6">
      <div className="max-w-md mx-auto">
        <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-slate-500"><ArrowLeft size={18}/> 返回</button>
        
        <h1 className="text-2xl font-bold mb-2">{location?.name}</h1>
        <p className="text-slate-500 mb-8 font-light text-sm text-blue-400/80 tracking-widest uppercase">執行檢查清單</p>

        <div className="space-y-6">
          {location?.checkItems?.map((item) => (
            <div key={item} className="bg-[#0f172a] p-5 rounded-2xl border border-slate-800 shadow-lg">
              <p className="font-bold mb-4 text-slate-100">{item}</p>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setResults({...results, [item]: 'normal'})}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${results[item] === 'normal' ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
                >
                  <CheckCircle2 size={18} /> 正常
                </button>
                <button 
                  onClick={() => setResults({...results, [item]: 'abnormal'})}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${results[item] === 'abnormal' ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
                >
                  <AlertCircle size={18} /> 異常
                </button>
              </div>
            </div>
          ))}
        </div>

        <button 
          onClick={handleSubmit}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl mt-12 shadow-xl shadow-blue-900/20 transition-all uppercase tracking-widest"
        >
          提交巡檢報告
        </button>
      </div>
    </div>
  );
};

export default InspectionForm;