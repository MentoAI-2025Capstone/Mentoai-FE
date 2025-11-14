// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

import PublicRoute from "./routes/PublicRoute";
import PrivateRoute from "./routes/PrivateRoute";

// 🧩 아래는 실제 프로젝트의 페이지 컴포넌트로 교체하세요
import AuthPage from "./pages/AuthPage"; // 로그인 페이지
import ProfileSetupPage from "./pages/ProfileSetupPage"; // 프로필 작성 페이지
import RecommendPage from "./pages/RecommendPage"; // 메인 추천 페이지
import HomePage from "./pages/HomePage"; // 선택: 루트 페이지

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* 공개 라우트: 로그인/회원가입 */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<AuthPage />} />
          </Route>

          {/* 프로필 작성 페이지: 로그인은 필요하지만, profileComplete는 false인 상태 */}
          <Route element={<PrivateRoute />}>
            <Route path="/profile-setup" element={<ProfileSetupPage />} />
          </Route>

          {/* 추천 페이지: 로그인 + 프로필 완료 필수 */}
          <Route element={<PrivateRoute requireProfileComplete />}>
            <Route path="/recommend" element={<RecommendPage />} />
          </Route>

          {/* 홈(/)을 어디로 보낼지 정하고 싶으면 여기서 처리 */}
          <Route path="/" element={<HomePage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
