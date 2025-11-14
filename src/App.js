import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import PrivateRoute from "./routes/PrivateRoute";
import PublicRoute from "./routes/PublicRoute";

function App() {
  return (
    <Router>
      <Routes>
        {/* 비회원, 회원 모두 접근 가능한 페이지 */}
        <Route path="/" element={<Home />} />

        {/* 로그인/회원가입 페이지: 이미 로그인 한 경우 접근 막는 용도 */}
        <Route
          path="/auth"
          element={
            <PublicRoute>
              <Auth />
            </PublicRoute>
          }
        />

        {/* 예시: 로그인 해야만 볼 수 있는 페이지 */}
        <Route
          path="/mypage"
          element={
            <PrivateRoute>
              <div>마이페이지 예시</div>
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
