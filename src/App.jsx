import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import LocationList from './pages/LocationList';
import InspectionForm from './pages/InspectionForm';
import UserManagement from './pages/UserManagement';
import ManagerDashboard from './pages/ManagerDashboard'; // 已匯入

// 修正後的入口組件：根據角色 (Role) 自動分流
const EntryPoint = () => {
  const { user, role, loading } = useAuth(); // 這裡多拿一個 role

  if (loading) {
    return (
      <div className="h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // 1. 沒登入：去登入頁
  if (!user) return <Login />;

  // 2. 有登入：根據角色決定去哪
  // 如果是主管，去 /manager；如果是員工，去 /dashboard
  return role === 'manager' 
    ? <Navigate to="/manager" replace /> 
    : <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* 根目錄入口 */}
          <Route path="/" element={<EntryPoint />} />
          
          {/* 【一般員工】路由 */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['user', 'manager']}>
              <LocationList />
            </ProtectedRoute>
          } />
          
          <Route path="/inspect/:id" element={
            <ProtectedRoute allowedRoles={['user', 'manager']}>
              <InspectionForm />
            </ProtectedRoute>
          } />

          {/* 【主管專用】路由 */}
          <Route path="/manager" element={
            <ProtectedRoute allowedRoles={['manager']}>
              <ManagerDashboard />
            </ProtectedRoute>
          } />

          {/* 【人員管理】通常也是主管用 */}
          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['manager']}>
              <UserManagement />
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