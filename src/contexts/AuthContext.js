import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { 
  checkCurrentUser, 
  saveUserProfile, 
  logoutUser, 
  refreshAccessToken, 
  getUserProfile 
} from '../api/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = useCallback((userData) => {
    if (!userData.expiresAt) {
      console.warn("expiresAt이 userData에 없습니다. 임시로 1시간을 설정합니다.");
      userData.expiresAt = new Date().getTime() + 3600 * 1000;
    }
    try {
      setUser(userData);
      sessionStorage.setItem('mentoUser', JSON.stringify(userData));
    } catch (error) {
      console.error("로그인 데이터 저장 실패:", error);
      sessionStorage.removeItem('mentoUser');
    }
  }, []); // 빈 의존성 배열 (고정)

  useEffect(() => {
    const verifyUser = async () => {
      const storedUserJSON = sessionStorage.getItem('mentoUser');
      let tokenData = null; 
      if (storedUserJSON) {
        try {
          const storedUser = JSON.parse(storedUserJSON);
          if (storedUser.expiresAt && new Date().getTime() > storedUser.expiresAt) {
            console.log("액세스 토큰 만료. 갱신 시도...");
            const refreshResponse = await refreshAccessToken(); 
            if (refreshResponse.success) {
              const { accessToken, refreshToken, expiresIn } = refreshResponse.data;
              tokenData = { ...storedUser, accessToken, refreshToken, expiresAt: new Date().getTime() + parseInt(expiresIn) * 1000 };
              sessionStorage.setItem('mentoUser', JSON.stringify(tokenData));
            } else { throw new Error("Token refresh failed"); }
          } else { tokenData = storedUser; }

          const userResponse = await checkCurrentUser();
          if (!userResponse.success) { throw new Error("Failed to fetch user data (checkCurrentUser)"); }

          const profileResponse = await getUserProfile();
          const finalUserData = { ...tokenData, ...userResponse.data, ...(profileResponse.success ? profileResponse.data : {}) };
          setUser(finalUserData);
          sessionStorage.setItem('mentoUser', JSON.stringify(finalUserData));
        } catch (error) {
          console.warn("verifyUser 실패:", error.message);
          setUser(null);
          sessionStorage.removeItem('mentoUser');
        }
      }
      setLoading(false);
    };
    verifyUser();
  }, []); // 앱 로드 시 한 번만 실행 (고정)
  
  const completeProfile = useCallback(async (profileData) => {
    try {
      const response = await saveUserProfile(profileData); 
      if (response.success) {
        setUser(prevUser => {
          const updatedUser = { ...prevUser, ...response.data, profileComplete: true };
          sessionStorage.setItem('mentoUser', JSON.stringify(updatedUser));
          return updatedUser;
        });
      }
    } catch (error) {
      console.error("프로필 저장 실패:", error);
      alert("프로필 저장에 실패했습니다.");
    }
  }, []); // 빈 의존성 배열 (고정)

  const logout = useCallback(async () => {
    try {
      await logoutUser(); 
    } catch (error) { console.error("백엔드 로그아웃 실패:", error); } 
    finally {
      setUser(null);
      sessionStorage.removeItem('mentoUser');
    }
  }, []); // 빈 의존성 배열 (고정)

  // [!!! 핵심 수정 !!!]
  // 'if (loading)' 블록보다 *먼저* useMemo를 호출합니다.
  // React Hook은 컴포넌트 최상단에서, 조건문/return보다 먼저 호출되어야 합니다.
  const value = useMemo(() => ({
    user,
    login,
    logout,
    completeProfile,
    profileComplete: user?.profileComplete
  }), [user, login, logout, completeProfile]);

  // [!!!] useMemo를 호출한 *뒤에* early return을 합니다.
  if (loading) {
    return <div>Loading...</div>; 
  }

  return (
    <AuthContext.Provider value={value}> 
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};