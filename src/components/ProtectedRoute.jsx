import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  // 1. 從 AuthContext 裡多拿一個 role
  const { user, role, loading } = useAuth();

  // 如果還在跑驗證，顯示深色背景避免白屏
  if (loading) {
    return (
      <div className="h-screen bg-[#020617] flex items-center justify-center text-blue-500 font-bold">
        系統載入中...
      </div>
    );
  }
  
  // 2. 沒登入就回根目錄（登入頁）
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // 3. 權限檢查：如果該路由有規定特定角色，但當前使用者角色不符
  // 例如：該頁面限 ['manager']，但使用者的 role 是 'user'
  if (allowedRoles && !allowedRoles.includes(role)) {
    console.warn(`權限不足：嘗試進入限 ${allowedRoles} 的頁面，但使用者角色為 ${role}`);
    return <Navigate to="/" replace />;
  }

  // 4. 驗證通過，顯示該頁面內容
  return children;
};

export default ProtectedRoute;