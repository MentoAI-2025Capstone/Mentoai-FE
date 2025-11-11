// src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
// [수정] 모든 API 임포트 주석 처리 (CORS 임시 우회)
// import { checkCurrentUser, saveUserProfile, logoutUser, refreshAccessToken } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // [수정] API 호출 안 하므로 즉시 로딩 완료

  // [수정] useEffect에서 API 호출 로직('verifyUser') 제거
  useEffect(() => {
    try {
      // (임시) sessionStorage에 가짜 유저가 있는지 확인
      const storedUser = sessionStorage.getItem('mentoUser');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("sessionStorage 파싱 오류:", e);
      sessionStorage.removeItem('mentoUser');
    }
    setLoading(false); // API 호출 안 하므로 즉시 로딩 완료
  }, []);

  
  // [수정] login 함수: API 호출('checkCurrentUser') 제거
  const login = (userData) => {
    // 1. (임시) API 호출 없이, 전달받은 데이터를 상태와 세션에 즉시 저장
    setUser(userData);
    sessionStorage.setItem('mentoUser', JSON.stringify(userData));
    console.log("AuthContext: 가짜 유저 로그인 처리 완료", userData);
  };
  
  // [수정] completeProfile: API 호출 주석 처리
  const completeProfile = async (profileData) => {
    console.log("AuthContext: 프로필 저장 (API 호출 건너뜀)", profileData);
    
    // (임시) API 호출 주석 처리
    // const response = await saveUserProfile(profileData);
    
    // (임시) 프론트엔드에서만 상태 업데이트
    const updatedUser = {
      ...user,
      ...profileData, // profileData로 덮어쓰기
      profileComplete: true 
    };
    setUser(updatedUser);
    sessionStorage.setItem('mentoUser', JSON.stringify(updatedUser));
  };

  // [수정] logout 함수: API 호출 주석 처리
  const logout = async () => {
    console.log("AuthContext: 로그아웃 (API 호출 건너뜀)");
    
    // (임시) API 호출 주석 처리
    // await logoutUser(); 
    
    setUser(null);
    sessionStorage.removeItem('mentoUser');
  };

  if (loading) {
    return <div>Loading...</div>; // (거의 보이지 않음)
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