import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import LocationList from './pages/LocationList';
import InspectionForm from './pages/InspectionForm';
import UserManagement from './pages/UserManagement';
import ManagerDashboard from './pages/ManagerDashboard';
import LocationManagement from './pages/LocationManagement';
import Home from './pages/Home';
import AnomalyTracker from './pages/AnomalyTracker';

// 修正後的入口組件：登入後統一導向首頁 (Home)
const EntryPoint = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // 1. 沒登入：去登入頁
  if (!user) return <Login />;

  // 2. 已登入：統一去首頁 (Home 會根據角色顯示對應的功能按鈕)
  return <Navigate to="/home" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* 根目錄入口 */}
          <Route path="/" element={<EntryPoint />} />
          
          {/* 【首頁】顯示進度、巡檢、異常追蹤按鈕 */}
          <Route path="/home" element={
            <ProtectedRoute allowedRoles={['inspector', 'supervisor', 'admin']}>
              <Home />
            </ProtectedRoute>
          } />

          {/* 【開始巡檢】16 個巡檢點清單 */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['inspector', 'supervisor', 'admin']}>
              <LocationList />
            </ProtectedRoute>
          } />
          
          {/* 【巡檢執行】點入巡檢點後的點檢項目表單 */}
          <Route path="/inspect/:id" element={
            <ProtectedRoute allowedRoles={['inspector', 'supervisor', 'admin']}>
              <InspectionForm />
            </ProtectedRoute>
          } />

          {/* 【異常追蹤】顯示異常/待注意清單，提供主管複核 */}
          <Route path="/anomaly-tracker" element={
            <ProtectedRoute allowedRoles={['inspector', 'supervisor', 'admin']}>
              <AnomalyTracker />
            </ProtectedRoute>
          } />

          {/* 【主管儀表板】統計圖表、完成率分析 */}
          <Route path="/manager" element={
            <ProtectedRoute allowedRoles={['supervisor', 'admin']}>
              <ManagerDashboard />
            </ProtectedRoute>
          } />

          {/* 【人員管理】管理帳號與權限 (管理員/主管專用) */}
          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
              <UserManagement />
            </ProtectedRoute>
          } />
          
          {/* 【巡檢點管理】新增、修改、停用巡檢點與項目 (管理員/主管專用) */}
          <Route path="/admin/locations" element={
            <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
              <LocationManagement />
            </ProtectedRoute>
          } />

          {/* 萬用導向 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;