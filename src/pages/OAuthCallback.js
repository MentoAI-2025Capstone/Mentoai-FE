import React, { useEffect } from 'react'; // [!!!] useState는 이제 필요 없습니다.
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Page.css'; 

function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // [!!! 핵심 수정 !!!]
  // user 객체는 필요 없고, '고정된' login 함수만 가져옵니다.
  const { login } = useAuth();

  useEffect(() => {
    
    // (레이스 컨디션 방지)
    if (searchParams.toString() === '') {
      return; 
    }

    // [!!! 핵심 수정 !!!]
    // 'hasRun' 잠금 장치가 모두 제거되었습니다.
    // 이 useEffect는 searchParams.toString()이 변할 때 딱 한 번 실행됩니다.
    // (login 함수는 이제 '고정'되어 의존성 배열에 영향을 주지 않습니다.)

    const accessToken = searchParams.get('accessToken');
    const userId = searchParams.get('userId');

    if (accessToken && userId) {
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
      
      // login 함수와 navigate 함수가 순서대로 실행됩니다.
      login(userData);

      if (!profileComplete) {
        navigate('/profile-setup', { replace: true });
      } else {
        navigate('/prompt', { replace: true });
      }
      
  } else {
      // (백엔드가 userId나 accessToken을 주지 않은 경우)
      if (accessToken && !userId) {
        alert('[프론트엔드 감지] 백엔드가 accessToken은 보냈으나, userId를 누락했습니다.');
      } else if (!accessToken) {
        alert('로그인에 실패했습니다. (토큰 수신 오류)');
      }
      navigate('/login', { replace: true });
  }

// [!!! 핵심 수정 !!!]
// 의존성 배열이 훨씬 단순해졌습니다.
  }, [searchParams.toString(), navigate, login]); 

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