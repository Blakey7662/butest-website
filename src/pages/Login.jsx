import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, Loader2 } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      // 1. Firebase 驗證帳密
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      // 2. 從 Firestore 抓取角色權限，並加入空值保護
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // 檢查帳號是否被停用 (空值保護: 若無 isActive 欄位則預設為 true)
        const isActive = userData.isActive !== undefined ? userData.isActive : true;
        
        if (!isActive) {
          alert("此帳號已被停用，請聯絡管理員。");
          await auth.signOut();
          return;
        }

        // 存入角色資訊 (空值保護: 若無 role 則預設為 inspector)
        const userRole = userData.role || "inspector";
        localStorage.setItem('userRole', userRole);
        
        // 成功後導向首頁
        navigate('/dashboard');
      } else {
        // 如果 Auth 有帳號但 Firestore 沒資料，建立一個基礎權限避免崩潰
        alert("找不到權限設定，請聯繫系統管理員。");
        console.error("Firestore 中找不到 UID:", user.uid);
      }
    } catch (error) {
      console.error("登入錯誤詳情:", error);
      let errorMsg = "登入失敗：帳號或密碼錯誤";
      if (error.code === 'auth/user-not-found') errorMsg = "找不到此帳號";
      if (error.code === 'auth/wrong-password') errorMsg = "密碼輸入錯誤";
      if (error.code === 'auth/too-many-requests') errorMsg = "嘗試次數過多，請稍後再試";
      
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 text-slate-200 font-sans">
      <div className="w-full max-w-md">
        {/* Logo 區域 */}
        <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600/20 rounded-3xl mb-4 border border-blue-500/30 shadow-[0_0_20px_rgba(37,99,235,0.2)]">
            <ShieldCheck className="w-10 h-10 text-blue-500" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">社區巡檢管理</h1>
          <p className="text-slate-500 mt-2 font-medium tracking-widest uppercase text-[10px]">Security Inspection System</p>
        </div>

        {/* 登入卡片 */}
        <div className="bg-[#0f172a] rounded-[2.5rem] shadow-2xl border border-slate-800 p-8 shadow-blue-900/10">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* 帳號輸入 */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">帳號 Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                <input 
                  type="email" 
                  className="w-full pl-12 pr-4 py-4 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white placeholder:text-slate-700"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* 密碼輸入 */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">登入密碼</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                <input 
                  type="password" 
                  className="w-full pl-12 pr-4 py-4 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-white placeholder:text-slate-700"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            
            {/* 登入按鈕 */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-lg shadow-lg shadow-blue-900/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  驗證中...
                </>
              ) : '立即登入'}
            </button>
          </form>
        </div>

        {/* 底部裝飾文字 */}
        <div className="mt-8 text-center">
          <p className="text-slate-700 text-[10px] font-bold uppercase tracking-tighter">
            © 2026 專業物業管理系統 · 核心版本 v2.4
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;