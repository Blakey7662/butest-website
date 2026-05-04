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
import InitData from './pages/InitData'; // 👈 1. 這裡要新增引入

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

  if (role === 'supervisor' || role === 'admin') {
    return <Navigate to="/manager" replace />;
  }

  if (role === 'inspector') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<EntryPoint />} />
          
          {/* 【巡檢相關】 */}
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

          {/* 【人員管理】 */}
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

          {/* 👈 2. 資料初始化路徑（建議放在 * 之前） */}
          <Route path="/init" element={<InitData />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;