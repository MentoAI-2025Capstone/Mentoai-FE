import React from "react";
import { Navigate } from "react-router-dom";

function PublicRoute(props) {
  const { children } = props;

  const isAuthenticated = !!localStorage.getItem("accessToken");

  if (isAuthenticated) {
    // 이미 로그인했으면 홈이나 마이페이지로 보내기
    return <Navigate to="/" replace />;
  }

  // 로그인 안 했으면 페이지 그대로 보여줌 (Auth 같은 페이지)
  return children;
}

export default PublicRoute;
