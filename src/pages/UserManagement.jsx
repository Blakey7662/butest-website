import React, { useEffect, useState } from 'react';
import { db, secondaryAuth, auth } from '../firebase'; 
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { collection, getDocs, doc, setDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ChevronLeft, UserPlus, Shield, User, 
  Search, Loader2, X, Key, Mail, UserCheck, Edit3, Send
} from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 編輯與新增狀態
  const [editingUser, setEditingUser] = useState(null);
  const [newUserData, setNewUserData] = useState({
    name: '', email: '', password: '', role: 'inspector'
  });
  const [actionLoading, setActionLoading] = useState(false);

  const navigate = useNavigate();
  const { role } = useAuth();

  useEffect(() => {
    if (role !== 'admin') { navigate('/dashboard'); }
    fetchUsers();
  }, [role]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "users"), orderBy("name", "asc"));
      const snapshot = await getDocs(q);
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 建立新帳號邏輯
  const handleAddUser = async (e) => {
    e.preventDefault();
    if (newUserData.password.length < 6) return alert("密碼至少需 6 位數");
    
    setActionLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newUserData.email, newUserData.password);
      const uid = userCredential.user.uid;
      await setDoc(doc(db, "users", uid), {
        name: newUserData.name,
        email: newUserData.email,
        role: newUserData.role,
        isActive: true,
        createdAt: new Date()
      });
      alert("帳號建立成功！");
      setShowAddModal(false);
      setNewUserData({ name: '', email: '', password: '', role: 'inspector' });
      fetchUsers();
      await secondaryAuth.signOut();
    } catch (error) {
      alert("建立失敗：" + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // 修改資料邏輯
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await updateDoc(doc(db, "users", editingUser.id), {
        name: editingUser.name,
        role: editingUser.role
      });
      alert("資料更新成功！");
      setShowEditModal(false);
      fetchUsers();
    } catch (error) {
      alert("更新失敗");
    } finally {
      setActionLoading(false);
    }
  };

  // 重設密碼信
  const handleResetPassword = async (email) => {
    if (!window.confirm(`確定要發送密碼重設信件至 ${email} 嗎？`)) return;
    try {
      await sendPasswordResetEmail(auth, email);
      alert("重設信件已寄出。");
    } catch (error) {
      alert("發送失敗");
    }
  };

  if (loading) return <div className="min-h-screen bg-[#020617] flex justify-center items-center text-blue-500">載入中...</div>;

  return (
    <div className="min-h-screen bg-[#020617] pb-10 text-slate-100 font-sans">
      {/* Header */}
      <div className="bg-[#0f172a] p-6 sticky top-0 z-20 border-b border-slate-800 flex justify-between items-center">
        <div className="flex items-center">
          <button onClick={() => navigate('/dashboard')} className="mr-4 text-slate-400 p-1 active:scale-90"><ChevronLeft /></button>
          <h1 className="text-xl font-black">人員管理</h1>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg active:scale-95"
        >
          <UserPlus className="w-5 h-5" />
        </button>
      </div>

      {/* 搜尋欄 */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
          <input 
            type="text" placeholder="搜尋人員..." 
            className="w-full bg-[#0f172a] border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:border-blue-500"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* 使用者列表 */}
      <div className="px-4 space-y-4">
        {users.filter(u => u.name.includes(searchTerm) || u.email.includes(searchTerm)).map((u) => (
          <div key={u.id} className="bg-[#0f172a] rounded-3xl border border-slate-800 p-5 shadow-lg">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-slate-900 rounded-2xl text-blue-500"><User className="w-6 h-6" /></div>
                <div>
                  <h3 className="font-bold text-lg">{u.name}</h3>
                  <p className="text-[10px] text-slate-500">{u.email}</p>
                </div>
              </div>
              <button 
                onClick={() => { setEditingUser(u); setShowEditModal(true); }}
                className="p-2 bg-slate-800 text-slate-400 rounded-lg border border-slate-700"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="mt-5 flex items-center justify-between">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                {u.role}
              </span>
              <button onClick={() => handleResetPassword(u.email)} className="flex items-center text-[10px] font-bold text-orange-500">
                <Send className="w-3 h-3 mr-1" /> 重設密碼
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* --- 新增人員彈窗 (Add Modal) --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f172a] w-full max-w-sm rounded-[2.5rem] border border-slate-800 p-8 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black">建立新帳號</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-500"><X /></button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 ml-1">人員姓名</label>
                <div className="relative mt-1">
                  <UserCheck className="absolute left-4 top-3.5 w-4 h-4 text-slate-600" />
                  <input 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 pl-11 text-sm outline-none focus:border-blue-500 text-white" 
                    placeholder="輸入姓名" required
                    value={newUserData.name} onChange={e => setNewUserData({...newUserData, name: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 ml-1">電子信箱</label>
                <div className="relative mt-1">
                  <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-600" />
                  <input 
                    type="email" className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 pl-11 text-sm outline-none focus:border-blue-500 text-white" 
                    placeholder="帳號 (Email)" required
                    value={newUserData.email} onChange={e => setNewUserData({...newUserData, email: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 ml-1">預設密碼</label>
                <div className="relative mt-1">
                  <Key className="absolute left-4 top-3.5 w-4 h-4 text-slate-600" />
                  <input 
                    type="password" className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 pl-11 text-sm outline-none focus:border-blue-500 text-white" 
                    placeholder="至少 6 位數" required
                    value={newUserData.password} onChange={e => setNewUserData({...newUserData, password: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 ml-1">權限角色</label>
                <select 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 px-4 mt-1 text-sm outline-none text-slate-300"
                  value={newUserData.role} onChange={e => setNewUserData({...newUserData, role: e.target.value})}
                >
                  <option value="inspector">巡檢人員</option>
                  <option value="supervisor">主管</option>
                  <option value="admin">管理員</option>
                </select>
              </div>

              <button 
                type="submit" disabled={actionLoading}
                className="w-full bg-blue-600 py-4 rounded-2xl font-black text-white mt-4 shadow-lg active:scale-95 transition-all disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="animate-spin mx-auto" /> : '確認建立帳號'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- 修改資料彈窗 (Edit Modal) --- */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f172a] w-full max-w-sm rounded-[2.5rem] border border-slate-800 p-8 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black">修改人員資料</h2>
              <button onClick={() => setShowEditModal(false)} className="text-slate-500"><X /></button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 ml-1">帳號 (不可修改)</label>
                <div className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3.5 px-4 text-sm text-slate-600 font-mono">
                  {editingUser.email}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 ml-1">人員姓名</label>
                <input 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 px-4 text-sm outline-none focus:border-blue-500 text-white" 
                  value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 ml-1">權限角色</label>
                <select 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3.5 px-4 text-sm outline-none text-white"
                  value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value})}
                >
                  <option value="inspector">巡檢人員</option>
                  <option value="supervisor">主管</option>
                  <option value="admin">管理員</option>
                </select>
              </div>

              <button 
                type="submit" disabled={actionLoading}
                className="w-full bg-blue-600 py-4 rounded-2xl font-black text-white mt-4 shadow-lg active:scale-95 transition-all"
              >
                {actionLoading ? <Loader2 className="animate-spin mx-auto" /> : '儲存修改'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;