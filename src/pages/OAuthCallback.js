import React, { useEffect, useState } from 'react'; // [!!!] useState 임포트
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Page.css'; 

function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // [!!!] AuthContext.js의 useCallback 수정안과
  //       함께 작동하는 '잠금 장치'입니다.
  const { login } = useAuth();
  const [hasRun, setHasRun] = useState(false);

  useEffect(() => {
    
    // (레이스 컨디션 방지)
    if (searchParams.toString() === '') {
      return; 
    }
    
    // [!!!] 이미 한 번이라도 이 로직을 실행했다면,
    //       (login 함수가 user 상태를 바꿔서 리렌더링이 되어도)
    //       절대 다시 실행하지 않습니다.
    if (hasRun) {
      return;
    }

  	const accessToken = searchParams.get('accessToken');
  	const userId = searchParams.get('userId');

  	if (accessToken && userId) {
      // [!!!] "잠금"
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
      
      // 상태 업데이트와 페이지 이동을 순차적으로 실행
    	login(userData);

    	if (!profileComplete) {
      	navigate('/profile-setup', { replace: true });
    	} else {
      	navigate('/prompt', { replace: true });
    	}
      
  } else {
      // (백엔드가 userId나 accessToken을 주지 않은 경우)
      // [!!!] "잠금"
      setHasRun(true); 

      if (accessToken && !userId) {
        alert('[프론트엔드 감지] 백엔드가 accessToken은 보냈으나, userId를 누락했습니다.');
      } else if (!accessToken) {
        alert('로그인에 실패했습니다. (토큰 수신 오류)');
      }
      navigate('/login', { replace: true });
  }

  // [!!!] 의존성 배열에 'hasRun'을 추가하여 잠금 장치가 작동하도록 합니다.
  }, [searchParams.toString(), navigate, login, hasRun]); 

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