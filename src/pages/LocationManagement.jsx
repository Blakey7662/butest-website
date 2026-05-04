import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { MapPin, Plus, Trash2, ArrowLeft, QrCode, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LocationManagement = () => {
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLocations = async () => {
    setLoading(true);
    const snap = await getDocs(collection(db, "locations"));
    setLocations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  useEffect(() => { fetchLocations(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName) return;
    try {
      await addDoc(collection(db, "locations"), {
        name: newName,
        description: newDesc,
        createdAt: serverTimestamp()
      });
      setNewName(''); setNewDesc('');
      fetchLocations();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("確定要刪除此巡檢點嗎？")) {
      await deleteDoc(doc(db, "locations", id));
      fetchLocations();
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-6">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-white transition group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 返回控制台
        </button>

        <h1 className="text-2xl font-bold mb-8 flex items-center gap-3">
          <MapPin className="text-blue-500" /> 巡檢地點設定
        </h1>

        {/* 新增表單 */}
        <form onSubmit={handleAdd} className="bg-[#0f172a] p-6 rounded-2xl border border-slate-800 mb-8 flex flex-col md:row gap-4 items-end shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <div className="space-y-2">
              <label className="text-xs text-slate-500 font-bold uppercase ml-1">地點名稱</label>
              <input 
                type="text" value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="例如：B1 電機房"
                className="w-full bg-[#020617] border border-slate-700 rounded-xl p-3 outline-none focus:border-blue-500 transition text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-500 font-bold uppercase ml-1">描述備註</label>
              <input 
                type="text" value={newDesc} onChange={e => setNewDesc(e.target.value)}
                placeholder="主要電力控制設備區"
                className="w-full bg-[#020617] border border-slate-700 rounded-xl p-3 outline-none focus:border-blue-500 transition text-sm"
              />
            </div>
          </div>
          <button type="submit" className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-blue-900/20">
            <Plus size={18} /> 建立地點
          </button>
        </form>

        {/* 列表顯示 */}
        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-500" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {locations.map(loc => (
              <div key={loc.id} className="bg-[#0f172a] p-5 rounded-2xl border border-slate-800 flex justify-between items-center group hover:border-slate-600 transition shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#020617] rounded-xl text-slate-400 group-hover:text-blue-400 transition">
                    <QrCode size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100">{loc.name}</h3>
                    <p className="text-xs text-slate-500">{loc.description || '無備註資訊'}</p>
                  </div>
                </div>
                <button onClick={() => handleDelete(loc.id)} className="text-slate-600 hover:text-red-500 transition p-2 hover:bg-red-500/10 rounded-lg">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationManagement;