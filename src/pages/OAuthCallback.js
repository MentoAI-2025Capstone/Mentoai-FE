import React, { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Page.css'; 
import { checkCurrentUser } from '../api/api'; 

function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth(); 
  const hasRunRef = useRef(false); 

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');

    // 1. 토큰이 없거나 이미 로직이 실행됐으면 중단
    if (!accessToken || hasRunRef.current) {
      return; 
    }
    
    // 2. 로직 실행 (플래그 설정)
    hasRunRef.current = true;
    const refreshToken = searchParams.get('refreshToken');

    const handleLoginCallback = async () => {
      const tokenData = {
        accessToken: accessToken,
        refreshToken: refreshToken
      };

      // 3. apiClient가 토큰을 인식하도록 임시 저장
      sessionStorage.setItem('mentoUser', JSON.stringify({ user: null, tokens: tokenData }));

      try {
        // 4. [!!!] 지금 이 API 호출이 CORS 때문에 멈춰있습니다.
        const response = await checkCurrentUser(); 

        if (!response.success) {
          throw new Error(response.data?.message || "checkCurrentUser API 실패");
        }
        
        const user = response.data; 

        // 5. 완전한 authData 객체를 만들어 login() 호출
        const authData = { user: user, tokens: tokenData };
        login(authData); // (App.js의 PublicRoute가 리디렉션함)
      
      } catch (error) {
        console.error("OAuthCallback 처리 중 에러:", error);
        alert(`로그인 처리에 실패했습니다: ${error.message}`);
        sessionStorage.removeItem('mentoUser'); 
        navigate('/login', { replace: true });
      }
    };

    handleLoginCallback();
    
  }, [searchParams, navigate, login]); 

  // 로딩 스피너
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-logo">MentoAI</h1>
        <div className="loading-container" style={{ padding: '40px 0' }}>
          <div className="spinner"></div>
          <p>로그인 정보를 처리 중입니다. 잠시만 기다려주세요...</p>
        </div>
      </div>
    </div>
  );
}

export default OAuthCallback;