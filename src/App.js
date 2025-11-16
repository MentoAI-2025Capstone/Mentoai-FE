// src/App.js

import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AuthPage from './pages/Auth'; 

// --- (컴포넌트 임포트) ---
import Navbar from './components/Navbar';
import ActivityRecommender from './pages/ActivityRecommender';
import ProfileSetup from './pages/ProfileSetup';
import PromptInput from './pages/PromptInput';
import ScheduleCalendar from './pages/ScheduleCalendar';
import MyPage from './pages/MyPage';
import OAuthCallback from './pages/OAuthCallback'; // 콜백 페이지 임포트
import './App.css'; 
// ---

/**
 * [!!!] [수정] sessionStorage에서 인증 정보를 읽어옵니다.
 */
const getAuthInfo = () => {
  try {
    const storedUser = JSON.parse(sessionStorage.getItem('mentoUser'));
    
    // [!!!] [수정] user 객체 존재 여부를 검사하지 않고,
    // accessToken의 존재만으로 '로그인 됨(isAuthenticated)'으로 간주합니다.
    if (storedUser && storedUser.tokens?.accessToken) { 
      return {
        isAuthenticated: true,
        // [!!!] [수정] user 객체가 null일 수도 있으므로 '?' (Optional Chaining)을 추가해
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
  // [!!!] [수정] isAuthenticated가 true여도,
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
    return <Navigate to="/recommend" replace />;
  }
  return children;
};

/**
 * 로그인 안 한 사용자만 접근 가능한 라우트
 */
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = getAuthInfo();
  if (isAuthenticated) {
    // [!!!] [수정] 로그인한 사용자가 /login으로 오면, 
    // profileComplete 여부에 따라 올바른 페이지로 보내줍니다.
    const { profileComplete } = getAuthInfo();
    const destination = profileComplete ? '/recommend' : '/profile-setup';
    return <Navigate to={destination} replace />;
  }
  return children;
};

// --- 메인 App 컴포넌트 ---
function App() {
  const location = useLocation();
  const { isAuthenticated, profileComplete } = getAuthInfo();

  const showNavbar = isAuthenticated && profileComplete;
  
  const appClassName = showNavbar ? "App" : "App-unauthed";
  const getContentClass = () => {
    // [수정] 콜백 페이지도 전체 화면(content-full)을 사용하도록 조건 추가
    if (!isAuthenticated || location.pathname === '/oauth/callback') { 
      return "content-full"; 
    }
    if (location.pathname === '/prompt') { return "content-chat"; }
    return "content";
  };

  return (
    <div className={appClassName}>
      {showNavbar && <Navbar />}
      <main className={getContentClass()}>
        <Routes>
          {/* 1. 로그인/프로필 경로 */}
          <Route path="/login" element={<PublicRoute><AuthPage /></PublicRoute>} />
          <Route path="/profile-setup" element={<ProfileSetupRoute><ProfileSetup /></ProfileSetupRoute>} />
          
          {/* 2. OAuth 콜백 라우트 */}
          <Route path="/oauth/callback" element={<OAuthCallback />} />
          
          {/* 3. 메인 서비스 경로 */}
          <Route path="/recommend" element={<PrivateRoute><ActivityRecommender /></PrivateRoute>} />
          <Route path="/prompt" element={<PrivateRoute><PromptInput /></PrivateRoute>} />
          <Route path="/schedule" element={<PrivateRoute><ScheduleCalendar /></PrivateRoute>} />
          <Route path="/mypage" element={<PrivateRoute><MyPage /></PrivateRoute>} />

          {/* 4. 기본 경로 리디렉션 */}
          <Route path="/" element={<Navigate to={isAuthenticated ? (profileComplete ? "/recommend" : "/profile-setup") : "/login"} replace />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;