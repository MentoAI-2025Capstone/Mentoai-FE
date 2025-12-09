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

// [주작질] 가짜 공고 데이터 정의
const FAKE_JOBS = [
  {
    jobId: 'fake-1',
    title: '금융IT 서비스 개발 및 운영',
    companyName: '하나금융티아이',
    jobSector: 'IT/보안',
    employmentType: '신입/경력',
    workPlace: '서울',
    deadline: '2025-12-31T23:59:59',
    description: '금융IT 서비스 개발 및 운영 업무를 담당합니다. (데모 데이터)',
    requirements: '관련 학과 전공자 및 동등 자격 소지자',
    link: 'https://example.com/fake-1'
  },
  {
    jobId: 'fake-2',
    title: '정보보안 담당자',
    companyName: '에스앤아이코퍼레이션',
    jobSector: '보안/정보보호',
    employmentType: '경력',
    workPlace: '서울',
    deadline: '2025-12-25T23:59:59',
    description: '정보보안 관리 체계 수립 및 운영 업무 (데모 데이터)',
    requirements: 'ISMS-P 인증 심사원 자격 보유자 우대',
    link: 'https://example.com/fake-2'
  },
  {
    jobId: 'fake-3',
    title: '경력 · IT · 정보보안 · 서울(강남)',
    companyName: '(주)비지에프',
    jobSector: 'IT 서비스',
    employmentType: '경력',
    workPlace: '서울(강남)',
    deadline: '2026-01-15T23:59:59',
    description: 'BGF리테일 그룹사 정보보안 담당 (데모 데이터)',
    requirements: '정보보안 기사 자격증 보유자 필',
    link: 'https://example.com/fake-3'
  },
  {
    jobId: 'fake-4',
    title: '정보보안 · 서울 중구',
    companyName: '신한DS',
    jobSector: '보안/금융',
    employmentType: '정규직',
    workPlace: '서울 중구',
    deadline: '2025-12-30T18:00:00',
    description: '신한금융그룹 보안 관제 및 운영 (데모 데이터)',
    requirements: '금융보안원 관련 경력자 우대',
    link: 'https://example.com/fake-4'
  }
];

