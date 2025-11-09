import React, { createContext, useState, useContext, useEffect } from 'react';
import { loginWithGoogle, saveUserProfile } from '../api/authApi';

// AuthContext 생성
const AuthContext = createContext(null);

// AuthProvider 컴포넌트
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // 로딩 상태 추가

  // 컴포넌트 마운트 시 세션 스토리지에서 사용자 정보 복원
  useEffect(() => {
    try {
      const storedUser = sessionStorage.getItem('mentoUser');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("세션 스토리지 파싱 오류:", error);
      sessionStorage.removeItem('mentoUser');
    }
    setLoading(false); // 로딩 완료
  }, []);

  // 로그인 함수
  const login = async (credential) => {
    try {
      const response = await loginWithGoogle(credential); // 가짜 API 호출
      if (response.success) {
        const userData = {
          ...response.data,
          profileComplete: !response.data.isNewUser // 새 유저면 false
        };
        setUser(userData);
        sessionStorage.setItem('mentoUser', JSON.stringify(userData));
        return userData;
      }
    } catch (error) {
      console.error("로그인 실패:", error);
    }
    return null;
  };

  // 프로필 설정 완료 함수
  const completeProfile = async (profileData) => {
    // profileData는 ProfileSetup.js에서 전달받은 상세 정보
    try {
      const response = await saveUserProfile(profileData); // 가짜 API 호출
      if (response.success) {
        const updatedUser = {
          ...user,
          ...response.data, // 백엔드로부터 받은 프로필 정보로 업데이트 (선택적)
          profileComplete: true // 프로필 설정 완료
        };
        setUser(updatedUser);
        sessionStorage.setItem('mentoUser', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error("프로필 저장 실패:", error);
    }
  };

  // 로그아웃 함수
  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('mentoUser');
  };

  if (loading) {
    return <div>Loading...</div>; // 로딩 중 UI (간단하게)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, completeProfile, profileComplete: user?.profileComplete }}>
      {children}
    </AuthContext.Provider>
  );
};

// useAuth 커스텀 훅
export const useAuth = () => {
  return useContext(AuthContext);
};