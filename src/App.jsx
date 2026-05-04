import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import LocationList from './pages/LocationList';
import InspectionForm from './pages/InspectionForm';
import UserManagement from './pages/UserManagement';
import ManagerDashboard from './pages/ManagerDashboard';

// 修正後的入口組件：加入 supervisor 分流邏輯
const EntryPoint = () => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return <Login />;

  // ✅ 如果是主管或督導，都導向管理後台
  if (role === 'manager' || role === 'supervisor') {
    return <Navigate to="/manager" replace />;
  }

  // 一般員工導向巡檢列表
  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<EntryPoint />} />
          
          {/* ✅ 允許 supervisor 進入一般巡檢頁面 */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['user', 'manager', 'supervisor']}>
              <LocationList />
            </ProtectedRoute>
          } />
          
          <Route path="/inspect/:id" element={
            <ProtectedRoute allowedRoles={['user', 'manager', 'supervisor']}>
              <InspectionForm />
            </ProtectedRoute>
          } />

          {/* ✅ 允許 supervisor 進入主管後台 */}
          <Route path="/manager" element={
            <ProtectedRoute allowedRoles={['manager', 'supervisor']}>
              <ManagerDashboard />
            </ProtectedRoute>
          } />

          {/* ✅ 允許 supervisor 進行人員管理 */}
          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['manager', 'supervisor']}>
              <UserManagement />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;