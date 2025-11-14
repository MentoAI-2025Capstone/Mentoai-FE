import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Page.css'; // 로딩 스피너 등을 위한 CSS

function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const auth = useAuth();

  // [!!! 핵심 수정 !!!]
  // useEffect의 의존성 배열(dependency array)을
  // [searchParams] -> [searchParams.toString(), navigate, auth]로 변경합니다.
  // 이렇게 하면 searchParams의 '내용'이 바뀔 때마다 useEffect가 다시 실행됩니다.
  useEffect(() => {
    
    // 1. 쿼리 파라미터가 비어있으면(아직 로딩 중이면) 아무것도 안 함
    if (searchParams.toString() === '') {
      return; 
    }

    // 2. (이제 searchParams가 준비됨) 토큰을 추출합니다.
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const userId = searchParams.get('userId'); // [!] userId 검사 복구
    const name = searchParams.get('name');
    const isNewUser = searchParams.get('isNewUser') === 'true'; 
    const profileComplete = searchParams.get('profileComplete') === 'true';

    // [!!! 핵심 수정 !!!]
    // 3. accessToken과 userId를 *모두* 검사합니다.
    //    (이제 useEffect가 2번 실행되어, 2번째 실행에서 accessToken을 찾을 것입니다.)
    if (accessToken && userId) {
      
      // 4. AuthContext에 저장할 사용자 객체 생성
      const userData = {
        userId: userId,
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
      
    } else if (searchParams.toString() !== '') {
      // 7. URL 파싱이 끝났는데도(toString()이 비어있지 않은데도)
      //    accessToken이나 userId가 없으면,
      //    이것이 '진짜' 백엔드 오류입니다 (예: userId 누락).
      alert(`로그인에 실패했습니다. (토큰/ID 수신 오류) \nAccess Token: ${!!accessToken} \nUser ID: ${!!userId}`);
      navigate('/login', { replace: true });
    }

  // [!!! 핵심 수정 !!!]
  }, [searchParams.toString(), navigate, auth]); 

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