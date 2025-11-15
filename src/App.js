import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AuthPage from './pages/Auth'; 

// --- (가정) 이 컴포넌트들은 이미 존재한다고 가정합니다 ---
import Navbar from './components/Navbar';
import ActivityRecommender from './pages/ActivityRecommender';
import ProfileSetup from './pages/ProfileSetup';
import PromptInput from './pages/PromptInput';
import ScheduleCalendar from './pages/ScheduleCalendar';
import MyPage from './pages/MyPage';
import './App.css'; 
// ---

/**
 * sessionStorage에서 인증 정보를 읽어옵니다.
 * 이 정보는 App.js가 렌더링될 때마다 새로고침됩니다.
 */
const getAuthInfo = () => {
  try {
    const storedUser = JSON.parse(sessionStorage.getItem('mentoUser'));
    // accessToken이 있고, user 정보가 있으면 로그인 된 것입니다.
    if (storedUser && storedUser.tokens?.accessToken && storedUser.user) {
      return {
        isAuthenticated: true,
        profileComplete: storedUser.user.profileComplete || false
      };
    }
  } catch (e) {
    // JSON 파싱 실패 시
  }
  // 정보가 없으면 로그아웃 상태입니다.
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
  if (!profileComplete) {
    // 프로필이 미완성이면 /profile-setup으로 강제 이동
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
    // 프로필이 완성됐으면 메인 페이지로 이동
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
    // 로그인한 사용자가 /login 접근 시 메인 페이지로 이동
    return <Navigate to="/recommend" replace />;
  }
  return children;
};

// --- 메인 App 컴포넌트 ---
function App() {
  const location = useLocation();
  const { isAuthenticated, profileComplete } = getAuthInfo();

  // Navbar는 로그인 및 프로필 작성이 완료된 경우에만 표시
  const showNavbar = isAuthenticated && profileComplete;
  
  // (기존 CSS 클래스 로직)
  const appClassName = showNavbar ? "App" : "App-unauthed";
  const getContentClass = () => {
    if (!showNavbar) { return "content-full"; }
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
          
          {/* 2. 메인 서비스 경로 */}
          <Route path="/recommend" element={<PrivateRoute><ActivityRecommender /></PrivateRoute>} />
          <Route path="/prompt" element={<PrivateRoute><PromptInput /></PrivateRoute>} />
          <Route path="/schedule" element={<PrivateRoute><ScheduleCalendar /></PrivateRoute>} />
          <Route path="/mypage" element={<PrivateRoute><MyPage /></PrivateRoute>} />

          {/* 3. 기본 경로 리디렉션 */}
          <Route path="/" element={<Navigate to={isAuthenticated ? "/recommend" : "/login"} replace />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;