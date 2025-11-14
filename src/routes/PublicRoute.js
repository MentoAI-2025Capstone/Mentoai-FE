// src/routes/PublicRoute.jsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/**
 * 로그인/회원가입 페이지용 공개 라우트
 * - 이미 로그인된 사용자는 접근 시 적절한 페이지로 리다이렉트
 *
 * 사용 예:
 * <Route element={<PublicRoute />}>
 *   <Route path="/login" element={<AuthPage />} />
 * </Route>
 */
const PublicRoute = () => {
  const { user, loading, profileComplete } = useAuth();

  if (loading) {
    return null;
  }

  if (user) {
    // 로그인 되어 있으면:
    // 프로필 완료 → 추천 페이지
    // 프로필 미완 → 프로필 설정 페이지
    if (profileComplete) {
      return <Navigate to="/recommend" replace />;
    }
    return <Navigate to="/profile-setup" replace />;
  }

  // 로그인 안 된 상태 → 자식 라우트(로그인/회원가입 페이지) 노출
  return <Outlet />;
};

export default PublicRoute;
