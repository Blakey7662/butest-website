import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // 如果還在跑驗證，顯示深色背景避免白屏
  if (loading) {
    return <div className="h-screen bg-[#020617] flex items-center justify-center text-blue-500 font-bold">系統載入中...</div>;
  }
  
  // 核心修正：沒登入就一定回根目錄
  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;