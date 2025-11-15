// src/apiClient.js
import axios from 'axios';

// 백엔드 서버 주소
const API_BASE_URL = 'https://mentoai.onrender.com';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false, // Bearer 토큰 방식을 사용하므로 false
  timeout: 60000 // Render.com 서버 콜드 스타트를 60초간 대기
});

// --- 1. API 요청 인터셉터 ---
// (모든 요청에 'Authorization: Bearer' 헤더 자동 추가)
apiClient.interceptors.request.use((config) => {
  try {
    const storedUser = JSON.parse(sessionStorage.getItem('mentoUser'));
    const token = storedUser ? storedUser.tokens.accessToken : null;

    if (token && !config.headers.Authorization) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (e) {
    // sessionStorage가 없거나 파싱에 실패해도 무시
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// --- 2. 401 오류 시 토큰 자동 갱신 로직 (API 명세서의 /auth/refresh) ---
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    return response; // 성공 시 그대로 반환
  },
  async (error) => {
    const originalRequest = error.config;
    
    // 401(Unauthorized) 오류이고, 재시도한 적이 없다면
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // 재시도 플래그

      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return axios(originalRequest);
        });
      }

      isRefreshing = true;

      try {
        const storedUser = JSON.parse(sessionStorage.getItem('mentoUser'));
        const refreshToken = storedUser ? storedUser.tokens.refreshToken : null;

        if (!refreshToken) throw new Error("No refresh token");

        // 갱신 API 호출 (이 요청은 인터셉터를 타지 않도록 raw axios 사용)
        const rs = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken: refreshToken 
        });

        const { accessToken, refreshToken: newRefreshToken, expiresIn } = rs.data;

        // 새 토큰 정보 업데이트
        const newTokens = { accessToken, refreshToken: newRefreshToken, expiresIn };
        const updatedUser = { ...storedUser, tokens: newTokens };
        sessionStorage.setItem('mentoUser', JSON.stringify(updatedUser));
        
        // 새 토큰으로 axios 기본 헤더 및 원본 요청 헤더 갱신
        apiClient.defaults.headers.common['Authorization'] = 'Bearer ' + accessToken;
        originalRequest.headers['Authorization'] = 'Bearer ' + accessToken;

        processQueue(null, accessToken);
        isRefreshing = false;

        // 실패했던 원본 요청 재시도
        return apiClient(originalRequest);

      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        processQueue(refreshError, null); 
        isRefreshing = false;
        
        sessionStorage.removeItem('mentoUser');
        window.location.href = '/login'; 
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;