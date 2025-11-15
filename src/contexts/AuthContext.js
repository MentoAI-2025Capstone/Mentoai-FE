// src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
// [!!!] Google userinfo API 호출을 위해 axios 임포트
import axios from 'axios';
import { 
  // [!!!] A안(클라이언트 흐름)을 위해 loginWithGoogle 임포트
  loginWithGoogle,
  checkCurrentUser, 
  saveUserProfile, 
  logoutUser, 
  getUserProfile 
} from '../api/api'; 

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // [!!!] A안(클라이언트 흐름)을 위한 'login' 함수
  const login = async (googleTokenResponse) => {
    try {
      // 1. Google access_token으로 Google userinfo API 호출
      const googleUser = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${googleTokenResponse.access_token}` }
      });

      const { sub, email, name, picture } = googleUser.data;

      // 2. MentoAI 백엔드 (POST /users) API 호출
      const response = await loginWithGoogle({ 
        providerUserId: sub, // 'sub'이 Google의 고유 ID
        email: email,
        name: name,
        profileImageUrl: picture
      }); 
      
      if (response.success) {
        // 3. API가 반환한 AuthResponse (user + tokens)를 저장
        // (이 response.data에 { user, tokens } 객체가 모두 들어있어야 함)
        sessionStorage.setItem('mentoUser', JSON.stringify(response.data));
        setUser(response.data);
      } else {
        throw new Error(response.data?.message || "loginWithGoogle API failed");
      }
    } catch (error) {
      console.error("AuthContext login (A안) 실패:", error);
      sessionStorage.removeItem('mentoUser');
      throw error; // Auth.js가 catch할 수 있도록 에러 다시 던지기
    }
  };

  // [!!!] verifyUser (페이지 새로고침 시) 로직 - GET /auth/me 사용
  useEffect(() => {
    const verifyUser = async () => {
      const storedUserJSON = sessionStorage.getItem('mentoUser');
      if (storedUserJSON) {
        try {
          const response = await checkCurrentUser(); // GET /auth/me 호출
          if (response.success) {
            const basicUser = response.data; 
            const storedUser = JSON.parse(storedUserJSON); 
            const finalUserData = { user: basicUser, tokens: storedUser.tokens };
            setUser(finalUserData);
            sessionStorage.setItem('mentoUser', JSON.stringify(finalUserData));
          } else { throw new Error("Invalid token"); }
        } catch (error) {
          console.warn("verifyUser 실패:", error.message);
          setUser(null);
          sessionStorage.removeItem('mentoUser');
        }
      }
      setLoading(false); 
    };
    verifyUser();
  }, []); 
  
  // (completeProfile, logout 함수는 useCallback으로 감싼 채 유지)
  const completeProfile = useCallback(async (profileData) => {
    try {
      const response = await saveUserProfile(profileData); 
      if (response.success) {
        const updatedUser = {
          ...user,
          user: { ...user.user, profileComplete: true }
        };
        setUser(updatedUser);
        sessionStorage.setItem('mentoUser', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error("프로필 저장 실패:", error);
      alert("프로필 저장에 실패했습니다.");
    }
  }, [user]); 

  const logout = useCallback(async () => {
    try {
      await logoutUser(); 
    } catch (error) {
      console.error("백엔드 로그아웃 실패:", error);
    } finally {
      setUser(null);
      sessionStorage.removeItem('mentoUser');
    }
  }, []); 

  if (loading) { return <div>Loading...</div>; }

  return (
    <AuthContext.Provider value={{ user, login, logout, completeProfile, profileComplete: user?.user?.profileComplete }}>
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => { return useContext(AuthContext); };