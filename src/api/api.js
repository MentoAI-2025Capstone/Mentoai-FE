// src/api/api.js
import axios from 'axios';
import apiClient from './apiClient'; // 위에서 만든 axios 인스턴스

// --- Helper Functions ---
const getAuthData = () => {
  try {
    const storedUser = JSON.parse(sessionStorage.getItem('mentoUser'));
    return { userId: storedUser ? storedUser.user.userId : null };
  } catch (e) {
    return { userId: null };
  }
};

// --- Auth APIs (로그인 관련) ---

// 1. (POST /users) : Google 정보로 백엔드 로그인/회원가입
export const loginWithGoogle = async (googleUserData) => {
  try {
    const payload = {
      authProvider: "GOOGLE",
      providerUserId: googleUserData.providerUserId, // Google 'sub'
      email: googleUserData.email,
      name: googleUserData.name,
      nickname: googleUserData.name, // [!!!] nickname 필드 추가
      profileImageUrl: googleUserData.profileImageUrl
    };
    const response = await apiClient.post('/users', payload);
    // 백엔드가 { user, tokens } 객체를 반환한다고 가정
    return { success: true, data: response.data }; 
  } catch (error) {
    console.error("POST /users 로그인 실패:", error);
    // 에러 객체에서 백엔드가 보낸 메시지를 포함하여 throw
    const message = error.response?.data?.message || "loginWithGoogle API failed";
    throw new Error(message);
  }
};

// 2. (GET /auth/me) : 페이지 새로고침 시 토큰 유효성 검사
export const checkCurrentUser = async () => {
  try {
    const response = await apiClient.get('/auth/me');
    return { success: true, data: response.data }; // User 스키마 반환
  } catch (error) {
    console.warn("GET /auth/me 실패:", error.response);
    return { success: false, data: null };
  }
};

// 3. (POST /auth/logout) : 로그아웃
export const logoutUser = async () => {
  try {
    await apiClient.post('/auth/logout', null);
    return { success: true };
  } catch (error) {
    console.error("로그아웃 실패:", error);
    return { success: false };
  }
};

// 4. (PUT /users/{userId}/profile) : 최초 프로필 설정 완료
export const saveUserProfile = async (profileData) => {
  try {
    const { userId } = getAuthData();
    if (!userId) throw new Error("User ID not found");
    const response = await apiClient.put(`/users/${userId}/profile`, profileData);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("프로필 저장 실패:", error);
    return { success: false, data: null };
  }
};

// --- App Feature APIs (기존 앱 기능) ---

// (GET /users/{userId}/profile) : 마이페이지용
export const getUserProfile = async () => {
  try {
    const { userId } = getAuthData();
    if (!userId) throw new Error("User ID not found");
    const response = await apiClient.get(`/users/${userId}/profile`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("프로필 불러오기 실패:", error);
    return { success: false, data: null };
  }
};

// (GET /users/{userId}/calendar/events)
export const getCalendarEvents = async () => {
  try {
    const { userId } = getAuthData();
    if (!userId) throw new Error("User ID not found");
    const response = await apiClient.get(`/users/${userId}/calendar/events`);
    const formattedEvents = response.data.map(event => ({
      id: event.eventId,
      title: event.activityTitle || `이벤트 #${event.eventId}`,
      date: event.startAt.split('T')[0]
    }));
    return { success: true, data: formattedEvents };
  } catch (error) {
    console.error("캘린더 일정 불러오기 실패:", error);
    return { success: true, data: [] };
  }
};

// (POST /users/{userId}/calendar/events)
export const createCalendarEvent = async (newEvent) => {
  try {
    const { userId } = getAuthData();
    if (!userId) throw new Error("User ID not found");
    const payload = {
      activityId: newEvent.activityId || 1, 
      startAt: `${newEvent.date}T00:00:00Z`
    };
    const response = await apiClient.post(`/users/${userId}/calendar/events`, payload);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("캘린더 일정 생성 실패:", error);
    return { success: false, data: null };
  }
};

// (POST /recommend)
export const getRecommendations = async (prompt) => {
  try {
    const { userId } = getAuthData();
    const payload = {
      userId: userId || null,
      query: prompt,
      useProfileHints: !!userId 
    };
    const response = await apiClient.post('/recommend', payload);
    const aiTextResponse = response.data.items
      .map(item => `**${item.activity.title}**\n${item.reason}`)
      .join('\n\n');
    return { success: true, data: aiTextResponse || "추천 결과를 찾지 못했습니다." };
  } catch (error) {
    console.error("RAG 추천 실패:", error);
    return { success: false, data: "오류가 발생했습니다." };
  }
};