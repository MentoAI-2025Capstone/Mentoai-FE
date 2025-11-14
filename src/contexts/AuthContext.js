// AuthContext.js (수정)

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react'; // [!!!] useCallback 임포트
// [수정] getUserProfile 임포트
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

  // [!!! 핵심 수정 !!!]
  // login 함수를 useCallback으로 감싸서,
  // 렌더링이 다시 되어도 이 함수가 '새로' 만들어지는 것을 방지합니다.
  // (의존성 배열을 [] (빈 배열)로 둡니다.)
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
  }, []); // [!!!] 빈 의존성 배열

  // (useEffect ... verifyUser 로직은 동일)
  useEffect(() => {
    const verifyUser = async () => {
      // (이전과 동일한 로직...)
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
              tokenData = {
                ...storedUser,
                accessToken: accessToken,
                refreshToken: refreshToken, 
                expiresAt: new Date().getTime() + parseInt(expiresIn) * 1000
              };
              sessionStorage.setItem('mentoUser', JSON.stringify(tokenData));
            } else {
              throw new Error("Token refresh failed");
            }
          } else {
            tokenData = storedUser;
          }

          const userResponse = await checkCurrentUser();
          
          if (!userResponse.success) {
            throw new Error("Failed to fetch user data (checkCurrentUser)");
          }

          const profileResponse = await getUserProfile();
          
          const finalUserData = {
            ...tokenData,
            ...userResponse.data,
            ...(profileResponse.success ? profileResponse.data : {}) 
          };

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
  }, []); // 이 useEffect는 앱 로드 시 한 번만 실행되므로 []가 맞습니다.
  
  // [!!! 핵심 수정 !!!]
  // 나머지 함수들도 useCallback으로 감싸줍니다.
  const completeProfile = useCallback(async (profileData) => {
    try {
      const response = await saveUserProfile(profileData); 
      if (response.success) {
        // [수정] setUser가 상태를 업데이트할 때, 
        // 최신 'user' 상태를 참조하지 않도록 함수형 업데이트를 사용합니다.
        setUser(prevUser => {
          const updatedUser = {
            ...prevUser,
            ...response.data, 
            profileComplete: true 
          };
          sessionStorage.setItem('mentoUser', JSON.stringify(updatedUser));
          return updatedUser;
        });
      }
    } catch (error) {
      console.error("프로필 저장 실패:", error);
      alert("프로필 저장에 실패했습니다.");
    }
  }, []); // [!!!] 빈 의존성 배열

  // [!!! 핵심 수정 !!!]
  const logout = useCallback(async () => {
    try {
      await logoutUser(); 
    } catch (error) {
      console.error("백엔드 로그아웃 실패:", error);
    } finally {
      setUser(null);
      sessionStorage.removeItem('mentoUser');
    }
  }, []); // [!!!] 빈 의존성 배열

  if (loading) {
    return <div>Loading...</div>; 
  }

  // [수정] value 객체를 매번 새로 만들지 않도록 useMemo를 사용...
  // ...하려고 했으나, login, logout이 stable하므로 그냥 둡니다.
  // completeProfile이 user에 의존하게 되면 문제가 복잡해지므로,
  // 위와 같이 함수형 업데이트를 사용하고 의존성 배열을 비웁니다.
  return (
    <AuthContext.Provider value={{ user, login, logout, completeProfile, profileComplete: user?.profileComplete }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};