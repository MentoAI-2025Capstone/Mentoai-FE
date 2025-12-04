// src/pages/ScheduleCalendar.js

import React, { useState, useEffect } from 'react';
// [수정] Page.css 대신 ScheduleCalendar.module.css를 import
import styles from './ScheduleCalendar.module.css';
import apiClient from '../api/apiClient';

// sessionStorage에서 userId를 가져오는 헬퍼
const getUserIdFromStorage = () => {
  try {
    const storedUser = JSON.parse(sessionStorage.getItem('mentoUser'));
    return storedUser ? storedUser.user.userId : null;
  } catch (e) {
    return null;
  }
};

const createEmptyEventForm = () => ({
  title: '',
  date: '',
  activityId: null,
  jobPostingId: null,
  eventType: 'CUSTOM'
});

function ScheduleCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState(createEmptyEventForm());
  
  // [신규] 수정/삭제할 이벤트를 추적하는 state
  const [selectedEvent, setSelectedEvent] = useState(null);

  const formatEventResponse = (eventData, fallbackTitle = '일정') => {
    if (!eventData) return null;

    const startDate = new Date(eventData.startAt);
    const dateString = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;

    const derivedTitle =
      eventData.activityTitle ||
      eventData.jobPostingTitle ||
      fallbackTitle ||
      (eventData.activityId ? `활동 #${eventData.activityId}` : '일정');

    return {
      id: eventData.eventId,
      eventId: eventData.eventId,
      date: dateString,
      title: derivedTitle,
      startAt: eventData.startAt,
      endAt: eventData.endAt,
      activityId: eventData.activityId,
      jobPostingId: eventData.jobPostingId,
      eventType: eventData.eventType
    };
  };

  // 페이지 로드 시 캘린더 이벤트를 가져오는 로직
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const userId = getUserIdFromStorage();
        if (!userId) {
          console.warn("[ScheduleCalendar] 사용자 ID를 찾을 수 없습니다.");
          setIsLoading(false);
          return;
        }

        console.log('[ScheduleCalendar] 이벤트 조회 시작...');
        
        // GET /users/{userId}/calendar/events API 호출
        // 명세서: startDate, endDate 파라미터 선택사항 (현재 월 전체 조회를 위해 생략 가능)
        const response = await apiClient.get(`/users/${userId}/calendar/events`);
        
        console.log('[ScheduleCalendar] 이벤트 응답:', response.data);
        
        if (response.data && Array.isArray(response.data)) {
          // CalendarEvent를 캘린더 표시 형식으로 변환
          const formattedEvents = response.data
            .map(event => formatEventResponse(event))
            .filter(Boolean);
          
          setEvents(formattedEvents);
          console.log('[ScheduleCalendar] ✅ 이벤트 로드 완료:', formattedEvents.length + '개');
        }
      } catch (error) {
        console.error("[ScheduleCalendar] ❌ 캘린더 이벤트 로딩 실패:", error);
        console.error("[ScheduleCalendar] 에러 상세:", error.response?.data || error.message);
        
        if (error.response?.status !== 404) {
          console.error("[ScheduleCalendar] 이벤트 로딩 중 오류:", error.message);
        }
        // 에러 시 빈 배열로 설정
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []); // 마운트 시 1회 실행

  // --- [신규] 모달 닫기 함수 ---
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
    setNewEvent(createEmptyEventForm());
  };
  
  // --- [신규] 새 활동 추가 모달 열기 ---
  const openNewEventModal = () => {
    setSelectedEvent(null); // 새 활동이므로 selectedEvent는 null
    setNewEvent(createEmptyEventForm()); // 폼 비우기
    setIsModalOpen(true);
  };

  // --- [신규] 기존 일정 클릭 시 모달 열기 ---
  const handleEventClick = (event) => {
    setSelectedEvent(event); // 클릭한 이벤트를 '선택됨'으로 설정
    setNewEvent({
      title: event.title || '',
      date: event.date || '',
      activityId: event.activityId || null,
      jobPostingId: event.jobPostingId || null,
      eventType: event.eventType || 'CUSTOM'
    }); // 폼에 내용 채우기
    setIsModalOpen(true);
  };

  // --- 캘린더 헤더 ---
  const header = () => (
    // [수정] className 적용
    <div className={styles.calendarHeader}>
      <h3 className={styles.calendarTitle}>
        {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
      </h3>
      <div className={styles.calendarNav}>
        <button className={styles.navBtn} onClick={prevMonth}>&lt; 이전 달</button>
        <button className={styles.navBtn} onClick={today}>오늘</button>
        <button className={styles.navBtn} onClick={nextMonth}>다음 달 &gt;</button>
      </div>
      <button className={styles.addEventBtn} onClick={openNewEventModal}>+ 새 활동 추가</button>
    </div>
  );

  // --- 캘린더 요일 ---
  const daysOfWeek = () => {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return (
      // [수정] className 적용
      <div className={`${styles.calendarGrid} ${styles.daysHeader}`}>
        {days.map(day => (
          <div key={day} className={styles.calendarDayHeader}>{day}</div>
        ))}
      </div>
    );
  };
  
  // [신규] ESLint (no-loop-func) 경고를 해결하기 위한 헬퍼 함수
  const getEventsForDate = (dateString) => {
    return events.filter(event => event.date === dateString);
  };

  // --- 캘린더 날짜 ---
  const cells = () => {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - monthStart.getDay());
    
    const endDate = new Date(monthEnd);
    endDate.setDate(endDate.getDate() + (6 - monthEnd.getDay()));

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const formattedDate = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
        const isCurrentMonth = day.getMonth() === currentDate.getMonth();
        const isToday = day.toDateString() === new Date().toDateString(); 

        const dayEvents = getEventsForDate(formattedDate);

        // [수정] className 적용
        const dayClasses = `
          ${styles.calendarDay} 
          ${!isCurrentMonth ? styles.otherMonth : ''} 
          ${isToday ? styles.dayToday : ''}
        `;

        days.push(
          <div
            className={dayClasses}
            key={day.toString()}
          >
            <span>{day.getDate()}</span>
            {dayEvents.map((event, index) => (
              <div 
                key={index} 
                className={styles.calendarEvent} // [수정]
                onClick={() => handleEventClick(event)}
              >
                {event.title}
              </div>
            ))}
          </div>
        );
        day.setDate(day.getDate() + 1);
      }
      rows.push(<div className={styles.calendarGrid} key={day.toString()}>{days}</div>); // [수정]
      days = [];
    }
    return <div>{rows}</div>;
  };

  // --- 월 이동 ---
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const today = () => {
    setCurrentDate(new Date());
  };

  // --- [수정] 모달 로직 (추가/수정) - API 통합 ---
  const handleAddOrUpdateEvent = async () => {
    if (!newEvent.title || !newEvent.date) {
      alert("활동 내용과 날짜를 모두 입력해주세요.");
      return;
    }

    try {
      const userId = getUserIdFromStorage();
      if (!userId) {
        throw new Error("인증 정보가 없습니다.");
      }

      const resolveEventType = () => {
        if (newEvent.activityId) return 'ACTIVITY';
        if (newEvent.jobPostingId) return 'JOB_POSTING';
        if (selectedEvent?.eventType) return selectedEvent.eventType;
        return 'CUSTOM';
      };

      const resolvedType = resolveEventType();

      const baseEventData = {
        eventType: resolvedType,
        activityId: resolvedType === 'ACTIVITY' ? (newEvent.activityId || selectedEvent?.activityId || undefined) : undefined,
        jobPostingId: resolvedType === 'JOB_POSTING' ? (newEvent.jobPostingId || selectedEvent?.jobPostingId || undefined) : undefined,
        startAt: new Date(newEvent.date).toISOString(),
        endAt: newEvent.date ? new Date(newEvent.date).toISOString() : undefined,
        alertMinutes: 1440
      };

      if (selectedEvent) {
        // '수정' 모드 - PUT /users/{userId}/calendar/events/{eventId}
        const eventData = baseEventData;

        console.log('[ScheduleCalendar] PUT payload', eventData);

        const response = await apiClient.put(
          `/users/${userId}/calendar/events/${selectedEvent.eventId}`,
          eventData
        );

        // 응답 데이터로 로컬 상태 업데이트
        if (response.data) {
          const formattedEvent = formatEventResponse(response.data, newEvent.title || selectedEvent.title);
          
          setEvents(prevEvents => prevEvents.map(ev => 
            ev.id === selectedEvent.id ? formattedEvent : ev
          ));
        }
      } else {
        // '추가' 모드 - POST /users/{userId}/calendar/events
        const eventData = baseEventData;

        console.log('[ScheduleCalendar] POST payload', eventData);

        const response = await apiClient.post(
          `/users/${userId}/calendar/events`,
          eventData
        );

        // 응답에서 반환된 이벤트를 로컬 상태에 추가
        if (response.data) {
          const formattedEvent = formatEventResponse(response.data, newEvent.title);
          
          setEvents(prevEvents => [...prevEvents, formattedEvent]);
        }
      }
      
      closeModal();
    } catch (error) {
      console.error("이벤트 저장 실패:", error);
      console.error("에러 응답:", error.response?.data);
      alert(`이벤트 저장 중 오류가 발생했습니다: ${error.response?.data?.message || error.message}`);
    }
  };

  // --- [신규] 삭제 로직 - API 통합 ---
  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;

    if (window.confirm(`'${selectedEvent.title}' 일정을 삭제하시겠습니까?`)) {
      try {
        const userId = getUserIdFromStorage();
        if (!userId) {
          throw new Error("인증 정보가 없습니다.");
        }

        // DELETE /users/{userId}/calendar/events/{eventId}
        await apiClient.delete(`/users/${userId}/calendar/events/${selectedEvent.eventId}`);
        
        // 로컬 상태에서 제거
        setEvents(prevEvents => prevEvents.filter(ev => ev.id !== selectedEvent.id));
        closeModal();
      } catch (error) {
        console.error("이벤트 삭제 실패:", error);
        console.error("에러 응답:", error.response?.data);
        alert(`이벤트 삭제 중 오류가 발생했습니다: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  return (
    // [수정] 캘린더는 스크롤 불필요하므로 별도 래퍼 사용
    <div className={styles.calendarPageWrapper}>
      <div className={styles.calendarContainer}>
        {header()}
        {daysOfWeek()}
        {cells()}
      </div>

      {isModalOpen && (
        // [수정] className 적용
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3>{selectedEvent ? '활동 수정' : '새 활동 추가'}</h3>
            {/* [수정] className 적용 */}
            <div className={styles.formGroup}>
              <label>활동 내용</label>
              <input
                type="text"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              />
            </div>
            {/* [수정] className 적용 */}
            <div className={styles.formGroup}>
              <label>날짜</label>
              <input
                type="date"
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
              />
            </div>
            {/* [수정] className 적용 */}
            <div className={styles.modalActions}>
              {selectedEvent && (
                <button className={styles.btnDelete} onClick={handleDeleteEvent}>삭제하기</button>
              )}
              <button className={styles.btnCancel} onClick={closeModal}>취소</button>
              <button className={styles.btnSave} onClick={handleAddOrUpdateEvent}>
                {selectedEvent ? '저장하기' : '추가하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScheduleCalendar;