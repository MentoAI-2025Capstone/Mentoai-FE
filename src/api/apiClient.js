// src/api/apiClient.js
import axios from 'axios';

// 백엔드 서버 주소
const API_BASE_URL = 'https://mentoai.onrender.com';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  // [수정] Bearer 토큰 방식을 사용하므로 쿠키 옵션(withCredentials)을 끕니다.
  withCredentials: false 
});

// [수정] API 요청 인터셉터 (모든 요청에 'Authorization: Bearer' 헤더 자동 추가)
apiClient.interceptors.request.use((config) => {
  try {
    const storedUser = JSON.parse(sessionStorage.getItem('mentoUser'));
    const token = storedUser ? storedUser.accessToken : null;

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (e) {
    console.warn("sessionStorage에서 사용자 정보를 가져오지 못했습니다.", e);
  }
  return config;
});

// [신규] API 응답 인터셉터 (액세스 토큰 만료 시 자동 재발급)
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

    // 401 오류(Unauthorized)가 발생했고, 아직 재발급 시도를 안했다면
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 이미 재발급 중이면, 이 요청은 대기열에 추가
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return axios(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // 1. sessionStorage에서 리프레시 토큰 가져오기
        const storedUser = JSON.parse(sessionStorage.getItem('mentoUser'));
        const refreshToken = storedUser ? storedUser.refreshToken : null;

        if (!refreshToken) throw new Error("리프레시 토큰이 없습니다.");

        // 2. /auth/refresh API 호출 (이 API는 인터셉터를 타면 안 됨)
        const rs = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken: refreshToken 
        });

        const { accessToken, refreshToken: newRefreshToken, expiresIn } = rs.data;

        // 3. 새 토큰 정보 저장
        const newExpiresAt = new Date().getTime() + parseInt(expiresIn) * 1000;
        const updatedUser = {
          ...storedUser,
          accessToken: accessToken,
          refreshToken: newRefreshToken, // (새 리프레시 토큰을 준다면 갱신)
          expiresAt: newExpiresAt
        };
        sessionStorage.setItem('mentoUser', JSON.stringify(updatedUser));
        
        // 4. 새 토큰으로 axios 기본 헤더 및 원본 요청 헤더 갱신
        apiClient.defaults.headers.common['Authorization'] = 'Bearer ' + accessToken;
        originalRequest.headers['Authorization'] = 'Bearer ' + accessToken;

        // 5. 대기열에 있던 요청들 모두 처리
        processQueue(null, accessToken);
        isRefreshing = false;

        // 6. 실패했던 원본 요청 재시도
        return apiClient(originalRequest);

      } catch (err) {
        // 리프레시 실패 (리프레시 토큰 만료 등)
        processQueue(err, null);
        isRefreshing = false;
        
        // AuthContext에서 로그아웃 처리를 하도록 이벤트를 보내거나,
        // 강제로 로그아웃 시킵니다.
        sessionStorage.removeItem('mentoUser');
        window.location.href = '/login'; // 강제 로그아웃
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;