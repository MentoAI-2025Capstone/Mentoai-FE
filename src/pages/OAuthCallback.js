import React, { useEffect, useState } from 'react'; // [수정] useState 임포트
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Page.css'; 

function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const auth = useAuth();
  
  // [!!! 핵심 수정 !!!]
  // 무한 루프를 방지하기 위한 '잠금 장치(guard)' state
  const [hasRun, setHasRun] = useState(false);

  useEffect(() => {
    
    // (레이스 컨디션 방지)
    if (searchParams.toString() === '') {
      return; 
    }
    
    // [!!! 핵심 수정 !!!]
    // 이미 한 번이라도 이 로직을 실행했다면,
    // auth 객체가 바뀌어도 다시 실행하지 않고 즉시 중단
    if (hasRun) {
      return;
    }

    const accessToken = searchParams.get('accessToken');
    const userId = searchParams.get('userId');

    if (accessToken && userId) {
      // [!!! 핵심 수정 !!!]
      // 로직을 실행했음을 '잠금'
      setHasRun(true); 

      const refreshToken = searchParams.get('refreshToken');
      const name = searchParams.get('name');
      const isNewUser = searchParams.get('isNewUser') === 'true'; 
      const profileComplete = searchParams.get('profileComplete') === 'true';

      const userData = {
        userId: userId,
        name: name,
        isNewUser: isNewUser,
        profileComplete: profileComplete,
        accessToken: accessToken,
        refreshToken: refreshToken
      };
      
      auth.login(userData);

      if (!profileComplete) {
        navigate('/profile-setup', { replace: true });
      } else {
        navigate('/prompt', { replace: true });
      }
      
  } else {
      // (백엔드가 userId나 accessToken을 주지 않은 경우)

      // [!!! 핵심 수정 !!!]
      // 로직을 실행했음을 '잠금'
      setHasRun(true); 

      if (accessToken && !userId) {
        alert('[프론트엔드 감지] 백엔드가 accessToken은 보냈으나, userId를 누락했습니다.');
      } else if (!accessToken) {
        alert('로그인에 실패했습니다. (토큰 수신 오류)');
      }
      navigate('/login', { replace: true });
  }

  }, [searchParams.toString(), navigate, auth, hasRun]); // [수정] hasRun 의존성 추가

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