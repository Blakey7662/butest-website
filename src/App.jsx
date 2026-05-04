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

  // --- 根據你的新代碼進行分流 ---
  // 1. 如果是主管或管理員，進入管理後台
  if (role === 'supervisor' || role === 'admin') {
    return <Navigate to="/manager" replace />;
  }

  // 2. 如果是巡檢員，進入巡檢列表
  if (role === 'inspector') {
    return <Navigate to="/dashboard" replace />;
  }

  // 3. 如果角色不明，預設去巡檢列表 (防止卡死)
  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<EntryPoint />} />
          
          {/* 【巡檢相關】三種角色通常都能看，主管有時也需要巡視 */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['inspector', 'supervisor', 'admin']}>
              <LocationList />
            </ProtectedRoute>
          } />
          
          <Route path="/inspect/:id" element={
            <ProtectedRoute allowedRoles={['inspector', 'supervisor', 'admin']}>
              <InspectionForm />
            </ProtectedRoute>
          } />

          {/* 【主管/管理員專用】 */}
          <Route path="/manager" element={
            <ProtectedRoute allowedRoles={['supervisor', 'admin']}>
              <ManagerDashboard />
            </ProtectedRoute>
          } />

          {/* 【人員管理】通常限定 admin 或 supervisor */}
          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
              <UserManagement />
            </ProtectedRoute>
          } />
		  
		  <Route path="/admin/locations" element={
			<ProtectedRoute allowedRoles={['admin', 'supervisor']}>
			  <LocationManagement />
			</ProtectedRoute>
		  } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;