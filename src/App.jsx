import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import LocationList from './pages/LocationList';
import InspectionForm from './pages/InspectionForm';
import UserManagement from './pages/UserManagement';

// 建立一個處理「初始入口」的組件
const EntryPoint = () => {
  const { user, loading } = useAuth();

  // 如果還在確認身分，顯示全螢幕深色背景（防止白屏）
  if (loading) {
    return (
      <div className="h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // 根據是否有使用者，決定顯示登入頁或首頁
  return user ? <Navigate to="/dashboard" replace /> : <Login />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* 根目錄入口 */}
          <Route path="/" element={<EntryPoint />} />
          
          {/* 受保護的路由 */}
          <Route path="/dashboard" element={
            <ProtectedRoute><LocationList /></ProtectedRoute>
          } />
          
          <Route path="/inspect/:id" element={
            <ProtectedRoute><InspectionForm /></ProtectedRoute>
          } />

          <Route path="/admin/users" element={
            <ProtectedRoute><UserManagement /></ProtectedRoute>
          } />

          {/* 萬用導向 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;