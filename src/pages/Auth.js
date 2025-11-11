import React from 'react'; // [수정] useState 제거
// [주석] import { useGoogleLogin } from '@react-oauth/google'; 
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
// [주석] import { loginWithGoogle } from '../api/authApi'; 
import './Page.css';

function AuthPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  // const [isLoading, setIsLoading] = useState(false); // [삭제]

  // --- [주석] 실제 Google 로그인 로직 ---
  /*
  const handleGoogleLogin = useGoogleLogin({ ... });
  */
  // --- 여기까지 실제 Google 로그인 로직 주석 처리 ---


  // [신규] 버튼 클릭 시 '가짜' 유저 정보를 Context에 저장하고 페이지 이동
  const handleTempLoginClick = () => {
    // setIsLoading(true); // [삭제]
    console.log("임시 로그인: 가짜 유저 정보를 생성하고 /profile-setup 페이지로 이동합니다.");

    // 1. ProfileSetupRoute를 통과하기 위한 '가짜' 사용자 객체
    const fakeUser = {
      userId: "temp-user-12345",
      name: "임시 사용자",
      accessToken: "temp-fake-token-for-auth-api",
      refreshToken: "temp-fake-refresh-token",
      expiresAt: new Date().getTime() + 3600 * 1000, // (1시간 후 만료)
      isNewUser: true,
      profileComplete: false // 👈 이 값이 false여야 /profile-setup 접근 가능
    };

    // 2. AuthContext에 이 가짜 유저를 등록 (이제 API 호출 안 함)
    auth.login(fakeUser);

    // 3. /profile-setup 페이지로 이동
    navigate('/profile-setup');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-logo">멘토아이</h1>
        <p className="auth-subtitle">
          AI와 함께 당신의 진로를 설계하고<br />
          맞춤형 활동을 추천받아 보세요.
        </p>
        <button 
          className="google-login-button" 
          onClick={handleTempLoginClick}
          disabled={false} // [수정] isLoading 제거
        >
          {/* [수정] isLoading 제거 */ }
          <>
            <svg className="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google 계정으로 시작하기
          </>
        </button>
        <p className="auth-helper-text">
          계속 진행하면 멘토아이의 서비스 이용약관 및<br/>개인정보 처리방침에 동의하는 것으로 간주됩니다.
        </p>
      </div>
    </div>
  );
}

export default AuthPage;