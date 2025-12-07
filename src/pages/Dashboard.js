// src/pages/Dashboard.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import './Page.css'; // 공통 스타일 사용
import RadarChartComponent from '../components/RadarChartComponent';

// sessionStorage에서 userId를 가져오는 헬퍼
// sessionStorage에서 userId를 가져오는 헬퍼
const getUserIdFromStorage = () => {
  try {
    const storedUser = JSON.parse(sessionStorage.getItem('mentoUser'));
    return storedUser ? storedUser.user.userId : null;
  } catch (e) {
    return null;
  }
};

const getUserNameFromStorage = () => {
  try {
    const storedUser = JSON.parse(sessionStorage.getItem('mentoUser'));
    return storedUser?.user?.name || null;
  } catch (e) {
    return null;
  }
};

function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [roleFit, setRoleFit] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRoleFitLoading, setIsRoleFitLoading] = useState(false);

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
        const profileData = profileRes.data;
        setProfile(profileData);

        // 2. 캘린더 이벤트 가져오기
        try {
          const calendarRes = await apiClient.get(`/users/${userId}/calendar/events`);
          const events = calendarRes.data || [];
          console.log('[Dashboard] 캘린더 이벤트 응답', events.map(e => ({
            eventId: e.eventId,
            eventType: e.eventType,
            activityId: e.activityId,
            activityTitle: e.activityTitle,
            jobPostingTitle: e.jobPostingTitle,
            jobPostingCompany: e.jobPostingCompany,
            eventTitle: e.eventTitle,
            fallbackTitle: e.title
          })));

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

  // 별도 Effect: 직무 적합도 비동기 로드 (메인 로딩 차단 안함)
  useEffect(() => {
    const fetchRoleFit = async () => {
      const userId = getUserIdFromStorage();
      if (!userId || !profile?.interestDomains?.[0]) return;

      setIsRoleFitLoading(true);
      try {
        const targetRole = profile.interestDomains[0];
        const roleFitRes = await apiClient.post(`/users/${userId}/role-fit`, {
          target: targetRole
        });
        setRoleFit(roleFitRes.data);
      } catch (e) {
        console.warn('직무 적합도 로드 실패:', e);
      } finally {
        setIsRoleFitLoading(false);
      }
    };

    if (profile) {
      fetchRoleFit();
    }
  }, [profile]);

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

  // D-Day 계산 및 색상 결정 헬퍼
  const calculateDDay = (targetDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);

    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let dDayString = '';
    let color = '#333'; // 기본 색상

    if (diffDays === 0) {
      dDayString = 'D-Day';
      color = '#d32f2f'; // 빨강 (당일)
    } else if (diffDays > 0) {
      dDayString = `D-${diffDays}`;
      if (diffDays <= 3) {
        color = '#d32f2f'; // 빨강 (임박)
      } else if (diffDays <= 7) {
        color = '#f57c00'; // 주황 (일주일 내)
      } else {
        color = '#388e3c'; // 초록 (여유)
      }
    } else {
      dDayString = `D+${Math.abs(diffDays)}`; // 지난 일정
      color = '#999';
    }

    return { text: dDayString, color };
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
      {/* 1. 상단 사용자 헤더 (인사말 + 정보) */}
      <div className="dashboard-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ flex: '1 1 auto' }}>
          <h2 style={{ margin: 0, fontSize: '1.8rem' }}>👋 안녕하세요, {profile?.name || getUserNameFromStorage() || '사용자'}님!</h2>
        </div>
        <div style={{
          flex: '0 1 auto',
          textAlign: 'left',
          backgroundColor: '#f8f9fa',
          padding: '10px 15px',
          borderRadius: '8px',
          fontSize: '0.9rem',
          color: '#555',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }}>
          <div style={{ marginBottom: '4px' }}>
            <strong>관심 직무:</strong> {profile?.interestDomains?.join(', ') || '설정되지 않음'}
          </div>
          <div>
            <strong>보유 기술:</strong> {getTechStackString()}
          </div>
        </div>
      </div>

      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>

        {/* 2. 직무 적합도 차트 (카드 1) */}
        <div className="card chart-card" style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', position: 'relative' }}>
          {/* 차트 제목/점수 */}
          {isRoleFitLoading ? (
            <div style={{ textAlign: 'center', color: '#888', fontSize: '0.9rem', padding: '40px 0' }}>
              분석 중...
            </div>
          ) : roleFit && roleFit.breakdown ? (
            <div>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#333' }}>
                🎯 {roleFit.target} 적합도: <span style={{ color: '#1976d2', fontSize: '1.2rem' }}>{roleFit.roleFitScore}점</span>
              </h4>
              <RadarChartComponent data={roleFit.breakdown} />
            </div>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
              직무 적합도 데이터가 없습니다.
            </div>
          )}

          <button
            onClick={() => navigate('/mypage')}
            style={{
              marginTop: '15px',
              width: '100%',
              padding: '8px 16px',
              backgroundColor: '#f0f0f0',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              color: '#333'
            }}
          >
            프로필 수정
          </button>
        </div>

        {/* 3. 추천 CTA 카드 (카드 2) */}
        <div className="card cta-card" style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '15px', justifyContent: 'center' }}>
          <h3 style={{ marginTop: 0 }}>🚀 진로 설계 시작하기</h3>
          <button
            onClick={() => handleCtaClick('contest')}
            style={{ padding: '20px', backgroundColor: '#e3f2fd', border: 'none', borderRadius: '12px', color: '#1565c0', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left', fontSize: '1.1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
          >
            🏆 공모전 추천받기
          </button>
          <button
            onClick={() => handleCtaClick('job')}
            style={{ padding: '20px', backgroundColor: '#fff3e0', border: 'none', borderRadius: '12px', color: '#e65100', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left', fontSize: '1.1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
          >
            💼 직무 추천받기
          </button>
        </div>

        {/* 4. 임박한 일정 카드 (카드 3) */}
        <div className="card upcoming-card" style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0, color: '#d32f2f' }}>🔥 임박한 일정</h3>
          {upcomingEvents.length > 0 ? (
            <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '0.9rem' }}>
              {upcomingEvents.map(e => {
                const dDayInfo = calculateDDay(e.startAt);
                const title =
                  e.activityTitle ||
                  e.jobPostingTitle ||
                  e.eventTitle ||
                  e.title ||
                  '일정';
                return (
                  <li key={e.eventId} style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1, marginRight: '10px' }}>
                      <strong style={{ display: 'block', fontSize: '1rem', marginBottom: '2px' }}>{title}</strong>
                      <span style={{ fontSize: '0.8rem', color: '#666' }}>{new Date(e.startAt).toLocaleDateString()}</span>
                    </div>
                    <span style={{
                      color: dDayInfo.color,
                      fontWeight: 'bold',
                      backgroundColor: `${dDayInfo.color}15`,
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.9rem',
                      minWidth: '50px',
                      textAlign: 'center'
                    }}>
                      {dDayInfo.text}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p style={{ fontSize: '0.9rem', color: '#888', textAlign: 'center', marginTop: '40px' }}>예정된 일정이 없습니다.</p>
          )}
        </div>

        {/* 5. 지난달 활동 카드 (카드 4) - 필요한 경우 유지 */}
        <div className="card past-card" style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0, color: '#1976d2' }}>⏮ 지난달 활동</h3>
          {pastEvents.length > 0 ? (
            <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '0.9rem' }}>
              {pastEvents.map(e => {
                const title =
                  e.activityTitle ||
                  e.jobPostingTitle ||
                  e.eventTitle ||
                  e.title ||
                  '활동';
                return (
                  <li key={e.eventId} style={{ marginBottom: '12px' }}>
                    <strong style={{ display: 'block', fontSize: '1rem', marginBottom: '2px' }}>{title}</strong>
                    <span style={{ color: '#666', fontSize: '0.85rem' }}>
                      {new Date(e.startAt).toLocaleDateString()} 완료
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p style={{ fontSize: '0.9rem', color: '#888', textAlign: 'center', marginTop: '40px' }}>지난 활동이 없습니다.</p>
          )}
        </div>

      </div>
    </div>
  );
}

export default Dashboard;
