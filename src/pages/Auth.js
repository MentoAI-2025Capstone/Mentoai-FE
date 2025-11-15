// src\pages\Auth.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios'; // axios를 이 파일에서 직접 사용
import './Page.css'; // (기존 CSS 재활용)

// 백엔드 서버 실제 주소
const API_BASE_URL = 'https://mentoai.onrender.com';

/**
 * 백엔드 POST /users API를 직접 호출하는 함수
 */
const loginToBackend = async (googleUserData) => {
  try {
    const payload = {
      authProvider: "GOOGLE",
      providerUserId: googleUserData.providerUserId, // Google 'sub'
      email: googleUserData.email,
      name: googleUserData.name,
      nickname: googleUserData.name, // API 명세 기반 'nickname' 필드 포함
      profileImageUrl: googleUserData.profileImageUrl
    };

    // axios로 백엔드 API 직접 호출
    const response = await axios.post(`${API_BASE_URL}/users`, payload, {
      timeout: 120000 // [!!!] 60초(60000)에서 120초(120000)로 수정
    });
    
    // { user, tokens } 객체 반환
    return { success: true, data: response.data };

  } catch (error) {
    console.error("POST /users 로그인 실패:", error);
    const message = error.response?.data?.message || error.message;
    throw new Error(message);
  }
};

/**
 * Google 로그인 버튼이 있는 메인 페이지
 */
function AuthPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('로그인 중...');

  /**
   * Google 로그인 버튼 클릭 시 실행되는 메인 함수
   */
  const handleGoogleLogin = useGoogleLogin({
    // 1. Google 로그인 팝업 성공 (Token Flow - 기존 방식)
    onSuccess: async (googleTokenResponse) => {
      setIsLoading(true);
      setLoadingMessage('Google 인증 완료. MentoAI 서버에 로그인합니다...');

      const timer = setTimeout(() => {
        setLoadingMessage('서버 응답을 기다리는 중입니다. (최대 2분 소요)');
      }, 8000); // 8초

      try {
        // 2. Google userinfo API 호출
        const googleUser = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${googleTokenResponse.access_token}` }
        });
        
        const { sub, email, name, picture } = googleUser.data;

        // 3. 백엔드 POST /users API 호출
        const response = await loginToBackend({
          providerUserId: sub,
          email: email,
          name: name,
          profileImageUrl: picture
        });
        
        clearTimeout(timer); // 성공 시 타이머 제거

        // 4. 로그인 성공: { user, tokens }를 sessionStorage에 저장
        sessionStorage.setItem('mentoUser', JSON.stringify(response.data));

        // 5. 프로필 작성 여부에 따라 페이지 이동
        const profileComplete = response.data.user.profileComplete;
        const destination = profileComplete ? '/recommend' : '/profile-setup';
        
        // App.js가 라우팅을 갱신하도록 페이지 강제 새로고침
        window.location.href = destination;
        
      } catch (error) {
        // 6. 모든 과정 중 실패 시
        clearTimeout(timer);
        console.error("로그인 처리 중 에러 발생:", error);
        
        const alertMessage = error.message || "알 수 없는 오류";
        
        if (error.code === 'ERR_NETWORK' || alertMessage.includes('Network Error')) {
          alert('로그인에 실패했습니다. (Network Error / CORS 오류). 백엔드 서버가 Vercel 주소를 허용하는지 확인하세요.');
        } else if (error.code === 'ECONNABORTED') {
          alert('로그인에 실패했습니다. (서버 응답 시간 초과: 120초)'); // [!!!] 메시지 수정
        } else {
          alert(`로그인에 실패했습니다. (${alertMessage})`);
        }
        
        setIsLoading(false); 
        setLoadingMessage('로그인 중...');
      }
    },
    // Google 로그인 팝업창 닫기 등 실패 시
    onError: (error) => {
      console.error('Google 로그인 실패:', error);
      setIsLoading(false);
    },
  });

  // (JSX는 기존과 동일)
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-logo">MentoAI</h1>
        <p className="auth-subtitle">
          AI와 함께 당신의 진로를 설계하고<br />
          맞춤형 활동을 추천받아 보세요.
        </p>
        <button 
          className="google-login-button" 
          onClick={() => !isLoading && handleGoogleLogin()} 
          disabled={isLoading} 
        >
          {isLoading ? loadingMessage : ( 
            <>
              <svg className="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
G_USER
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google 계정으로 시작하기
            </>
          )}
        </button>
        <p className="auth-helper-text">
          계속 진행하면 MentoAI의 서비스 이용약관 및<br/>개인정보 처리방침에 동의하는 것으로 간주됩니다.
        </p>
      </div>
    </div>
  );
}

export default AuthPage;