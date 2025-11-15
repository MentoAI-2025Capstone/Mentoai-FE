// src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios'; // Google userinfo API 호출용
import { 
  loginWithGoogle,
  checkCurrentUser, 
  saveUserProfile, 
  logoutUser 
} from '../api/api'; 

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // [A안] Auth.js가 호출하는 로그인 함수
  const login = async (googleTokenResponse) => {
    try {
      // 1. Google access_token으로 Google userinfo API 호출
      const googleUser = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${googleTokenResponse.access_token}` }
      });

      const { sub, email, name, picture } = googleUser.data;

      // 2. MentoAI 백엔드 (POST /users) API 호출
      const response = await loginWithGoogle({ 
        providerUserId: sub,
        email: email,
        name: name,
        profileImageUrl: picture
      }); 
      
      if (response.success) {
        // 3. { user, tokens } 객체를 state와 sessionStorage에 저장
        sessionStorage.setItem('mentoUser', JSON.stringify(response.data));
        setUser(response.data);
      } else {
        // api.js가 throw한 에러를 다시 throw
        throw new Error(response.data?.message || "loginWithGoogle API failed");
      }
    } catch (error) {
      console.error("AuthContext login (A안) 실패:", error);
      sessionStorage.removeItem('mentoUser');
      throw error; // Auth.js가 catch할 수 있도록 에러 다시 던지기
    }
  };

  // [공통] 페이지 새로고침 시 인증 복원
  useEffect(() => {
    const verifyUser = async () => {
      const storedUserJSON = sessionStorage.getItem('mentoUser');
      if (storedUserJSON) {
        try {
          // GET /auth/me 호출
          const response = await checkCurrentUser();
          if (response.success) {
            const basicUser = response.data; // 최신 user 정보
            const storedUser = JSON.parse(storedUserJSON); // 기존 tokens 정보
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
  }, []); // (빈 배열이 맞습니다. 마운트 시 1회 실행)
  
  // [공통] 프로필 작성 완료
  const completeProfile = useCallback(async (profileData) => {
    try {
      await saveUserProfile(profileData); 
      const updatedUser = {
        ...user,
        user: { ...user.user, profileComplete: true }
      };
      setUser(updatedUser);
      sessionStorage.setItem('mentoUser', JSON.stringify(updatedUser));
    } catch (error) {
      console.error("프로필 저장 실패:", error);
      alert("프로필 저장에 실패했습니다.");
    }
  }, [user]); // 'user'가 변경되면 이 함수도 갱신

  // [공통] 로그아웃
  const logout = useCallback(async () => {
    try {
      await logoutUser(); 
    } catch (error) {
      console.error("백엔드 로그아웃 실패:", error);
    } finally {
      setUser(null);
      sessionStorage.removeItem('mentoUser');
    }
  }, []); // (종속성 없음)

  if (loading) { return <div>Loading...</div>; }

  return (
    <AuthContext.Provider value={{ user, login, logout, completeProfile, profileComplete: user?.user?.profileComplete }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => { return useContext(AuthContext); };