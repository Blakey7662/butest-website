import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { MapPin, Plus, Trash2, ArrowLeft, ClipboardList, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LocationManagement = () => {
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [newName, setNewName] = useState('');
  const [newItem, setNewItem] = useState('');
  const [selectedLoc, setSelectedLoc] = useState(null); // 當前正在編輯哪個地點的項目

  const fetchLocations = async () => {
    const snap = await getDocs(collection(db, "locations"));
    setLocations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => { fetchLocations(); }, []);

  // 新增地點
  const handleAddLocation = async (e) => {
    e.preventDefault();
    if (!newName) return;
    await addDoc(collection(db, "locations"), {
      name: newName,
      checkItems: ["環境整潔", "設備運作狀況"], // 預設項目
      createdAt: new Date()
    });
    setNewName('');
    fetchLocations();
  };

  // 新增檢查項到特定地點
  const handleAddItem = async (locId) => {
    if (!newItem) return;
    const locRef = doc(db, "locations", locId);
    await updateDoc(locRef, {
      checkItems: arrayUnion(newItem)
    });
    setNewItem('');
    fetchLocations();
  };

  // 刪除檢查項
  const handleDeleteItem = async (locId, item) => {
    const locRef = doc(db, "locations", locId);
    await updateDoc(locRef, {
      checkItems: arrayRemove(item)
    });
    fetchLocations();
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-6">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-white">
          <ArrowLeft size={18} /> 返回控制台
        </button>

        <h1 className="text-2xl font-bold mb-8 flex items-center gap-3">
          <ClipboardList className="text-blue-500" /> 個別檢查項目設定
        </h1>

        {/* 新增地點 */}
        <form onSubmit={handleAddLocation} className="flex gap-2 mb-8">
          <input 
            type="text" value={newName} onChange={e => setNewName(e.target.value)}
            placeholder="新增巡檢地點名稱..."
            className="flex-1 bg-[#0f172a] border border-slate-800 rounded-xl p-3 outline-none focus:border-blue-500"
          />
          <button type="submit" className="bg-blue-600 px-6 py-3 rounded-xl font-bold transition hover:bg-blue-500">新增地點</button>
        </form>

        {/* 地點列表與項目管理 */}
        <div className="grid grid-cols-1 gap-6">
          {locations.map(loc => (
            <div key={loc.id} className="bg-[#0f172a] p-6 rounded-2xl border border-slate-800 shadow-xl">
              <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <MapPin size={18} className="text-blue-400" /> {loc.name}
                </h3>
                <button onClick={async () => {
                  if(window.confirm("確定刪除此地點？")) {
                    await deleteDoc(doc(db, "locations", loc.id));
                    fetchLocations();
                  }
                }} className="text-slate-600 hover:text-red-500"><Trash2 size={18}/></button>
              </div>

              {/* 該地點的檢查項目清單 */}
              <div className="flex flex-wrap gap-2 mb-4">
                {loc.checkItems?.map((item, index) => (
                  <span key={index} className="bg-slate-800 px-3 py-1 rounded-full text-xs flex items-center gap-2 border border-slate-700">
                    {item}
                    <X size={14} className="cursor-pointer hover:text-red-400" onClick={() => handleDeleteItem(loc.id, item)} />
                  </span>
                ))}
              </div>

              {/* 新增項目輸入框 */}
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="輸入新檢查項（如：漏水檢查）"
                  className="flex-1 bg-[#020617] border border-slate-800 rounded-lg p-2 text-sm outline-none focus:border-blue-400"
                  onKeyDown={(e) => {
                    if(e.key === 'Enter') {
                      handleAddItem(loc.id);
                      setNewItem('');
                    }
                  }}
                  onChange={(e) => setNewItem(e.target.value)}
                />
                <button 
                  onClick={() => handleAddItem(loc.id)}
                  className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-xs font-bold"
                >
                  加入項目
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LocationManagement;