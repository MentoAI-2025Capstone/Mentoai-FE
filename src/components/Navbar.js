import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './Navbar.css';
import { useAuth } from '../contexts/AuthContext'; // AuthContext 사용

function Navbar() {
  const { logout } = useAuth(); // AuthContext에서 logout 함수 가져오기
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login'); // 로그아웃 후 로그인 페이지로 이동
  };

  return (
    <nav className="navbar">
      <div>
        <div className="navbar-logo">
          <NavLink to="/prompt">멘토아이</NavLink>
        </div>
        <ul className="navbar-menu">
          {/* 1. 활동 추천 목록 (위치 변경) */}
          <li>
            <NavLink to="/recommend" className={({ isActive }) => (isActive ? 'active' : '')}>
              📚 활동 추천 목록
            </NavLink>
          </li>
          
          {/* 2. 진로설계 AI (위치 변경) */}
          <li>
            <NavLink to="/prompt" className={({ isActive }) => (isActive ? 'active' : '')}>
              ✨ 진로설계 AI
            </NavLink>
          </li>

          {/* 3. 활동 캘린더 */}
          <li>
            <NavLink to="/schedule" className={({ isActive }) => (isActive ? 'active' : '')}>
              📅 활동 캘린더
            </NavLink>
          </li>
          
          {/* 4. 마이페이지 */}
          <li>
            <NavLink to="/mypage" className={({ isActive }) => (isActive ? 'active' : '')}>
              👤 마이페이지
            </NavLink>
          </li>
        </ul>
      </div>
      <div className="navbar-footer">
        <button onClick={handleLogout} className="logout-button">
          로그아웃
        </button>
      </div>
    </nav>
  );
}

export default Navbar;