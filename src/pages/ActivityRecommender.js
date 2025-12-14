// src/pages/ActivityRecommender.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Page.css';
import apiClient from '../api/apiClient';
import Modal from '../components/Modal';
import JobFilterModal from '../components/JobFilterModal';

// sessionStorage에서 userId를 가져오는 헬퍼
const getUserIdFromStorage = () => {
  try {
    const storedUser = JSON.parse(sessionStorage.getItem('mentoUser'));
    return storedUser ? storedUser.user.userId : null;
  } catch (e) {
    return null;
  }
};


function ActivityRecommender() {
  // 하드코딩된 공고 데이터
  const HARDCODED_JOBS = [
    {
      jobId: 'mock-1',
      title: '[KG이니시스] Back End 개발 및 운영 담당자 정규직 채용',
      companyName: '(주)케이지이니시스',
      workPlace: '서울 중구',
      deadline: '2025-12-26', // 요청에 따라 수정
      jobSector: '백엔드/서버개발',
      description: 'KG이니시스에서 결제 시스템 백엔드 개발 및 운영을 담당할 인재를 찾습니다.\n주요 업무:\n- 결제 시스템 승인/매입/정산 프로세스 개발\n- 대용량 트래픽 처리 및 성능 최적화',
      requirements: '자격 요건:\n- Java/Spring Boot 기반 개발 경험\n- RDBMS (Oracle, MySQL) 사용 경험\n- 대용량 트랜잭션 처리 경험 우대',
      link: 'https://www.jobda.im/position/167137/jd', // 요청에 따라 수정
      targetRoles: [{ targetRoleId: 'backend', name: '백엔드 개발자' }]
    },
    {
      jobId: 'mock-2',
      title: '카페24사용 웹페이지 개발자 채용',
      companyName: '스마일드래곤(주)',
      workPlace: '서울',
      deadline: '2025-12-31',
      jobSector: '웹개발',
      description: '카페24 플랫폼을 활용한 웹페이지 개발 및 커스터마이징 업무를 수행합니다.',
      requirements: '- HTML, CSS, JavaScript 능숙자\n- 카페24 쇼핑몰 솔루션 이해도 보유자 우대\n- 웹 표준 및 웹 접근성 이해',
      link: 'https://www.jobda.im/position/48087/jd',
      targetRoles: [{ targetRoleId: 'web', name: '웹 개발자' }]
    },
    {
      jobId: 'mock-3',
      title: '[윌라] QA 주니어 엔지니어',
      companyName: '(주)인플루엔셜',
      workPlace: '서울 강남구',
      deadline: '2025-12-31',
      jobSector: 'QA 엔지니어',
      description: '오디오북 서비스 윌라의 품질 향상을 위한 QA 엔지니어를 모십니다.\n주요 업무:\n- 모바일 앱/웹 서비스 기능 테스트 및 유지보수\n- 테스트 케이스 작성 및 수행\n- 버그 리포팅 및 이슈 추적',
      requirements: '- QA 관련 경력 1년 이상 또는 신입\n- 모바일 환경에 대한 이해\n- 꼼꼼하고 논리적인 사고 보유자',
      link: 'https://www.jobda.im/position/48702/jd',
      targetRoles: [{ targetRoleId: 'qa', name: 'QA 엔지니어' }]
    }
  ];

  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(null);
  const [careerGoal, setCareerGoal] = useState('');
  const [currentTab, setCurrentTab] = useState('recommend');
  const [favorites, setFavorites] = useState([]);
  const [userScore, setUserScore] = useState(null);
  const [targetScore, setTargetScore] = useState(null);
  const [roleFitData, setRoleFitData] = useState(null);
  const [improvements, setImprovements] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [selectedJobForCalendar, setSelectedJobForCalendar] = useState(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('일정이 캘린더에 저장되었습니다.');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState([]);

  useEffect(() => {
    try {
      const storedFavorites = JSON.parse(localStorage.getItem('mentoJobFavorites')) || [];
      setFavorites(storedFavorites);
    } catch (e) {
      console.error("즐겨찾기 로드 실패", e);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const userId = getUserIdFromStorage();
      if (!userId) {
        setIsLoading(false);
        return;
      }
      try {
        let targetRole = null;
        const storedUser = JSON.parse(sessionStorage.getItem('mentoUser'));
        if (storedUser?.user?.interestDomains?.[0]) {
          targetRole = storedUser.user.interestDomains[0];
        } else {
          const profileResponse = await apiClient.get(`/users/${userId}/profile`);
          if (profileResponse.data?.interestDomains?.[0]) {
            targetRole = profileResponse.data.interestDomains[0];
          }
        }
        if (targetRole) {
          setCareerGoal(targetRole);
        }
      } catch (error) {
        console.error('[ActivityRecommender] 데이터 로드 실패:', error);
      } finally {
        // 데이터 로딩은 두 번째 useEffect(fetchJobs)에서 담당하므로 여기서는 처리 안 함
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (currentTab !== 'recommend') return;
    const fetchJobs = async () => {
      const userId = getUserIdFromStorage();
      if (!userId) return;
      setIsLoading(true);
      try {
        let targetRole = null;
        const storedUser = JSON.parse(sessionStorage.getItem('mentoUser'));
        if (storedUser?.user?.interestDomains?.[0]) {
          targetRole = storedUser.user.interestDomains[0];
        } else {
          const profileResponse = await apiClient.get(`/users/${userId}/profile`);
          if (profileResponse.data?.interestDomains?.[0]) {
            targetRole = profileResponse.data.interestDomains[0];
          }
        }
        const baseParams = { targetRoleId: targetRole, page: 1, size: 100 };
        if (selectedFilters.length === 0) {
          const params = targetRole ? baseParams : { page: 1, size: 100 };
          const jobResponse = await apiClient.get('/job-postings', { params });
          if (jobResponse.data && jobResponse.data.items) {
            setActivities(jobResponse.data.items);
          } else {
            setActivities([]);
          }
          return;
        }
        let allResults = [];
        const hasHardcodedFilter = selectedFilters.some(f =>
          f.includes('웹') || f.includes('백엔드') || f.includes('서버')
        );
        if (hasHardcodedFilter) {
          allResults = [...HARDCODED_JOBS];
        }
        for (const filter of selectedFilters) {
          const filterParams = { ...baseParams, keyword: filter };
          try {
            const jobResponse = await apiClient.get('/job-postings', { params: filterParams });
            if (jobResponse.data?.items) {
              allResults.push(...jobResponse.data.items);
            }
          } catch (error) {
            console.error(`[ActivityRecommender] 필터 "${filter}" 조회 실패:`, error);
          }
        }
        const uniqueResults = Array.from(
          new Map(allResults.map(job => [job.jobId, job])).values()
        );
        setActivities(uniqueResults);
      } catch (error) {
        setActivities([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchJobs();
  }, [selectedFilters, currentTab]);

  const toggleFavorite = (e, job) => {
    e.stopPropagation();
    const isFav = favorites.some(fav => fav.jobId === job.jobId);
    let newFavorites;
    if (isFav) {
      newFavorites = favorites.filter(fav => fav.jobId !== job.jobId);
    } else {
      newFavorites = [...favorites, job];
    }
    setFavorites(newFavorites);
    localStorage.setItem('mentoJobFavorites', JSON.stringify(newFavorites));
  };

  const handleJobClick = async (job) => {
    setActiveTab(job.jobId);
    const userId = getUserIdFromStorage();
    if (!userId) return;
    setIsAnalyzing(true);
    setUserScore(null);
    setTargetScore(null);
    setImprovements([]);
    setRoleFitData(null);

    if (job.jobId.toString().startsWith('mock-')) {
      setTimeout(() => {
        let mockScore = 60;
        if (job.jobId === 'mock-1') mockScore = 48;
        else if (job.jobId === 'mock-2') mockScore = 45;
        else if (job.jobId === 'mock-3') mockScore = 49;

        let mockImprovements = [];
        if (job.jobId === 'mock-1') {
          mockImprovements = [
            { activity: { title: 'MVP/MVVM 아키텍처 디자인 패턴 학습', summary: 'KG이니시스 우대: 아키텍처 설계 및 디자인 패턴 적용 능력 함양' }, expectedScoreIncrease: 4.8 },
            { activity: { title: 'Spring Boot/JPA 기반 결제 시스템 구축 프로젝트', summary: 'KG이니시스 직무 관련: 대용량 트래픽 처리 및 결제/정산 도메인 경험' }, expectedScoreIncrease: 5.2 }
          ];
        } else if (job.jobId === 'mock-2') {
          mockImprovements = [
            { activity: { title: 'AWS/GCP 클라우드 인프라 구축 실습', summary: '카페24 우대: 클라우드 환경 개발 경험 및 인프라 이해도 증진' }, expectedScoreIncrease: 4.5 },
            { activity: { title: 'Python/Node.js 기반 백엔드 API 개발', summary: '카페24 기술 스택: Java 외 다양한 언어 활용 역량 확보' }, expectedScoreIncrease: 3.9 }
          ];
        } else if (job.jobId === 'mock-3') {
          mockImprovements = [
            { activity: { title: 'ISTQB CTFL 자격증 취득', summary: '윌라 QA 우대: 소프트웨어 테스팅 국제 자격증으로 전문성 입증' }, expectedScoreIncrease: 5.0 },
            { activity: { title: 'JIRA/Confluence 활용 테스트 케이스(TC) 작성 실습', summary: '윌라 QA 필수: 협업 도구 사용 능력 및 체계적인 TC 설계 역량 강화' }, expectedScoreIncrease: 4.1 }
          ];
        }
        const mockData = { totalScore: mockScore, improvements: mockImprovements };
        setRoleFitData(mockData);
        setUserScore(mockScore);
        setImprovements(mockData.improvements);
        setIsAnalyzing(false);
      }, 800);
      return;
    }

    try {
      const roleFitResponse = await apiClient.post(`/job-postings/${job.jobId}/score`);
      if (roleFitResponse.data) {
        setRoleFitData(roleFitResponse.data);
        setUserScore(roleFitResponse.data.totalScore);
        setTargetScore(null);
        if (roleFitResponse.data.improvements && roleFitResponse.data.improvements.length > 0) {
          setImprovements(roleFitResponse.data.improvements);
        } else {
          const targetRoleId = job.targetRoles?.[0]?.targetRoleId;
          if (targetRoleId) {
            try {
              const improvementsResponse = await apiClient.get(`/users/${userId}/improvements`, { params: { roleId: targetRoleId, size: 5 } });
              setImprovements(improvementsResponse.data || []);
            } catch (improvementsError) {
              setImprovements([]);
            }
          }
        }
      } else {
        setUserScore(null);
        setRoleFitData(null);
        setImprovements([]);
      }
    } catch (error) {
      setUserScore(null);
      setRoleFitData(null);
      setImprovements([]);
      alert(`역량 분석 중 오류가 발생했습니다: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddToCalendarRequest = (job) => {
    const strId = job.jobId ? job.jobId.toString() : '';
    // 1. Mock 공고 처리
    if (strId.startsWith('mock-')) {
      // mock-1 (KG이니시스)만 캘린더 추가 모달 표시 (나중에 가짜 성공 처리)
      if (strId === 'mock-1') {
        setSelectedJobForCalendar(job);
        setIsCalendarModalOpen(true);
        return;
      }
      // 그 외 (mock-2, mock-3 등)는 무조건 상시채용 팝업
      setSuccessMessage('상시채용입니다.');
      setIsSuccessModalOpen(true);
      return;
    }

    // 2. 일반 공고 처리
    const userId = getUserIdFromStorage();
    if (!userId) {
      alert("로그인이 필요합니다.");
      return;
    }
    setSelectedJobForCalendar(job);
    setIsCalendarModalOpen(true);
  };

  const confirmAddToCalendar = async () => {
    if (!selectedJobForCalendar) return;
    const job = selectedJobForCalendar;
    const strId = job.jobId ? job.jobId.toString() : '';

    // 1. Mock 공고 예외 처리 (안전장치 & 실제 로직)
    if (strId.startsWith('mock-')) {
      // mock-1 (KG이니시스)은 성공 메시지
      if (strId === 'mock-1') {
        setSuccessMessage('일정이 캘린더에 저장되었습니다.');
      } else {
        // 그 외에는 상시채용 메시지 (혹시라도 모달이 떴을 경우 대비)
        setSuccessMessage('상시채용입니다.');
      }
      setIsSuccessModalOpen(true);
      setIsCalendarModalOpen(false);
      setSelectedJobForCalendar(null);
      return;
    }

    try {
      const eventDate = job.deadline ? new Date(job.deadline) : new Date();
      const eventData = {
        eventType: 'JOB_POSTING',
        jobPostingId: job.jobId,
        startAt: eventDate.toISOString(),
        endAt: eventDate.toISOString(),
        alertMinutes: 1440
      };
      const userId = getUserIdFromStorage();
      await apiClient.post(`/users/${userId}/calendar/events`, eventData);
      setSuccessMessage('일정이 캘린더에 저장되었습니다.');
      setIsSuccessModalOpen(true);
    } catch (error) {
      alert(`일정 추가 중 오류가 발생했습니다: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsCalendarModalOpen(false);
      setSelectedJobForCalendar(null);
    }
  };

  const cancelAddToCalendar = () => {
    setIsCalendarModalOpen(false);
    setSelectedJobForCalendar(null);
  };

  const getDisplayList = () => {
    return currentTab === 'recommend' ? activities : favorites;
  };

  const displayList = getDisplayList();
  const findSelectedActivity = () => {
    const all = [...activities, ...favorites];
    return all.find(act => act.jobId === activeTab);
  };
  const selectedActivity = findSelectedActivity();

  return (
    <div className="page-container">
      <div style={{ padding: '0 10px 20px 10px' }}>
        <h2 style={{ margin: '0 0 10px 0' }}>
          채용 공고 목록
        </h2>
        <p style={{ color: '#666', margin: 0 }}>
          목표 직무에 맞는 공고를 선택하여 내 역량 점수를 확인해보세요.
        </p>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>공고를 불러오는 중...</div>
      ) : (
        <div className="recommender-layout" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

          {/* 왼쪽: 공고 목록 */}
          <div className="task-list-card" style={{ flex: 1, minWidth: '300px', maxHeight: '80vh', overflowY: 'auto' }}>

            {/* 상단 탭 (추천 공고 / 즐겨찾기) */}
            <div style={{ display: 'flex', borderBottom: '1px solid #ddd', marginBottom: '15px' }}>
              <button
                onClick={() => setCurrentTab('recommend')}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: currentTab === 'recommend' ? '3px solid #1976d2' : '3px solid transparent',
                  color: currentTab === 'recommend' ? '#1976d2' : '#666',
                  fontWeight: currentTab === 'recommend' ? 'bold' : 'normal',
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}
              >
                추천 공고
              </button>
              <button
                onClick={() => setCurrentTab('favorites')}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: currentTab === 'favorites' ? '3px solid #FFD700' : '3px solid transparent',
                  color: currentTab === 'favorites' ? '#FFD700' : '#666', // 활성 시 텍스트도 노란색 계열로? 가독성을 위해 검정+아이콘 강조가 나을수도. 일단 노랑/파랑 구분.
                  fontWeight: currentTab === 'favorites' ? 'bold' : 'normal',
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}
              >
                <span style={{ marginRight: '5px' }}>★</span>
                즐겨찾기
              </button>
            </div>

            {/* 필터 버튼 영역 */}
            <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 5px' }}>
              <button
                onClick={() => setIsFilterModalOpen(true)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: '1px solid #ddd',
                  backgroundColor: selectedFilters.length > 0 ? '#e3f2fd' : 'white',
                  color: selectedFilters.length > 0 ? '#1976d2' : '#555',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: selectedFilters.length > 0 ? 'bold' : 'normal'
                }}
              >
                <span>⚙️ 직무 필터</span>
                {selectedFilters.length > 0 && <span>({selectedFilters.length})</span>}
              </button>

              {selectedFilters.length > 0 && (
                <button
                  onClick={() => setSelectedFilters([])}
                  style={{ background: 'none', border: 'none', fontSize: '0.8rem', color: '#999', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  초기화
                </button>
              )}
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {displayList.map(job => {
                const isFavorite = favorites.some(fav => fav.jobId === job.jobId);
                return (
                  <li
                    key={job.jobId}
                    className={activeTab === job.jobId ? 'active' : ''}
                    onClick={() => handleJobClick(job)}
                    style={{
                      padding: '15px',
                      borderBottom: '1px solid #f1f3f4',
                      cursor: 'pointer',
                      backgroundColor: activeTab === job.jobId ? '#e8f0fe' : 'white',
                      position: 'relative' // 별 아이콘 배치를 위해
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ paddingRight: '30px' }}> {/* 별 아이콘 공간 확보 */}
                        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{job.title}</div>
                        <div style={{ fontSize: '0.9rem', color: '#555' }}>{job.companyName}</div>
                        <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '4px' }}>
                          {job.workPlace}
                          {job.deadline && ` | ~${new Date(job.deadline).toLocaleDateString()}`}
                        </div>
                      </div>
                      {/* 즐겨찾기 별 아이콘 */}
                      <button
                        onClick={(e) => toggleFavorite(e, job)}
                        style={{
                          position: 'absolute',
                          top: '15px',
                          right: '15px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '1.5rem',
                          color: isFavorite ? '#FFD700' : '#e0e0e0', // 노란색 or 밝은 회색
                          padding: 0,
                          lineHeight: 1,
                          transition: 'color 0.2s'
                        }}
                        title={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                      >
                        ★
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
            {displayList.length === 0 && (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#888' }}>
                {currentTab === 'favorites'
                  ? '즐겨찾기한 공고가 없습니다.\n마음에 드는 공고에 별표를 눌러보세요!'
                  : '표시할 공고가 없습니다.'}
              </div>
            )}
          </div>

          {/* 오른쪽: 상세 정보 및 분석 결과 */}
          <div className="activity-detail-card" style={{ flex: 2, padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}>
            {selectedActivity ? (
              <>
                <div style={{ borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ margin: '0 0 10px 0' }}>{selectedActivity.title}</h2>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#333' }}>{selectedActivity.companyName}</div>
                    <div style={{ color: '#666', marginTop: '5px' }}>
                      {selectedActivity.jobSector} | {selectedActivity.employmentType}
                    </div>
                  </div>
                  {/* 상세 뷰에서도 별 아이콘 표시 (옵션) */}
                  <button
                    onClick={(e) => toggleFavorite(e, selectedActivity)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '2rem',
                      color: favorites.some(f => f.jobId === selectedActivity.jobId) ? '#FFD700' : '#e0e0e0'
                    }}
                  >
                    ★
                  </button>
                </div>

                {/* 1. 점수 분석 섹션 */}
                <div style={{
                  marginBottom: '30px',
                  padding: '20px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px solid #dee2e6'
                }}>
                  {isAnalyzing ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <div className="spinner" style={{ display: 'inline-block', marginBottom: '10px' }}>⏳</div>
                      <div>사용자님의 역량과 공고를 분석 중입니다...</div>
                    </div>
                  ) : userScore !== null ? (
                    <div>
                      <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', borderBottom: '2px solid #007bff', paddingBottom: '8px', display: 'inline-block' }}>
                        📊 역량 분석 결과
                      </h3>

                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '20px' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '0.9rem', color: '#666' }}>나의 점수</div>
                          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#007bff' }}>{userScore.toFixed(1)}점</div>
                        </div>
                      </div>

                      {/* 3. 점수 향상을 위한 추천 활동 섹션 */}
                      {improvements.length > 0 && (
                        <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                          <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem' }}>💡 점수 향상을 위한 추천 활동</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {improvements.map((item, idx) => (
                              <div key={idx} style={{
                                padding: '12px',
                                backgroundColor: 'white',
                                border: '1px solid #e0e0e0',
                                borderRadius: '6px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}>
                                <div>
                                  <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
                                    {item.activity?.title || '추천 활동'}
                                  </div>
                                  <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '2px' }}>
                                    {item.activity?.summary ? item.activity.summary.substring(0, 60) + '...' : '이 활동을 통해 부족한 역량을 보완할 수 있습니다.'}
                                  </div>
                                </div>
                                <div style={{
                                  backgroundColor: '#e7f3ff',
                                  color: '#007bff',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '0.8rem',
                                  fontWeight: 'bold',
                                  whiteSpace: 'nowrap',
                                  marginLeft: '10px'
                                }}>
                                  +{(item.expectedScoreIncrease || item.expectedScoreDelta || 0).toFixed(1)}점
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 3. AI 질문 버튼 */}
                      <div style={{ marginTop: '20px', textAlign: 'center' }}>
                        <button
                          onClick={() => navigate('/prompt', {
                            state: {
                              initialPrompt: `"${selectedActivity.title}" 관련 공모전 추천해줘.`
                            }
                          })}
                          style={{
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                          }}
                        >
                          💬 AI에게 상세 조언 구하기
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#666' }}>
                      분석 결과를 불러오지 못했습니다.
                    </div>
                  )}
                </div>

                {/* 공고 상세 내용 */}
                <div>
                  {selectedActivity.description && (
                    <div className="activity-section">
                      <h4>상세 내용</h4>
                      <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem', lineHeight: '1.6' }}>
                        {selectedActivity.description}
                      </p>
                    </div>
                  )}

                  {selectedActivity.requirements && (
                    <div className="activity-section">
                      <h4>자격 요건</h4>
                      <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem', lineHeight: '1.6' }}>
                        {selectedActivity.requirements}
                      </p>
                    </div>
                  )}

                  {selectedActivity.link && (
                    <div className="activity-links" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                      <a href={selectedActivity.link} target="_blank" rel="noopener noreferrer" style={{ flex: 1 }}>
                        <button style={{ width: '100%', padding: '12px', cursor: 'pointer', backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: '4px' }}>공고 원문 보기</button>
                      </a>
                      {['mock-2', 'mock-3'].includes(selectedActivity.jobId) ? (
                        <button
                          disabled
                          style={{
                            flex: 1,
                            padding: '12px',
                            cursor: 'not-allowed',
                            backgroundColor: '#f5f5f5',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            color: '#999',
                            fontWeight: 'bold'
                          }}
                        >
                          상시채용입니다
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAddToCalendarRequest(selectedActivity)}
                          style={{
                            flex: 1,
                            padding: '12px',
                            cursor: 'pointer',
                            backgroundColor: '#e3f2fd',
                            border: '1px solid #90caf9',
                            borderRadius: '4px',
                            color: '#1976d2',
                            fontWeight: 'bold'
                          }}
                        >
                          📅 일정에 추가하기
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#888' }}>
                왼쪽 목록에서 공고를 선택하여<br />역량 분석과 추천 활동을 확인하세요.
              </div>
            )}

          </div>
        </div>
      )}

      {/* 캘린더 추가 확인 모달 */}
      <Modal
        isOpen={isCalendarModalOpen}
        title="캘린더 일정 추가"
        message={`'${selectedJobForCalendar?.title}' 공고를 캘린더에 추가하시겠습니까?`}
        onConfirm={confirmAddToCalendar}
        onCancel={cancelAddToCalendar}
        confirmText="추가"
        cancelText="취소"
      />

      {/* 일정 추가 성공 알림 모달 (취소 버튼 없음) */}
      <Modal
        isOpen={isSuccessModalOpen}
        title="알림"
        message="일정이 캘린더에 저장되었습니다."
        onConfirm={() => setIsSuccessModalOpen(false)}
        onCancel={() => setIsSuccessModalOpen(false)}
        confirmText="확인"
        cancelText={null} // 취소 버튼 숨김
      />

      {/* 직무 필터 모달 */}
      <JobFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApply={(filters) => setSelectedFilters(filters)}
        initialSelected={selectedFilters}
      />


    </div >
  );
}

export default ActivityRecommender;
