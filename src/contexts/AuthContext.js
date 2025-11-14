// src/contexts/AuthContext.js
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  loginWithGoogle,
  checkCurrentUser,
  getUserProfile,
} from "../api/auth";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { user: {...}, tokens: {...}, ... }
  const [loading, setLoading] = useState(true); // 앱 시작 시 auth 확인 로딩

  // 세션 스토리지 키 통일
  const STORAGE_KEY = "mentoUser";

  /**
   * Google 로그인 후 백엔드 연동 + 세션 저장
   * @param {object} googleTokenResponse - @react-oauth/google 에서 온 tokenResponse
   */
  const login = useCallback(async (googleTokenResponse) => {
    try {
      console.log("[AuthContext/login] tokenResponse:", googleTokenResponse);

      // 1) Google userinfo 가져오기
      const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: {
          Authorization: `Bearer ${googleTokenResponse.access_token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch Google userinfo");
      }

      const googleUser = await res.json();
      console.log("[AuthContext/login] googleUser:", googleUser);

      const { sub, email, name, picture } = googleUser;

      // 2) 백엔드에 로그인 요청 (회원가입 + 로그인)
      const backendRes = await loginWithGoogle({
        providerUserId: sub,
        email,
        name,
        profileImageUrl: picture,
      });

      if (!backendRes.success) {
        console.error(
          "[AuthContext/login] loginWithGoogle 실패:",
          backendRes.error
        );
        throw new Error("loginWithGoogle API failed");
      }

      // backendRes.data 형식 예: { user: {...}, tokens: { accessToken, refreshToken } }
      console.log("[AuthContext/login] backend /users 응답:", backendRes.data);

      const baseData = backendRes.data;

      // 3) 프로필 존재 여부 확인
      const profileRes = await getUserProfile();
      console.log("[AuthContext/login] getUserProfile:", profileRes);

      const profileComplete = profileRes.success && !profileRes.isNewUser;

      // 4) 최종 user 데이터 구성
      const finalUserData = {
        ...baseData,
        user: {
          ...baseData.user,
          profileComplete,
        },
      };

      // 5) 상태 + 세션 저장
      setUser(finalUserData);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(finalUserData));
    } catch (error) {
      console.error("[AuthContext/login] 전체 로그인 플로우 실패:", error);
      setUser(null);
      sessionStorage.removeItem(STORAGE_KEY);
      throw error;
    }
  }, []);

  /**
   * 로그아웃: 상태 + 세션 초기화
   */
  const logout = useCallback(() => {
    console.log("[AuthContext/logout] 로그아웃");
    setUser(null);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  /**
   * 프로필 작성 완료 후, user 상태의 profileComplete 플래그만 true로 갱신
   */
  const completeProfile = useCallback(() => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        user: {
          ...prev.user,
          profileComplete: true,
        },
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  /**
   * 앱 시작 / 새로고침 시 세션에서 유저 정보 복원
   */
  const verifyUser = useCallback(async () => {
    setLoading(true);

    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (!stored) {
        console.log("[AuthContext/verifyUser] 저장된 세션 없음");
        setUser(null);
        setLoading(false);
        return;
      }

      const storedUser = JSON.parse(stored);
      console.log("[AuthContext/verifyUser] 저장된 세션 발견:", storedUser);

      // accessToken이 실제로 유효한지 백엔드에 검증 시도
      const meRes = await checkCurrentUser();
      if (!meRes.success) {
        // 여기서 바로 로그아웃 시키면 새로고침 때마다 풀려서,
        // 일단은 "경고만 찍고 기존 토큰 유지" 방식으로 동작
        console.warn(
          "[AuthContext/verifyUser] /auth/me 실패, 기존 세션으로 계속 진행:",
          meRes.error
        );
        setUser(storedUser);
        setLoading(false);
        return;
      }

      // meRes.data 에는 최소한 현재 사용자 기본 정보가 들어있다고 가정
      const me = meRes.data;

      // 프로필 확인 (있으면 완료, 없으면 isNewUser = true 라고 가정)
      const profileRes = await getUserProfile();
      const profileComplete =
        profileRes.success && profileRes.isNewUser === false;

      const finalUserData = {
        user: {
          ...storedUser.user,
          ...me, // 백엔드에서 최신 정보가 온다면 덮어쓰기
          profileComplete,
        },
        tokens: storedUser.tokens, // 토큰은 기존 저장된 것 사용
      };

      setUser(finalUserData);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(finalUserData));
    } catch (error) {
      console.error("[AuthContext/verifyUser] 토큰 검증 중 에러:", error);
      setUser(null);
      sessionStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    verifyUser();
  }, [verifyUser]);

  const value = {
    user,
    loading, // 🔥 반드시 context에 넣어줘야 PrivateRoute/PublicRoute에서 사용 가능
    login,
    logout,
    completeProfile,
    profileComplete: user?.user?.profileComplete ?? false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
