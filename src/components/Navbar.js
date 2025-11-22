import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import apiClient from '../api/apiClient';
import './Navbar.css';

// sessionStorage에서 userId를 가져오는 헬퍼
const getUserIdFromStorage = () => {
  try {
    const storedUser = JSON.parse(sessionStorage.getItem('mentoUser'));
    return storedUser ? storedUser.user.userId : null;
  } catch (e) {
    return null;
  }
};

function Navbar() {
  const [unreadCount, setUnreadCount] = useState(0);

  // 알림 개수 가져오기
  useEffect(() => {
    const fetchUnreadCount = async () => {
      const userId = getUserIdFromStorage();
      if (!userId) return;

      try {
        // GET /notifications/{userId}/unread-count
        // (명세서에는 있지만 백엔드 구현 여부는 불확실하므로 try-catch로 감쌈)
        const response = await apiClient.get(`/notifications/${userId}/unread-count`);
        console.log('[Navbar] 알림 개수 조회 성공:', response.data);
        if (response.data && typeof response.data.count === 'number') {
          setUnreadCount(response.data.count);
        } else {
           // 응답 형식이 { count: n }이 아닐 수 있으므로 확인 필요. 
           // 여기서는 임시로 0 처리하거나, 응답 객체 자체가 숫자라면 그대로 사용
           setUnreadCount(typeof response.data === 'number' ? response.data : 0);
        }
      } catch (error) {
        // 404 등 에러 시 조용히 실패
        console.warn('[Navbar] 알림 개수 조회 실패:', error);
      }
    };

    fetchUnreadCount();
  }, []);

  const handleNotificationClick = async () => {
    const userId = getUserIdFromStorage();
    if (!userId) return;

    console.log('[Navbar] 알림 아이콘 클릭됨');
    try {
      console.log(`[Navbar] GET /notifications/${userId}`);
      const response = await apiClient.get(`/notifications/${userId}`);
      console.log('[Navbar] 알림 목록 조회 결과:', response.data);
      alert(`알림 목록을 콘솔에 출력했습니다.\n(총 ${Array.isArray(response.data) ? response.data.length : 0}개)`);
      
      // 읽음 처리 (테스트용: 전체 읽음)
      // await apiClient.put(`/notifications/${userId}/read-all`);
      // setUnreadCount(0);
    } catch (error) {
      console.error('[Navbar] 알림 목록 조회 실패:', error);
      alert('알림 목록을 불러오지 못했습니다.');
    }
  };

  const handleLogout = () => {
    // 1. sessionStorage에서 사용자 정보 삭제
    sessionStorage.removeItem('mentoUser');
    
    // 2. App.js가 라우팅을 다시 계산하도록 /login으로 강제 이동 및 새로고침
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
      
      {/* 알림 아이콘 추가 */}
      <div className="notification-container" onClick={handleNotificationClick}>
        <span className="notification-icon">🔔</span>
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </div>

      <button onClick={handleLogout} className="logout-button">
        로그아웃
      </button>
    </nav>
  );
}

export default Navbar;