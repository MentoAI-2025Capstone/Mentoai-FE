import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  const handleLogout = () => {
    sessionStorage.removeItem('mentoUser');
    window.location.href = '/login';
  };

  return (
    <nav className="navbar">
      {/* 왼쪽: 로고 + 대시보드 링크 (구분선으로 분리) */}
      <div className="navbar-left">
        <NavLink to="/dashboard" className="navbar-logo">
          MentoAI
        </NavLink>

        <span className="navbar-divider">|</span>

        <NavLink
          to="/dashboard"
          className={({ isActive }) => (isActive ? 'navbar-dashboard active' : 'navbar-dashboard')}
        >
          대시보드
        </NavLink>
      </div>

      {/* 중앙: 주요 기능 메뉴 */}
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

      {/* 오른쪽: 로그아웃 */}
      <button onClick={handleLogout} className="logout-button">
        로그아웃
      </button>
    </nav>
  );
}

export default Navbar;