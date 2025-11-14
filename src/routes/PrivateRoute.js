import React from "react";
import { Navigate } from "react-router-dom";

function PrivateRoute(props) {
  const { children } = props;

  // 여기 로직은 프로젝트에 맞게 바꾸면 된다
  // 예시: localStorage에 토큰이 있으면 로그인된 것으로 간주
  const isAuthenticated = !!localStorage.getItem("accessToken");

  if (!isAuthenticated) {
    // 로그인 안 됐으면 /auth로 보냄
    return <Navigate to="/auth" replace />;
  }

  // 로그인 돼 있으면 원래 보여주려던 컴포넌트 렌더링
  return children;
}

export default PrivateRoute;
