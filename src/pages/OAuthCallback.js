import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Page.css'; // 로딩 스피너 등을 위한 CSS

function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const auth = useAuth();

  useEffect(() => {
    // [!!! 여기가 핵심 수정 !!!]
    // 1. 쿼리 파라미터가 비어있는지 확인합니다.
    // 렌더링 초기에 searchParams가 비어있으면(toString() === ''),
    // 아직 URL을 파싱 중이라는 뜻이므로,
    // 아무것도 하지 않고 다음 렌더링을 기다립니다.
    if (searchParams.toString() === '') {
      return; 
    }

    // 2. (이제 searchParams가 준비됨) 토큰을 추출합니다.
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const userId = searchParams.get('userId'); // (테스트를 위해 null인 상태로 둠)
    const name = searchParams.get('name');
    const isNewUser = searchParams.get('isNewUser') === 'true'; 
    const profileComplete = searchParams.get('profileComplete') === 'true';

    // 3. (테스트) accessToken만 검사
    // (URL 파싱이 끝난 후에 실행되므로, 이제 정상적으로 accessToken을 찾아야 함)
    if (accessToken) {
      
      // 4. AuthContext에 저장할 사용자 객체 생성
      const userData = {
        userId: userId, // (null이 저장됨)
        name: name,
        isNewUser: isNewUser,
        profileComplete: profileComplete,
        accessToken: accessToken,
        refreshToken: refreshToken
      };

      // 5. AuthContext의 login 함수를 호출
      auth.login(userData);

      // 6. 사용자를 적절한 페이지로 이동
      if (!profileComplete) {
        navigate('/profile-setup', { replace: true });
      } else {
        navigate('/prompt', { replace: true });
      }
      
    } else {
      // 7. URL 파싱이 끝났는데도 accessToken이 없으면,
      //    이것이 '진짜' 백엔드 오류입니다.
      alert('로그인에 실패했습니다. (토큰 수신 오류)');
      navigate('/login', { replace: true });
    }

  }, [searchParams, navigate, auth]); // 의존성 배열은 그대로 둡니다.

  // (이하 return 문은 동일)
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