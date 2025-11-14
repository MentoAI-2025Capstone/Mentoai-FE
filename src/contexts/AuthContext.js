import React, { createContext, useState, useContext, useEffect } from 'react';
// 임포트 경로 변경 및 refreshAccessToken 임포트
import { checkCurrentUser, saveUserProfile, logoutUser, refreshAccessToken } from '../api/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // [!!! 핵심 수정 !!!]
  // login 함수가 OAuthCallback.js에서 전달받은 userData를
  // 그대로 상태(state)와 세션 스토리지에 저장하도록 수정합니다.
  // 불필요한 /auth/me API 호출을 제거합니다.
  const login = (userData) => {
    // userData 객체 예: 
    // { userId, name, isNewUser, profileComplete, accessToken, refreshToken }

    // [중요]
    // OAuthCallback.js에서 'expiresIn' (예: "3600") 값을 받아서
    // 'expiresAt' (미래의 타임스탬프)으로 변환해서 userData에 포함시켜야 합니다.
    // 예: const expiresAt = new Date().getTime() + (parseInt(searchParams.get('expiresIn') || '3600') * 1000);
    // userData.expiresAt = expiresAt;

    // 임시 처리: OAuthCallback.js에서 expiresAt을 계산해서 넘기지 않았다면,
    // 여기서 임시로 1시간(3600초)을 설정합니다.
    // (이 부분은 OAuthCallback.js에서 처리하는 것이 더 정확합니다.)
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
  };

  // [수정 없음]
  // 앱 로드 시, sessionStorage에 저장된 토큰으로 사용자 정보 검증
  // 이 로직은 이제 api.js의 수정된 checkCurrentUser (GET /users/{userId})를
  // 올바르게 호출하므로 정상 작동합니다.
  useEffect(() => {
    const verifyUser = async () => {
      const storedUserJSON = sessionStorage.getItem('mentoUser');
      let finalTokenData = null; 
      
      if (storedUserJSON) {
        try {
          const storedUser = JSON.parse(storedUserJSON);
          
          if (storedUser.expiresAt && new Date().getTime() > storedUser.expiresAt) {
            console.log("액세스 토큰 만료. 갱신 시도...");
            const refreshResponse = await refreshAccessToken(); 
            
            if (refreshResponse.success) {
              const { accessToken, refreshToken, expiresIn } = refreshResponse.data;
              finalTokenData = {
                ...storedUser,
                accessToken: accessToken,
                refreshToken: refreshToken, 
                expiresAt: new Date().getTime() + parseInt(expiresIn) * 1000
              };
              sessionStorage.setItem('mentoUser', JSON.stringify(finalTokenData));
            } else {
              throw new Error("Token refresh failed");
            }
          } else {
            finalTokenData = storedUser;
          }

          // [수정됨] 
          // api.js가 수정되었으므로, 이 함수는 이제 올바른
          // GET /users/{userId}를 호출하여 최신 사용자 정보를 가져옵니다.
          const response = await checkCurrentUser();
          
          if (response.success) {
            const finalUserData = {
              ...finalTokenData, // 스토리지의 토큰/기본 정보
              ...response.data  // /users/{userId}에서 받은 최신 정보
            };
            setUser(finalUserData);
            sessionStorage.setItem('mentoUser', JSON.stringify(finalUserData));
          } else {
            throw new Error("Invalid token");
          }
        } catch (error) {
          console.warn("verifyUser 실패:", error.message);
          setUser(null);
          sessionStorage.removeItem('mentoUser');
        }
      }
      setLoading(false); // 로딩 완료
    };
    
    verifyUser();
  }, []);
  
  // [수정] completeProfile: API 호출 (saveUserProfile)
  const completeProfile = async (profileData) => {
    try {
      // profileData는 이미 ProfileSetup에서 API 스키마에 맞게 포맷팅됨
      const response = await saveUserProfile(profileData); 
      if (response.success) {
        // API가 반환한 최신 유저 프로필(response.data)로 user 상태 업데이트
        const updatedUser = {
          ...user,
          ...response.data, // (백엔드가 UserProfile 스키마 반환)
          profileComplete: true 
        };
        setUser(updatedUser);
        sessionStorage.setItem('mentoUser', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error("프로필 저장 실패:", error);
      alert("프로필 저장에 실패했습니다."); // 사용자에게 피드백
    }
  };

  // 로그아웃 함수
  const logout = async () => {
    try {
      await logoutUser(); 
    } catch (error) {
      console.error("백엔드 로그아웃 실패:", error);
    } finally {
      setUser(null);
      sessionStorage.removeItem('mentoUser');
    }
  };

  if (loading) {
    return <div>Loading...</div>; 
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