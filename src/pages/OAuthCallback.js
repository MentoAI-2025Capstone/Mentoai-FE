// src/pages/OAuthCallback.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Page.css'; // 로딩 스피너 등을 위한 CSS

function OAuthCallback() {
  const navigate = useNavigate();
  const auth = useAuth();

  useEffect(() => {
    try {
      // 1. [수정] URL의 # 뒤에 붙은 문자열(hash)을 파싱합니다.
      // 예: #accessToken=...&refreshToken=...
      const hash = window.location.hash.substring(1); // 맨 앞의 # 제거
      const params = new URLSearchParams(hash);

      // 2. 백엔드가 URL 해시에 넘겨준 정보들을 추출합니다.
      const accessToken = params.get('accessToken');
      const refreshToken = params.get('refreshToken');
      const expiresIn = params.get('expiresIn'); // 만료 시간 (초)
      
      // (백엔드가 유저 정보도 함께 주는지 확인 필요, 없다면 /auth/me 호출)
      // (임시) 스키마를 보니 유저 정보는 안주는 것 같으므로, 우선 토큰만 저장합니다.
      
      if (accessToken && refreshToken) {
        
        // 3. AuthContext에 저장할 토큰 객체 생성
        const tokenData = {
          accessToken: accessToken,
          refreshToken: refreshToken,
          // 만료 시간을 '절대 시간(Timestamp)'으로 변환하여 저장
          expiresAt: new Date().getTime() + parseInt(expiresIn) * 1000
        };

        // 4. AuthContext의 login 함수를 호출해 상태 및 세션 스토리지에 저장
        //    이후 AuthContext가 /auth/me를 호출하여 유저 정보를 가져올 것입니다.
        auth.login(tokenData);

        // 5. 사용자를 메인 페이지로 이동 (이후 AuthContext가 profileComplete 검사)
        navigate('/prompt', { replace: true });
        
      } else {
        throw new Error('URL에서 토큰을 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error("로그인 콜백 처리 실패:", error);
      alert('로그인에 실패했습니다. (토큰 수신 오류)');
      navigate('/login', { replace: true });
    }

  }, [navigate, auth]);

  // 이 페이지는 사용자에게 잠깐 보입니다.
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-logo">멘토아이</h1>
        <div className="loading-container" style={{ padding: '40px 0' }}>
          <div className="spinner"></div>
          <p>로그인 정보를 처리 중입니다. 잠시만 기다려주세요...</p>
        </div>
      </div>
    </div>
  );
}

export default OAuthCallback;