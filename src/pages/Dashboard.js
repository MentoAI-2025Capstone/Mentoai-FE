// src/pages/Dashboard.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import './Page.css'; // 공통 스타일 사용

// sessionStorage에서 userId를 가져오는 헬퍼
const getUserIdFromStorage = () => {
  try {
    const storedUser = JSON.parse(sessionStorage.getItem('mentoUser'));
    return storedUser ? storedUser.user.userId : null;
  } catch (e) {
    return null;
  }
};

function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const userId = getUserIdFromStorage();
      if (!userId) {
        navigate('/login');
        return;
      }

      setIsLoading(true);
      try {
        // 1. 프로필 정보 가져오기
        const profileRes = await apiClient.get(`/users/${userId}/profile`);
        setProfile(profileRes.data);

        // 2. 캘린더 이벤트 가져오기
        try {
          const calendarRes = await apiClient.get(`/users/${userId}/calendar/events`);
          const events = calendarRes.data || [];

          const now = new Date();
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(now.getMonth() - 1);

          // 임박 일정 (오늘 이후, startAt 오름차순)
          const upcoming = events
            .filter(e => new Date(e.startAt) >= now)
            .sort((a, b) => new Date(a.startAt) - new Date(b.startAt))
            .slice(0, 3);

          // 지난달 활동 (startAt 또는 endAt이 지난달)
          const past = events
            .filter(e => {
              const d = new Date(e.startAt);
              return d >= oneMonthAgo && d < now;
            })
            .sort((a, b) => new Date(b.startAt) - new Date(a.startAt)) // 최신순
            .slice(0, 3);

          setUpcomingEvents(upcoming);
          setPastEvents(past);

        } catch (e) {
          console.warn('캘린더 로드 실패:', e);
        }

      } catch (error) {
        console.error('대시보드 데이터 로드 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleCtaClick = (type) => {
    let prompt = "";
    if (type === 'contest') {
      prompt = `${profile?.interestDomains?.[0] || '관심 직무'} 관련 공모전 추천해줘`;
    } else if (type === 'job') {
      prompt = `${profile?.interestDomains?.[0] || '관심 직무'} 관련 직무 추천해줘`;
    }

    navigate('/prompt', { state: { initialPrompt: prompt } });
  };

  // 기술 스택 문자열 생성
  const getTechStackString = () => {
    if (!profile?.techStack) return '설정되지 않음';
    // techStack이 객체 배열({name, level})인지 문자열 배열인지 확인
    if (Array.isArray(profile.techStack)) {
      return profile.techStack.map(t => (typeof t === 'string' ? t : t.name)).join(', ');
    }
    return '설정되지 않음';
  };

  if (isLoading) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="page-container dashboard-container">
      <h1 style={{ marginBottom: '20px' }}>대시보드</h1>

      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>

        {/* 1. 사용자 프로필 요약 */}
        <div className="card profile-card" style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', position: 'relative' }}>
          <h3 style={{ marginTop: 0 }}>👋 안녕하세요, {profile?.name || '사용자'}님!</h3>
          <p style={{ color: '#666', lineHeight: '1.6' }}>
            <strong>관심 직무:</strong> {profile?.interestDomains?.join(', ') || '설정되지 않음'}<br />
            <strong>보유 기술:</strong> {getTechStackString()}
          </p>
          <button
            onClick={() => navigate('/mypage')}
            style={{
              position: 'absolute',
              bottom: '20px',
              right: '20px',
              padding: '8px 16px',
              backgroundColor: '#f0f0f0',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            프로필 수정
          </button>
        </div>

        {/* 2. 추천 CTA 카드 */}
        <div className="card cta-card" style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
          <h3 style={{ marginTop: 0 }}>🚀 진로 설계 시작하기</h3>
          <button
            onClick={() => handleCtaClick('contest')}
            style={{ padding: '12px', backgroundColor: '#e3f2fd', border: 'none', borderRadius: '8px', color: '#1976d2', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left' }}
          >
            🏆 공모전 추천받기
          </button>
          <button
            onClick={() => handleCtaClick('job')}
            style={{ padding: '12px', backgroundColor: '#fff3e0', border: 'none', borderRadius: '8px', color: '#e65100', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left' }}
          >
            💼 직무 추천받기
          </button>
        </div>

        {/* 3. 임박한 일정 카드 */}
        <div className="card upcoming-card" style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0, color: '#d32f2f' }}>🔥 임박한 일정</h3>
          {upcomingEvents.length > 0 ? (
            <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '0.9rem' }}>
              {upcomingEvents.map(e => (
                <li key={e.eventId} style={{ marginBottom: '8px' }}>
                  <strong>{e.activityTitle || e.title || '일정'}</strong> <br />
                  <span style={{ color: '#666', fontSize: '0.85rem' }}>
                    {new Date(e.startAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: '0.85rem', color: '#888' }}>예정된 일정이 없습니다.</p>
          )}
        </div>

        {/* 4. 지난달 활동 카드 */}
        <div className="card past-card" style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0, color: '#1976d2' }}>⏮ 지난달 활동</h3>
          {pastEvents.length > 0 ? (
            <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '0.9rem' }}>
              {pastEvents.map(e => (
                <li key={e.eventId} style={{ marginBottom: '8px' }}>
                  <strong>{e.activityTitle || e.title || '활동'}</strong> <br />
                  <span style={{ color: '#666', fontSize: '0.85rem' }}>
                    {new Date(e.startAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: '0.85rem', color: '#888' }}>지난 활동이 없습니다.</p>
          )}
        </div>

      </div>
    </div>
  );
}

export default Dashboard;
