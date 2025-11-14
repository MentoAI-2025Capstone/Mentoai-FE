import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Auth from "./pages/Auth";

function App() {
  return (
    <Router>
      <Routes>
        {/* 루트 경로에서 Auth 페이지 보여주기 */}
        <Route path="/" element={<Auth />} />
      </Routes>
    </Router>
  );
}

export default App;
