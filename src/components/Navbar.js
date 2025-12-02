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
      {/* 왼쪽: 로고 + 대시보드 뱃지 */}
      <div className="navbar-left">
        <NavLink to="/dashboard" className="navbar-logo">
          MentoAI
        </NavLink>

        <NavLink
          to="/dashboard"
          className={({ isActive }) => (isActive ? 'navbar-dashboard-pill active' : 'navbar-dashboard-pill')}
          title="대시보드 홈으로 이동"
        >
          <span>🏠</span>
          <span>대시보드</span>
        </NavLink>
      </div>

      {/* 중앙: 주요 기능 메뉴 */}
      <ul className="navbar-menu">
        <li>
          <NavLink to="/recommend" className={({ isActive }) => (isActive ? 'active' : '')}>
            📚 활동 추천
          </NavLink>
        </li>
        <li>
          <NavLink to="/prompt" className={({ isActive }) => (isActive ? 'active' : '')}>
            ✨ 진로설계 AI
          </NavLink>
        </li>
        <li>
          <NavLink to="/schedule" className={({ isActive }) => (isActive ? 'active' : '')}>
            📅 캘린더
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