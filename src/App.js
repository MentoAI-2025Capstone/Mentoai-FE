// src/App.js

import React, { useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AuthPage from './pages/Auth';
import Navbar from './components/Navbar';
import ActivityRecommender from './pages/ActivityRecommender';
import ProfileSetup from './pages/ProfileSetup';
import PromptInput from './pages/PromptInput';
import ScheduleCalendar from './pages/ScheduleCalendar';
import MyPage from './pages/MyPage';
import OAuthCallback from './pages/OAuthCallback';
import Dashboard from './pages/Dashboard';
import './App.css';

// 브라우저 스크롤 복원 비활성화
if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}
// ---

/**
 * sessionStorage에서 인증 정보를 읽어옵니다.
 */
const getAuthInfo = () => {
  try {
    const storedUser = JSON.parse(sessionStorage.getItem('mentoUser'));

    // user 객체 존재 여부를 검사하지 않고,
    // accessToken의 존재만으로 '로그인 됨(isAuthenticated)'으로 간주합니다.
    if (storedUser && storedUser.tokens?.accessToken) {
      return {
        isAuthenticated: true,
        // user 객체가 null일 수도 있으므로 '?' (Optional Chaining)을 추가해
        // 안전하게 profileComplete 상태를 확인합니다.
        profileComplete: storedUser.user?.profileComplete || false
      };
    }
  } catch (e) { /* 파싱 실패 시 무시 */ }
  return { isAuthenticated: false, profileComplete: false };
};

/**
 * 로그인한 사용자만 접근 가능한 라우트
 */
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, profileComplete } = getAuthInfo();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  // isAuthenticated가 true여도,
  // profileComplete가 false이면 (user 객체가 아직 없으면) /profile-setup으로 보냅니다.
  if (!profileComplete) {
    return <Navigate to="/profile-setup" replace />;
  }
  return children;
};

/**
 * 프로필 설정 페이지만을 위한 라우트
 */
const ProfileSetupRoute = ({ children }) => {
  const { isAuthenticated, profileComplete } = getAuthInfo();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (profileComplete) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

/**
 * 로그인 안 한 사용자만 접근 가능한 라우트
 */
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = getAuthInfo();
  if (isAuthenticated) {
    // 로그인한 사용자가 /login으로 오면, 
    // profileComplete 여부에 따라 올바른 페이지로 보내줍니다.
    const { profileComplete } = getAuthInfo();
    const destination = profileComplete ? '/dashboard' : '/profile-setup';
    return <Navigate to={destination} replace />;
  }
  return children;
};

// --- 메인 App 컴포넌트 ---
import Onboarding from './pages/Onboarding'; // [NEW] 온보딩 페이지

// ... (기존 imports)

// --- 메인 App 컴포넌트 ---
function App() {
  const location = useLocation();
  const { isAuthenticated, profileComplete } = getAuthInfo();
  const contentRef = useRef(null);

  // Navbar 표시 조건: 로그인 + 프로필 완료 + (온보딩 페이지 아님)
  // 온보딩 페이지는 비로그인 상태이므로 isAuthenticated가 false라 자동으로 안 보임
  const showNavbar = isAuthenticated && profileComplete;

  const appClassName = showNavbar ? "App" : "App-unauthed";
  const getContentClass = () => {
    // 콜백, 프로필 설정, 온보딩은 전체 화면 사용
    if (!isAuthenticated || location.pathname === '/oauth/callback' || location.pathname === '/profile-setup' || location.pathname === '/') {
      return "content-full";
    }
    if (location.pathname === '/prompt') { return "content-chat"; }
    return "content";
  };

  // 라우트 변경 시 스크롤을 항상 맨 위로 강제 초기화
  useEffect(() => {
    setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
      window.scrollTo(0, 0);
    }, 0);
  }, [location.pathname]);

  return (
    <div className={appClassName}>
      {showNavbar && <Navbar />}
      <main ref={contentRef} className={getContentClass()}>
        <Routes>
          {/* 0. 랜딩/온보딩 경로 (Root) */}
          {/* 로그인 안 된 상태면 Onboarding, 로그인 된 상태면 Dashboard 등으로 이동 */}
          <Route path="/" element={
            isAuthenticated ? (
              <Navigate to={profileComplete ? "/dashboard" : "/profile-setup"} replace />
            ) : (
              <Onboarding />
            )
          } />

          {/* 1. 로그인/프로필 경로 */}
          <Route path="/login" element={<PublicRoute><AuthPage /></PublicRoute>} />
          <Route path="/profile-setup" element={<ProfileSetupRoute><ProfileSetup /></ProfileSetupRoute>} />

          {/* 2. OAuth 콜백 라우트 */}
          <Route path="/oauth/callback" element={<OAuthCallback />} />

          {/* 3. 메인 서비스 경로 */}
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/recommend" element={<PrivateRoute><ActivityRecommender /></PrivateRoute>} />
          <Route path="/prompt" element={<PrivateRoute><PromptInput /></PrivateRoute>} />
          <Route path="/schedule" element={<PrivateRoute><ScheduleCalendar /></PrivateRoute>} />
          <Route path="/mypage" element={<PrivateRoute><MyPage /></PrivateRoute>} />

          {/* 4. 그 외 경로는 Root로 리디렉션 */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;