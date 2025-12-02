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
          로그아웃
        </button>
    </nav>
  );
}

export default Navbar;