// src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { checkCurrentUser, saveUserProfile, logoutUser } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // [수정] login 함수: 토큰을 받아 저장하고 유저 정보를 불러옴
  const login = async (tokenData) => {
    // 1. 토큰(accessToken, refreshToken, expiresAt)을 sessionStorage에 저장
    const partialData = {
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      expiresAt: tokenData.expiresAt
    };
    sessionStorage.setItem('mentoUser', JSON.stringify(partialData));

    try {
      // 2. /auth/me API를 호출하여 이 토큰에 해당하는 '유저 정보'를 가져옴
      const response = await checkCurrentUser();
      
      if (response.success) {
        // 3. 유저 정보와 토큰 정보를 합쳐서 최종 상태로 저장
        const finalUserData = {
          ...partialData, // 토큰
          ...response.data // 유저 정보 (profileComplete 포함)
        };
        setUser(finalUserData);
        sessionStorage.setItem('mentoUser', JSON.stringify(finalUserData));
      } else {
        throw new Error("/auth/me 호출 실패");
      }
    } catch (error) {
      console.error("로그인 후 유저 정보 가져오기 실패:", error);
      sessionStorage.removeItem('mentoUser');
    }
  };

  // [수정] 앱 로드 시, sessionStorage에 저장된 토큰으로 /auth/me 호출
  useEffect(() => {
    const verifyUser = async () => {
      const storedUserJSON = sessionStorage.getItem('mentoUser');
      
      if (storedUserJSON) {
        try {
          const storedUser = JSON.parse(storedUserJSON);
          
          // (선택적) 토큰 만료 시간 미리 체크
          if (storedUser.expiresAt && new Date().getTime() > storedUser.expiresAt) {
            // 액세스 토큰이 만료되었으므로, apiClient가 자동으로 재발급 시도
            console.log("액세스 토큰 만료됨. /auth/me 호출로 재발급 시도.");
          }

          // /auth/me API 호출 (apiClient가 헤더에 토큰을 넣어줌)
          const response = await checkCurrentUser();
          
          if (response.success) {
            // /auth/me로 받은 최신 유저 정보와 기존 토큰 정보를 합쳐서 상태 업데이트
            const finalUserData = {
              ...storedUser, // 기존 토큰
              ...response.data // 최신 유저 정보
            };
            setUser(finalUserData);
            sessionStorage.setItem('mentoUser', JSON.stringify(finalUserData));
          } else {
            // /auth/me 실패 (토큰 무효)
            setUser(null);
            sessionStorage.removeItem('mentoUser');
          }
        } catch (error) {
          // checkCurrentUser 실패 (리프레시 토큰도 만료)
          setUser(null);
          sessionStorage.removeItem('mentoUser');
        }
      }
      setLoading(false); // 로딩 완료
    };
    
    verifyUser();
  }, []);
  
  // 프로필 설정 완료 함수
  const completeProfile = async (profileData) => {
    try {
      const response = await saveUserProfile(profileData); 
      if (response.success) {
        const updatedUser = {
          ...user,
          ...response.data, // 백엔드로부터 받은 프로필 정보로 업데이트
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
  const logout = async () => {
    try {
      await logoutUser(); // 백엔드 /auth/logout 호출
    } catch (error) {
      console.error("백엔드 로그아웃 실패:", error);
    } finally {
      setUser(null);
      sessionStorage.removeItem('mentoUser');
    }
  };

  if (loading) {
    return <div>Loading...</div>; // 앱 로딩 중 (사용자 인증 확인 중)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, completeProfile, profileComplete: user?.profileComplete }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};