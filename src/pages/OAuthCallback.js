// src/pages/OAuthCallback.js
import React, { useEffect, useRef } from 'react'; // [!!!] useRef 임포트
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Page.css'; 

function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth(); // (이제 이 함수는 useCallback으로 고정됨)
  
  // [!!!] useEffect가 여러 번 실행되는 것을 방지하는 안전장치
  const hasRunRef = useRef(false);

  useEffect(() => {
    // [!!!] 이미 실행됐거나, URL에 토큰이 없으면 즉시 중단
    if (hasRunRef.current || !searchParams.get('accessToken')) {
      return; 
    }
    // [!!!] 실행 플래그를 true로 설정
    hasRunRef.current = true;

    const accessToken = searchParams.get('accessToken');
    const userId = searchParams.get('userId');

    if (accessToken && userId) {
      const refreshToken = searchParams.get('refreshToken');
      const name = searchParams.get('name');
      const profileComplete = searchParams.get('profileComplete') === 'true';

      const authData = {
        user: {
          userId: userId,
          name: name,
          profileComplete: profileComplete
        },
        tokens: {
          accessToken: accessToken,
          refreshToken: refreshToken
        }
      };
      
      login(authData);

      if (!profileComplete) {
        navigate('/profile-setup', { replace: true });
      } else {
        navigate('/recommend', { replace: true });
      }
      
  } else {
      // (토큰 수신 오류)
      alert('로그인에 실패했습니다. (토큰 수신 오류)');
      navigate('/login', { replace: true });
  }

  }, [searchParams, navigate, login]); // 종속성은 그대로 둠

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