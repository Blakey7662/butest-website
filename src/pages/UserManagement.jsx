import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { UserCog, Trash2, ArrowLeft, Search, Shield, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    const snap = await getDocs(collection(db, "users"));
    setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateDoc(doc(db, "users", userId), { role: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) { alert("更變失敗"); }
  };

  const handleDelete = async (userId, name) => {
    if (window.confirm(`確定要將「${name}」從系統完全移除嗎？此操作將取消其所有權限。`)) {
      await deleteDoc(doc(db, "users", userId));
      setUsers(users.filter(u => u.id !== userId));
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-6">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-white transition group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 返回控制台
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <UserCog className="text-blue-500" /> 人員權限管理
          </h1>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" placeholder="搜尋姓名或 Email..."
              className="w-full bg-[#0f172a] border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 transition"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-[#0f172a] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-slate-900/50 border-b border-slate-800 text-slate-500 text-[10px] uppercase tracking-widest font-black">
              <tr>
                <th className="p-4">使用者資訊</th>
                <th className="p-4 text-center">當前角色代碼</th>
                <th className="p-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              {loading ? (
                <tr><td colSpan="3" className="p-12 text-center"><Loader2 className="animate-spin inline text-blue-500" /></td></tr>
              ) : filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-800/30 transition">
                  <td className="p-4">
                    <div className="font-bold text-slate-100">{user.name || '未命名'}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{user.email}</div>
                  </td>
                  <td className="p-4 text-center">
                    <select 
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="bg-[#020617] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-blue-400 outline-none focus:border-blue-500 font-bold"
                    >
                      <option value="inspector">巡檢員 (inspector)</option>
                      <option value="supervisor">主管 (supervisor)</option>
                      <option value="admin">管理員 (admin)</option>
                    </select>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleDelete(user.id, user.name)} className="p-2.5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;