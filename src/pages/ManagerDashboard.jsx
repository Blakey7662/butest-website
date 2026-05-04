import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, getDocs, limit, orderBy } from 'firebase/firestore';
import { Users, ClipboardCheck, AlertTriangle, TrendingUp } from 'lucide-react';

const ManagerDashboard = () => {
  const [stats, setStats] = useState({ userCount: 0, reportCount: 0, pendingIssues: 0 });
  const [recentLogs, setRecentLogs] = useState([]);

  useEffect(() => {
    // 這裡模擬從 Firebase 抓取統計數據
    const fetchStats = async () => {
      // 實際開發時，你會在這裡使用 getDocs(collection(db, 'reports')) 等
      setStats({ userCount: 12, reportCount: 156, pendingIssues: 3 });
      setRecentLogs([
        { id: 1, user: '王小明', action: '完成 A 區巡檢', time: '10 分鐘前' },
        { id: 2, user: '李大華', action: '回報設備故障', time: '25 分鐘前' },
      ]);
    };
    fetchStats();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">主管監控儀表板</h1>

      {/* 數據卡片區 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon={<Users className="text-blue-500" />} title="巡檢人員" value={stats.userCount} color="bg-blue-50" />
        <StatCard icon={<ClipboardCheck className="text-green-500" />} title="累計報表" value={stats.reportCount} color="bg-green-50" />
        <StatCard icon={<AlertTriangle className="text-red-500" />} title="待處理異常" value={stats.pendingIssues} color="bg-red-50" />
        <StatCard icon={<TrendingUp className="text-purple-500" />} title="本月達成率" value="98%" color="bg-purple-50" />
      </div>

      {/* 最近動態表格 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 font-semibold">最新巡檢動態</div>
        <div className="divide-y divide-slate-100">
          {recentLogs.map(log => (
            <div key={log.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition">
              <div>
                <span className="font-medium text-slate-700">{log.user}</span>
                <span className="mx-2 text-slate-400">|</span>
                <span className="text-slate-600">{log.action}</span>
              </div>
              <span className="text-sm text-slate-400">{log.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 簡單的卡片子組件
const StatCard = ({ icon, title, value, color }) => (
  <div className={`${color} p-6 rounded-2xl flex items-center space-x-4 shadow-sm`}>
    <div className="bg-white p-3 rounded-lg shadow-sm">{icon}</div>
    <div>
      <p className="text-sm text-slate-500 font-medium">{title}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  </div>
);

export default ManagerDashboard;