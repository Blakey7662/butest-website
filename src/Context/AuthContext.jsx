import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true); // 初始設為 true

  useEffect(() => {
    // 這是 Firebase 檢查登入狀態的核心
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("Auth 狀態改變:", currentUser ? "已登入" : "未登入");
      
      try {
        if (currentUser) {
          // 如果有登入，去抓角色資料
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setRole(userDoc.data().role);
          }
          setUser(currentUser);
        } else {
          setUser(null);
          setRole(null);
        }
      } catch (error) {
        console.error("AuthContext 初始化錯誤:", error);
      } finally {
        // 關鍵：無論成功或失敗，一定要結束 Loading 狀態
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      // 登出後讓頁面回到根目錄
      window.location.href = '/'; 
    } catch (error) {
      console.error("登出失敗", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);