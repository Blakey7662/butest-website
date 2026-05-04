import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { 
  PlayCircle, AlertCircle, LayoutDashboard, CheckCircle2, 
  Clock, Activity, ShieldCheck, LogOut, ArrowRight,
  ClipboardCheck, ThermometerSun
} from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [todayStats, setTodayStats] = useState({
    completed: 0,
    total: 16,
    anomalies: 0,
    pendingReview: 0,
    watchCount: 0 // 待注意數量
  });

  // 取得今日日期字串 YYYY-MM-DD
  const getTodayStr = () => new Date().toISOString().split('T')[0];

  useEffect(() => {
    // 使用實時監聽 (onSnapshot)，數據變動時首頁會自動更新
    const today = getTodayStr();
    const q = query(collection(db, "reports"), where("date", "==", today));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let completedIds = new Set();
      let anomalies = 0;
      let reviewNeeded = 0;
      let watches = 0;

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        completedIds.add(data.locationId);
        
        // 統計判定結果
        if (data.status === 'abnormal') anomalies++;
        if (data.status === 'watch') watches++;
        
        // 統計複核狀態 (假設資料表中有 reviewStatus 欄位)
        if (data.reviewStatus === 'pending') reviewNeeded++;
      });

      setTodayStats({
        total: 16,
        completed: completedIds.size,
        anomalies,
        pendingReview: reviewNeeded,
        watchCount: watches
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const completionRate = Math.round((todayStats.completed / todayStats.total) * 100);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans pb-10">
      {/* 導覽列 */}
      <nav className="p-6 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-[#020617]/80 backdrop-blur-lg z-20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-900/40">
            <ShieldCheck className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white leading-none">智聯巡檢</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-tighter">Smart Security v2.4</p>
          </div>
        </div>
        <button onClick={logout} className="p-2 hover:bg-red-500/10 text-slate-500 hover:text-red-500 transition-colors rounded-xl">
          <LogOut size={20} />
        </button>
      </nav>

      <main className="max-w-md mx-auto p-6 space-y-8">
        {/* 歡迎語 */}
        <section className="animate-in fade-in slide-in-from-top-4 duration-700">
          <p className="text-blue-500 font-bold text-xs uppercase tracking-widest mb-1">Welcome back,</p>
          <h2 className="text-3xl font-black text-white">{user?.displayName || '巡檢同仁'}</h2>
          <div className="flex items-center gap-2 mt-2 text-slate-500 text-xs font-medium">
            <Clock size={14} /> {new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </div>
        </section>

        {/* 核心進度卡片 */}
        <section className="bg-gradient-to-br from-[#0f172a] to-[#020617] p-8 rounded-[3rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl group-hover:bg-blue-600/20 transition-all"></div>
          
          <div className="relative flex justify-between items-center">
            <div>
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">今日完成率</p>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black text-white">{completionRate}</span>
                <span className="text-xl font-bold text-blue-500">%</span>
              </div>
              <p className="text-xs text-slate-400 mt-4 font-medium flex items-center gap-2">
                <CheckCircle2 size={14} className="text-green-500" /> 已完成 {todayStats.completed} / {todayStats.total} 點位
              </p>
            </div>
            
            {/* 進度環 (SVG) */}
            <div className="relative w-24 h-24">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <path className="text-slate-800" strokeWidth="3" stroke="currentColor" fill="transparent" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="text-blue-500 transition-all duration-1000 ease-out" strokeWidth="3" strokeDasharray={`${completionRate}, 100`} strokeLinecap="round" stroke="currentColor" fill="transparent" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-500 uppercase">
                Progress
              </div>
            </div>
          </div>
        </section>

        {/* 狀態數據網格 */}
        <section className="grid grid-cols-2 gap-4">
          <SmallStatCard 
            label="異常狀態" 
            value={todayStats.anomalies} 
            icon={<AlertCircle className="text-red-500" />} 
            subLabel="件需處理"
            isWarning={todayStats.anomalies > 0}
          />
          <SmallStatCard 
            label="待注意項" 
            value={todayStats.watchCount} 
            icon={<Activity className="text-orange-500" />} 
            subLabel="件追蹤中"
          />
          <SmallStatCard 
            label="剩餘巡檢" 
            value={todayStats.total - todayStats.completed} 
            icon={<ClipboardCheck className="text-blue-400" />} 
            subLabel="處未完成"
          />
          <SmallStatCard 
            label="待複核" 
            value={todayStats.pendingReview} 
            icon={<Clock className="text-indigo-400" />} 
            subLabel="主管審核"
          />
        </section>

        {/* 操作按鈕區 */}
        <section className="space-y-4 pt-4">
          <ActionButton 
            icon={<PlayCircle size={28}/>} 
            title="開始巡檢" 
            subtitle="依序執行 16 個點位檢查" 
            color="bg-blue-600"
            onClick={() => navigate('/dashboard')}
            primary
          />
          <ActionButton 
            icon={<Activity size={28}/>} 
            title="異常追蹤" 
            subtitle="篩選「異常」與「待注意」項目" 
            color="bg-slate-800"
            onClick={() => navigate('/anomaly-tracker')}
          />
          
          {/* 主管與管理員專屬按鈕 */}
          {(role === 'supervisor' || role === 'admin') && (
            <div className="pt-2 animate-in fade-in duration-1000">
              <div className="h-px bg-slate-800 w-full mb-6"></div>
              <ActionButton 
                icon={<LayoutDashboard size={28}/>} 
                title="主管儀表板" 
                subtitle="查看完整統計、完成率與逾期報表" 
                color="bg-indigo-600/20 text-indigo-400 border border-indigo-600/30"
                onClick={() => navigate('/manager')}
              />
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

// 子組件：小統計卡片
const SmallStatCard = ({ label, value, icon, subLabel, isWarning }) => (
  <div className={`bg-[#0f172a] p-5 rounded-[2rem] border ${isWarning ? 'border-red-500/50 bg-red-500/5' : 'border-slate-800'} transition-all shadow-lg`}>
    <div className="flex items-center gap-2 mb-2">
      <div className="p-1.5 bg-slate-950 rounded-lg">{icon}</div>
      <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{label}</span>
    </div>
    <div className="flex items-baseline gap-1">
      <span className={`text-2xl font-black ${isWarning ? 'text-red-500' : 'text-white'}`}>{value}</span>
      <span className="text-[10px] text-slate-500 font-bold uppercase">{subLabel}</span>
    </div>
  </div>
);

// 子組件：大型操作按鈕
const ActionButton = ({ icon, title, subtitle, color, onClick, primary }) => (
  <button 
    onClick={onClick} 
    className={`w-full ${color} p-6 rounded-[2.2rem] flex items-center justify-between group hover:scale-[1.02] active:scale-95 transition-all shadow-xl`}
  >
    <div className="flex items-center gap-5">
      <div className={`p-4 ${primary ? 'bg-white/20' : 'bg-slate-900'} rounded-2xl shadow-inner group-hover:rotate-12 transition-transform`}>
        {icon}
      </div>
      <div>
        <div className={`font-black text-lg ${primary ? 'text-white' : ''}`}>{title}</div>
        <div className={`text-[10px] font-bold uppercase tracking-tight mt-0.5 ${primary ? 'text-white/70' : 'text-slate-500'}`}>{subtitle}</div>
      </div>
    </div>
    <div className={`p-2 rounded-full ${primary ? 'bg-white/10' : 'bg-slate-900'} opacity-0 group-hover:opacity-100 transition-opacity`}>
      <ArrowRight size={20} />
    </div>
  </button>
);

export default Home;