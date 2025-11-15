// src/components/Navbar.js
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './Navbar.css';
// [!!!] useAuth는 더 이상 존재하지 않습니다.

function Navbar() {
  // [!!!] useNavigate 대신 window.location을 사용해야 App.js가 리프레시됩니다.
  const navigate = useNavigate();

  const handleLogout = async () => {
    // [!!!] Context가 없으므로 sessionStorage를 직접 비웁니다.
    sessionStorage.removeItem('mentoUser');
    
    // [!!!] App.js의 라우팅을 다시 검사하도록 페이지를 강제 리프레시합니다.
    window.location.href = '/login'; 
  };

  return (
    <nav className="navbar">
      <NavLink to="/recommend" className="navbar-logo">
        MentoAI
      </NavLink>
      
      <ul className="navbar-menu">
        <li>
          <NavLink to="/recommend" className={({ isActive }) => (isActive ? 'active' : '')}>
            📚 활동 추천 목록
          </NavLink>
        </li>
        <li>
          <NavLink to="/prompt" className={({ isActive }) => (isActive ? 'active' : '')}>
            ✨ 진로설계 AI
          </NavLink>
        </li>
        <li>
          <NavLink to="/schedule" className={({ isActive }) => (isActive ? 'active' : '')}>
            📅 활동 캘린더
          </NavLink>
        </li>
        <li>
          <NavLink to="/mypage" className={({ isActive }) => (isActive ? 'active' : '')}>
            👤 마이페이지
          </NavLink>
        </li>
      </ul>
      
      <button onClick={handleLogout} className="logout-button">
        로그아웃
      </button>
    </nav>
  );
}

export default Navbar;