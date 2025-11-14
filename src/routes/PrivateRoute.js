// src/routes/PrivateRoute.jsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/**
 * 보호 라우트
 *
 * 사용 예:
 * <Route element={<PrivateRoute />}>
 *   <Route path="/recommend" element={<RecommendPage />} />
 *   ...
 * </Route>
 *
 * 프로필을 반드시 작성한 유저만 접근하게 하고 싶으면:
 * <Route element={<PrivateRoute requireProfileComplete />}>
 *   <Route path="/recommend" element={<RecommendPage />} />
 * </Route>
 */
const PrivateRoute = ({ requireProfileComplete = false }) => {
  const { user, loading, profileComplete } = useAuth();

  if (loading) {
    // 토큰 검증 중이면 아무것도 렌더링하지 않거나 스피너 렌더
    return null;
  }

  if (!user) {
    // 로그인 안 되어 있으면 로그인 페이지로
    return <Navigate to="/login" replace />;
  }

  if (requireProfileComplete && !profileComplete) {
    // 프로필 미완이면 프로필 설정 페이지로
    return <Navigate to="/profile-setup" replace />;
  }

  // 권한 통과 → 자식 라우트 렌더
  return <Outlet />;
};

export default PrivateRoute;