function ActivityRecommender() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]); // API로 불러온 추천 공고 목록
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(null); // 선택된 공고 ID (jobId)
  const [careerGoal, setCareerGoal] = useState('');

  // 탭 상태: 'recommend' | 'favorites'
  const [currentTab, setCurrentTab] = useState('recommend');
  // 즐겨찾기 목록 (localStorage 연동)
  const [favorites, setFavorites] = useState([]);

  // 선택된 공고에 대한 분석 결과
  const [userScore, setUserScore] = useState(null);
  const [targetScore, setTargetScore] = useState(null); // 회사(공고) 요구 점수
  const [roleFitData, setRoleFitData] = useState(null);
  const [improvements, setImprovements] = useState([]); // 추천 공모전/대회

  const [isAnalyzing, setIsAnalyzing] = useState(false); // 분석 로딩 상태

  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [selectedJobForCalendar, setSelectedJobForCalendar] = useState(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false); // 성공 알림 모달 상태

  // 직무 필터 상태
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState([]);

  // 0. 즐겨찾기 초기 로드 (localStorage)
  useEffect(() => {
    try {
      const storedFavorites = JSON.parse(localStorage.getItem('mentoJobFavorites')) || [];
      setFavorites(storedFavorites);
    } catch (e) {
      console.error("즐겨찾기 로드 실패", e);
    }
  }, []);

  // 1. 초기 로드: 목표 직무 가져오기 -> 관련 공고 검색 (GET /job-postings)
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const userId = getUserIdFromStorage();
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        // 1-1. 목표 직무 가져오기
        let targetRole = null;
        const storedUser = JSON.parse(sessionStorage.getItem('mentoUser'));

        // sessionStorage 우선 확인
        if (storedUser?.user?.interestDomains?.[0]) {
          targetRole = storedUser.user.interestDomains[0];
        } else {
          // API로 확인
          const profileResponse = await apiClient.get(`/users/${userId}/profile`);
          if (profileResponse.data?.interestDomains?.[0]) {
            targetRole = profileResponse.data.interestDomains[0];
          }
        }

        if (targetRole) {
          console.log(`[ActivityRecommender] 목표 직무 '\${targetRole}' 발견. 관련 공고 조회.`);
          setCareerGoal(targetRole);

          // 1-2. 공고 검색 (GET /job-postings)
          const jobResponse = await apiClient.get('/job-postings', {
            params: {
              targetRoleId: targetRole,
              page: 1,
              size: 100
            }
          });

          console.log('[ActivityRecommender] 공고 조회 결과:', jobResponse.data);

          if (jobResponse.data && jobResponse.data.items) {
            setActivities(jobResponse.data.items);
          } else {
            setActivities([]);
          }
        } else {
          console.log('[ActivityRecommender] 목표 직무 없음.');
          // 목표 직무가 없으면 전체 공고를 보여주거나 안내 문구 표시
          const allJobsResponse = await apiClient.get('/job-postings', {
            params: { page: 1, size: 100 }
          });
          if (allJobsResponse.data && allJobsResponse.data.items) {
            setActivities(allJobsResponse.data.items);
          }
        }
      } catch (error) {
        console.error('[ActivityRecommender] 데이터 로드 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // 즐겨찾기 토글 함수
  const toggleFavorite = (e, job) => {
    e.stopPropagation(); // 카드 클릭 이벤트 전파 방지

    const isFav = favorites.some(fav => fav.jobId === job.jobId);
    let newFavorites;

    if (isFav) {
      // 삭제
      newFavorites = favorites.filter(fav => fav.jobId !== job.jobId);
    } else {
      // 추가
      newFavorites = [...favorites, job];
    }

    setFavorites(newFavorites);
    localStorage.setItem('mentoJobFavorites', JSON.stringify(newFavorites));
  };

  // 2. 공고 클릭 시: 점수 분석 및 추천 활동(Improvements) 조회
  const handleJobClick = async (job) => {
    // job: JobPostingResponse 객체
    setActiveTab(job.jobId);
    const userId = getUserIdFromStorage();
    if (!userId) return;

    setIsAnalyzing(true);
    setUserScore(null);
    setTargetScore(null);
    setImprovements([]);
    setRoleFitData(null);

    // [주작질] 가짜 공고 클릭 시 API 호출 없이 가짜 데이터 세팅
    if (job.jobId && String(job.jobId).startsWith('fake-')) {
      console.log('[ActivityRecommender] 가짜 공고 클릭 감지. API 패스.');
      setTimeout(() => {
        setUserScore(93);
        setTargetScore(90);
        setRoleFitData({
          totalScore: 93,
          breakdown: [
            { axis: '직무 연관성', score: 95 },
            { axis: '필요 역량', score: 88 }
          ],
          target: job.jobSector,
          user: '사용자'
        });
        setImprovements([
          {
            activity: { title: 'K-Shield 주니어 교육', summary: '정보보호 전문 인력 양성 과정' },
            expectedScoreDelta: 5.0
          },
          {
            activity: { title: '정보보안기사 자격증', summary: '국가기술자격' },
            expectedScoreDelta: 3.5
          }
        ]);
        setIsAnalyzing(false);
      }, 500); // 0.5초 로딩 효과
      return;
    }

    try {
      // 2-1. 공고 적합도 점수 계산
      console.log(`[ActivityRecommender] 공고 #\${job.jobId}에 대한 분석 시작`);

      const roleFitResponse = await apiClient.post(
        `/job-postings/\${job.jobId}/score`
      );

      console.log('[ActivityRecommender] 점수 계산 결과:', roleFitResponse.data);

      if (roleFitResponse.data) {
        setRoleFitData(roleFitResponse.data);
        setUserScore(roleFitResponse.data.totalScore);
        setTargetScore(90);

        if (roleFitResponse.data.improvements && roleFitResponse.data.improvements.length > 0) {
          setImprovements(roleFitResponse.data.improvements);
        } else {
          // improvements가 없으면 별도 API 호출
          const targetRoleId = job.targetRoles?.[0]?.targetRoleId;
          if (targetRoleId) {
            const improvementsResponse = await apiClient.get(
              `/users/\${userId}/improvements`,
              {
                params: {
                  roleId: targetRoleId,
                  size: 5
                }
              }
            );
            setImprovements(improvementsResponse.data || []);
          }
        }
      }

    } catch (error) {
      console.error('[ActivityRecommender] 분석 실패:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 3. 캘린더에 일정 추가 (확인 팝업 요청)
  const handleAddToCalendarRequest = (job) => {
    const userId = getUserIdFromStorage();
    if (!userId) {
      alert("로그인이 필요합니다.");
      return;
    }
    setSelectedJobForCalendar(job);
    setIsCalendarModalOpen(true);
  };

  // 3-1. 실제 캘린더 추가 로직
  const confirmAddToCalendar = async () => {
    if (!selectedJobForCalendar) return;
    const job = selectedJobForCalendar;

    try {
      const eventDate = job.deadline ? new Date(job.deadline) : new Date();

      const eventData = {
        eventType: 'JOB_POSTING',
        jobPostingId: String(job.jobId).startsWith('fake-') ? 99999 : job.jobId, // fake ID면 임의의 값 전송 (백엔드 에러 가능성 있으나 데모용으로 감수 or API가 String 처리 시 무관)
        startAt: eventDate.toISOString(),
        endAt: eventDate.toISOString(),
        alertMinutes: 1440 // 1일 전 알림
      };

      if (String(job.jobId).startsWith('fake-')) {
        // [주작질] 캘린더 추가도 그냥 성공한 척
        console.log('[ActivityRecommender] 가짜 공고 캘린더 추가 - API 패스');
        setIsSuccessModalOpen(true);
      } else {
        const userId = getUserIdFromStorage();
        await apiClient.post(`/users/\${userId}/calendar/events`, eventData);
        setIsSuccessModalOpen(true); // 성공 모달 표시
      }
    } catch (error) {
      console.error('[ActivityRecommender] 일정 추가 실패:', error);
      alert(`일정 추가 중 오류가 발생했습니다: \${error.response?.data?.message || error.message}`);
    } finally {
      setIsCalendarModalOpen(false);
      setSelectedJobForCalendar(null);
    }
  };

  const cancelAddToCalendar = () => {
    setIsCalendarModalOpen(false);
    setSelectedJobForCalendar(null);
  };

  // 표시할 목록 결정 (추천 탭 vs 즐겨찾기 탭)
  const getDisplayList = () => {
    // [주작질] 직무 필터에 '보안/정보보호'와 '금융공학'이 *모두* 있거나 선택된 경우 가짜 데이터 강제 리턴
    const hasSecurity = selectedFilters.includes('보안/정보보호');
    const hasFinance = selectedFilters.includes('금융공학');

    if (hasSecurity && hasFinance) {
      // 추천 탭일 경우에만 강제 주입 하거나, 즐겨찾기 탭에서도?
      // "공고들이 뜨도록" -> 추천 탭에 뜨는 것이 자연스러움.
      if (currentTab === 'recommend') {
        return FAKE_JOBS;
      }
    }

    // 1. 기본 리스트 선택
    let sourceList = currentTab === 'recommend' ? activities : favorites;

    // 2. 필터 적용 (일반 로직)
    if (selectedFilters.length === 0) return sourceList;

    return sourceList.filter(job => {
      const jobText = [
        job.title,
        job.jobSector,
        job.targetRoles?.map(r => r.name).join(' ')
      ].join(' ').toLowerCase();

      return selectedFilters.some(filter => jobText.includes(filter.toLowerCase()));
    });
  };

  const displayList = getDisplayList();

  // 선택된 공고 찾기 (전체 activities + favorites + FAKE_JOBS 합쳐서 검색)
  const findSelectedActivity = () => {
    const all = [...activities, ...favorites, ...FAKE_JOBS];
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

                      {/* 2. 추천 공모전/대회 섹션 */}
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
                                  +{item.expectedScoreDelta?.toFixed(1)}점
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 3. AI 질문 버튼 */}
                      <div style={{ marginTop: '20px', textAlign: 'center' }}>
                        <button
                          onClick={() => navigate('/prompt')}
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
        message={`'\${selectedJobForCalendar?.title}' 공고를 캘린더에 추가하시겠습니까?`}
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
