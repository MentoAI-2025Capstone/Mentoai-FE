import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  const handleLogout = () => {
    // 1. sessionStorage에서 사용자 정보 삭제
    sessionStorage.removeItem('mentoUser');

    // 2. App.js가 라우팅을 다시 계산하도록 /login으로 강제 이동 및 새로고침
    window.location.href = '/login';
  };

  return (
    <nav className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <NavLink to="/dashboard" className="navbar-logo">
          MentoAI
        </NavLink>

        {/* 홈 버튼 (대시보드) */}
        <NavLink
          to="/dashboard"
          className={({ isActive }) => (isActive ? 'active-home' : 'nav-home')}
          style={{
            textDecoration: 'none',
            fontSize: '1rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            color: 'inherit',
            marginLeft: '5px'
          }}
          title="대시보드 홈"
        >
          대시보드
        </NavLink>
      </div>

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