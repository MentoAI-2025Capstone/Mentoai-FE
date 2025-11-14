// src/api/auth.js
import apiClient from "./apiClient"; // ✅ 여기 경로/파일명은 프로젝트에 맞게 수정

/**
 * Google 로그인 후 백엔드에 사용자 정보 전달
 * body 예시:
 * {
 *   providerUserId: string,
 *   email: string,
 *   name: string,
 *   profileImageUrl: string,
 *   authProvider: 'GOOGLE'
 * }
 */
export const loginWithGoogle = async (googleUserData) => {
  try {
    const payload = {
      ...googleUserData,
      authProvider: "GOOGLE",
    };

    const response = await apiClient.post("/users", payload);

    // 기대 응답: { user: {...}, tokens: { accessToken, refreshToken } }
    return { success: true, data: response.data };
  } catch (error) {
    console.error("[api/auth] POST /users 로그인 실패:", error.response || error);
    return { success: false, data: null, error };
  }
};

/**
 * 현재 유저 정보 확인
 * - Authorization 헤더로 accessToken이 붙어 있어야 함
 * - 성공 시 { id, email, name, ... } 형태라고 가정
 */
export const checkCurrentUser = async () => {
  try {
    const response = await apiClient.get("/auth/me");
    return { success: true, data: response.data };
  } catch (error) {
    console.warn("[api/auth] GET /auth/me 실패:", error.response || error);
    return { success: false, data: null, error };
  }
};

/**
 * 프로필 존재 여부 확인
 * - 예: GET /users/profile
 *   응답 예시: { isNewUser: true } 또는 { isNewUser: false, ... }
 */
export const getUserProfile = async () => {
  try {
    const response = await apiClient.get("/users/profile");
    // 응답 예: { isNewUser: true/false, ... }
    return {
      success: true,
      isNewUser: response.data.isNewUser,
      data: response.data,
    };
  } catch (error) {
    console.warn("[api/auth] GET /users/profile 실패:", error.response || error);
    return { success: false, isNewUser: true, data: null, error };
  }
};