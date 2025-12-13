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

  // 공고 관련 공모전 추천 상태
  const [recommendedContests, setRecommendedContests] = useState([]);

  // 공모전 캘린더 추가 관련 상태
  const [isContestCalendarModalOpen, setIsContestCalendarModalOpen] = useState(false);
  const [selectedContestForCalendar, setSelectedContestForCalendar] = useState(null);
  const [isLoadingContests, setIsLoadingContests] = useState(false);

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

  // 필터 변경 시 API 호출하여 필터링된 공고 가져오기
  useEffect(() => {
    // 추천 탭이 아니면 실행 안 함
    if (currentTab !== 'recommend') return;

    const fetchJobs = async () => {
      const userId = getUserIdFromStorage();
      if (!userId) return;

      setIsLoading(true);
      try {
        // 목표 직무 가져오기
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

        const baseParams = {
          targetRoleId: targetRole,
          page: 1,
          size: 100
        };

        // 필터가 없을 때는 초기 로드와 동일하게 처리
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

        // 필터가 있을 때는 필터링 처리
        const allResults = [];

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

        // 중복 제거 (jobId 기준)
        const uniqueResults = Array.from(
          new Map(allResults.map(job => [job.jobId, job])).values()
        );

        setActivities(uniqueResults);
      } catch (error) {
        console.error('[ActivityRecommender] 공고 로드 실패:', error);
        setActivities([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, [selectedFilters, currentTab]);

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
    setRecommendedContests([]);

    try {
      // 2-1. 공고 적합도 점수 계산
      console.log(`[ActivityRecommender] 공고 #${job.jobId}에 대한 분석 시작`);

      const roleFitResponse = await apiClient.post(
        `/job-postings/${job.jobId}/score`
      );

      // 2-2. 공고 관련 공모전 추천 (병렬 처리)
      const fetchContests = async () => {
        setIsLoadingContests(true);
        try {
          const targetRoleId = job.targetRoles?.[0]?.targetRoleId;
          const query = `${job.title} ${job.companyName} 관련 공모전 추천`;

          // 공고에서 스킬/키워드 추출 (jobSector, skills 등)
          const preferTags = [];
          if (job.jobSector) {
            preferTags.push(job.jobSector.toLowerCase());
          }
          // 추가 스킬이 있다면 preferTags에 추가 가능

          const requestBody = {
            userId: userId,
            query: query,
            topK: 5,
            useProfileHints: true,
            preferTags: preferTags.length > 0 ? preferTags : undefined,
            intentHint: {
              normalizedIntent: 'CONTEST',
              keywords: [],
              filter: {
                activityType: 'CONTEST',
                requiredTags: ['공모전', '대회', '해커톤']
              }
            }
          };

          console.log('[ActivityRecommender] 공모전 추천 요청:', requestBody);
          const contestResponse = await apiClient.post('/recommend', requestBody);

          if (contestResponse.data?.items) {
            setRecommendedContests(contestResponse.data.items);
            console.log('[ActivityRecommender] 공모전 추천 결과:', contestResponse.data.items);
          }
        } catch (error) {
          console.error('[ActivityRecommender] 공모전 추천 실패:', error);
        } finally {
          setIsLoadingContests(false);
        }
      };

      fetchContests();

      console.log('[ActivityRecommender] 점수 계산 결과:', roleFitResponse.data);

      if (roleFitResponse.data) {
        setRoleFitData(roleFitResponse.data);
        setUserScore(roleFitResponse.data.totalScore);
        // targetScore는 백엔드에서 제공하지 않으므로 null로 설정하거나 표시하지 않음
        setTargetScore(null);

        if (roleFitResponse.data.improvements && roleFitResponse.data.improvements.length > 0) {
          setImprovements(roleFitResponse.data.improvements);
        } else {
          // improvements가 없으면 별도 API 호출
          const targetRoleId = job.targetRoles?.[0]?.targetRoleId;
          if (targetRoleId) {
            try {
              const improvementsResponse = await apiClient.get(
                `/users/${userId}/improvements`,
                {
                  params: {
                    roleId: targetRoleId,
                    size: 5
                  }
                }
              );
              setImprovements(improvementsResponse.data || []);
            } catch (improvementsError) {
              console.warn('[ActivityRecommender] 개선 활동 조회 실패:', improvementsError);
              setImprovements([]);
            }
          }
        }
      } else {
        console.warn('[ActivityRecommender] 점수 계산 결과가 비어있습니다.');
        setUserScore(null);
        setRoleFitData(null);
        setImprovements([]);
      }

    } catch (error) {
      console.error('[ActivityRecommender] 분석 실패:', error);
      console.error('[ActivityRecommender] 에러 상세:', error.response?.data || error.message);
      // 에러 발생 시에도 분석 상태를 초기화하여 사용자에게 알림
      setUserScore(null);
      setRoleFitData(null);
      setImprovements([]);
      alert(`역량 분석 중 오류가 발생했습니다: ${error.response?.data?.message || error.message}`);
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
        jobPostingId: job.jobId,
        startAt: eventDate.toISOString(),
        endAt: eventDate.toISOString(),
        alertMinutes: 1440 // 1일 전 알림
      };

      const userId = getUserIdFromStorage();
      await apiClient.post(`/users/${userId}/calendar/events`, eventData);
      setIsSuccessModalOpen(true); // 성공 모달 표시
    } catch (error) {
      console.error('[ActivityRecommender] 일정 추가 실패:', error);
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

  // 공모전 캘린더 추가 함수
  const handleAddContestToCalendar = async (item) => {
    const userId = getUserIdFromStorage();
    if (!userId) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!item.activity || !item.activity.activityId) {
      alert('활동 정보를 찾을 수 없어 캘린더에 추가할 수 없습니다.');
      return;
    }

    // 날짜 결정: APPLY_END (마감일) 우선
    let targetDate = null;
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    if (item.activity.dates && item.activity.dates.length > 0) {
      // APPLY_END (마감일) 찾기
      const applyEnds = item.activity.dates
        .filter(d => d.dateType === 'APPLY_END')
        .map(d => new Date(d.dateValue))
        .sort((a, b) => a - b); // 가장 빠른 마감일

      if (applyEnds.length > 0) {
        targetDate = applyEnds[0];
      } else {
        // APPLY_END가 없으면 EVENT_START 사용
        const eventStarts = item.activity.dates
          .filter(d => d.dateType === 'EVENT_START')
          .map(d => new Date(d.dateValue))
          .sort((a, b) => a - b);

        if (eventStarts.length > 0) {
          targetDate = eventStarts[0];
        }
      }
    }

    // dates에서 날짜를 찾지 못한 경우
    if (!targetDate) {
      if (item.activity.publishedAt) {
        targetDate = new Date(item.activity.publishedAt);
      } else if (item.activity.createdAt) {
        targetDate = new Date(item.activity.createdAt);
      } else {
        targetDate = tomorrow;
      }
    }

    // 과거 날짜 체크
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDateOnly = new Date(targetDate);
    targetDateOnly.setHours(0, 0, 0, 0);

    if (targetDateOnly < today) {
      // 과거 날짜 경고
      setSelectedContestForCalendar({ item, targetDate });
      setIsContestCalendarModalOpen(true);
      return;
    }

    // 과거 날짜가 아니면 바로 추가
    await addContestToCalendarInternal(item, targetDate);
  };

  // 실제 공모전 캘린더 추가 로직
  const addContestToCalendarInternal = async (item, targetDate) => {
    const userId = getUserIdFromStorage();
    if (!userId) {
      alert('로그인이 필요합니다.');
      return;
    }

    const startAt = targetDate.toISOString();

    // endAt 계산: EVENT_END 또는 startAt + 2시간
    let endAt = null;
    if (item.activity.dates && item.activity.dates.length > 0) {
      const eventEnds = item.activity.dates
        .filter(d => d.dateType === 'EVENT_END')
        .map(d => new Date(d.dateValue))
        .sort((a, b) => b - a);

      if (eventEnds.length > 0) {
        endAt = eventEnds[0].toISOString();
      }
    }

    if (!endAt) {
      const endDate = new Date(targetDate);
      endDate.setHours(endDate.getHours() + 2);
      endAt = endDate.toISOString();
    }

    try {
      await apiClient.post('/recommend/calendar', {
        userId,
        activityId: item.activity.activityId,
        eventType: 'ACTIVITY',
        startAt,
        endAt,
        alertMinutes: 1440
      });
      setIsSuccessModalOpen(true);
    } catch (error) {
      console.error('[ActivityRecommender] 공모전 캘린더 추가 실패:', error);
      alert(`일정 추가 중 오류가 발생했습니다: ${error.response?.data?.message || error.message}`);
    }
  };

  const confirmAddContestToCalendar = async () => {
    if (!selectedContestForCalendar) return;
    const { item, targetDate } = selectedContestForCalendar;
    await addContestToCalendarInternal(item, targetDate);
    setIsContestCalendarModalOpen(false);
    setSelectedContestForCalendar(null);
  };

  const cancelAddContestToCalendar = () => {
    setIsContestCalendarModalOpen(false);
    setSelectedContestForCalendar(null);
  };

  // 표시할 목록 결정 (추천 탭 vs 즐겨찾기 탭)
  const getDisplayList = () => {
    // 서버에서 필터링된 결과를 받으므로 클라이언트 사이드 필터링 제거
    return currentTab === 'recommend' ? activities : favorites;
  };

  const displayList = getDisplayList();

  // 선택된 공고 찾기 (전체 activities + favorites 합쳐서 검색)
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

                      {/* 2. 공고 관련 공모전 추천 섹션 */}
                      {(isLoadingContests || recommendedContests.length > 0) && (
                        <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                          <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem' }}>🎯 이 공고에 맞는 공모전 추천</h4>
                          {isLoadingContests ? (
                            <div style={{ textAlign: 'center', padding: '10px', color: '#666' }}>
                              공모전을 찾는 중...
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              {recommendedContests.map((item, idx) => (
                                <div key={idx} style={{
                                  padding: '12px',
                                  backgroundColor: 'white',
                                  border: '1px solid #e0e0e0',
                                  borderRadius: '6px',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  gap: '10px'
                                }}>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '0.95rem', marginBottom: '4px' }}>
                                      {item.activity?.title || '추천 공모전'}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '4px' }}>
                                      {item.activity?.summary ? item.activity.summary.substring(0, 80) + '...' : ''}
                                    </div>
                                    {item.reason && (
                                      <div style={{ fontSize: '0.8rem', color: '#007bff', marginTop: '4px' }}>
                                        💡 {item.reason}
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAddContestToCalendar(item);
                                    }}
                                    style={{
                                      padding: '8px 12px',
                                      backgroundColor: '#e3f2fd',
                                      border: '1px solid #90caf9',
                                      borderRadius: '4px',
                                      color: '#1976d2',
                                      cursor: 'pointer',
                                      fontSize: '0.85rem',
                                      fontWeight: 'bold',
                                      whiteSpace: 'nowrap',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                    title="캘린더에 추가"
                                  >
                                    📅 추가
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

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

      {/* 공모전 캘린더 추가 확인 모달 (과거 날짜) */}
      <Modal
        isOpen={isContestCalendarModalOpen}
        title="알림"
        message={`이 공모전의 마감일(${selectedContestForCalendar?.targetDate?.toLocaleDateString()})이 이미 지났습니다.\n캘린더에 추가하시겠습니까?`}
        onConfirm={confirmAddContestToCalendar}
        onCancel={cancelAddContestToCalendar}
        confirmText="확인"
        cancelText="취소"
      />
    </div >
  );
}

export default ActivityRecommender;
