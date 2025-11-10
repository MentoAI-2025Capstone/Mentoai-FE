import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import AuthPage from './pages/Auth';
// [오류 수정] pagesS -> pages로 경로 수정
import ProfileSetup from './pages/ProfileSetup';
import PromptInput from './pages/PromptInput';
// import PortfolioCalendar from './pages/PortfolioCalendar'; // 삭제됨
import ActivityRecommender from './pages/ActivityRecommender';
import ScheduleCalendar from './pages/ScheduleCalendar';
import MyPage from './pages/MyPage';
import { useAuth } from './contexts/AuthContext';
import './App.css';

// 로그인한 사용자만 접근 가능한 페이지를 감싸는 컴포넌트
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>로딩 중...</div>; // 인증 상태 확인 중 로딩 스피너
  }

  if (!user) {
    // 로그인하지 않은 사용자는 로그인 페이지로 리디렉션
    return <Navigate to="/login" replace />;
  }

  if (user && !user.profileComplete) {
    // 로그인은 했지만 프로필 설정이 완료되지 않은 경우
    // 현재 경로가 /profile-setup이 아니라면 리디렉션
    return <Navigate to="/profile-setup" replace />;
  }
  
  // 로그인했고 프로필 설정도 완료한 사용자
  return children;
}

// 로그인하지 않은 사용자만 접근 가능한 페이지 (로그인, 회원가입)
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>로딩 중...</div>;
  }

  if (user && user.profileComplete) {
    // 이미 로그인하고 프로필 설정도 완료했다면 메인 페이지로 리디렉션
    return <Navigate to="/prompt" replace />;
  }

  if (user && !user.profileComplete) {
      // 로그인은 했지만 프로필 설정이 완료되지 않은 경우
    return <Navigate to="/profile-setup" replace />;
  }

  // 로그인하지 않은 사용자
  return children;
}

// 프로필 설정 전용 라우트
function ProfileSetupRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>로딩 중...</div>;
  }

  if (!user) {
    // 로그인하지 않은 사용자는 로그인 페이지로 리디렉션
    return <Navigate to="/login" replace />;
  }

  if (user && user.profileComplete) {
    // 이미 프로필 설정을 완료했다면 메인 페이지로 리디렉션
    return <Navigate to="/prompt" replace />;
  }
  
  // 로그인했고 프로필 설정이 필요한 사용자
  return children;
}


function App() {
  const { user, loading } = useAuth();
  const location = useLocation();

  // 로딩 중에는 아무것도 표시하지 않음 (선택적)
  if (loading) {
    return (
      <div className="auth-container">
        <div>로딩 중...</div>
      </div>
    );
  }

  // 로그인 페이지, 프로필 설정 페이지에서는 Navbar를 숨김
  const showNavbar = user && user.profileComplete && location.pathname !== '/login' && location.pathname !== '/profile-setup';
  
  // 로그인 상태에 따라 전체 클래스 변경
  const appClassName = showNavbar ? "App" : "App-unauthed";

  return (
    <div className={appClassName}>
      {showNavbar && <Navbar />}
      
      {/* Navbar가 보일 땐 "content", 안 보일 땐 "content-full" 클래스를 사용하도록 변경 
      */}
      <main className={showNavbar ? "content" : "content-full"}>
        <Routes>
          {/* 1. 로그인/프로필 설정 경로는 로그인한 사용자가 접근하지 못하게 */}
          <Route path="/login" element={
            <PublicRoute>
              <AuthPage />
            </PublicRoute>
          } />
          <Route path="/profile-setup" element={
            <ProfileSetupRoute>
              <ProfileSetup />
            </ProfileSetupRoute>
          } />

          {/* 2. 메인 서비스 경로는 로그인 + 프로필 설정 완료 사용자만 접근 가능하게 */}
          {/* (순서 변경됨) 활동 추천 목록이 첫번째 */}
          <Route path="/recommend" element={
            <PrivateRoute>
              <ActivityRecommender />
            </PrivateRoute>
          } />
          {/* (순서 변경됨) 진로 설계 AI가 두번째 */}
          <Route path="/prompt" element={
            <PrivateRoute>
              <PromptInput />
            </PrivateRoute>
          } />
          <Route path="/schedule" element={
            <PrivateRoute>
              <ScheduleCalendar />
            </PrivateRoute>
          } />
          <Route path="/mypage" element={
            <PrivateRoute>
              <MyPage />
            </PrivateRoute>
          } />

          {/* 3. 기본 경로는 인증 상태에 따라 자동으로 리디렉션 */}
          <Route path="/" element={
            user ? 
              (user.profileComplete ? <Navigate to="/prompt" /> : <Navigate to="/profile-setup" />) : 
              <Navigate to="/login" />
          } />

          {/* 4. 일치하는 경로가 없는 경우 */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;