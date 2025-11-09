// src/api/authApi.js

// Google 로그인 성공 후, 백엔드와 통신을 흉내 내는 함수
export const loginWithGoogle = async (credential) => {
  console.log("가짜 백엔드로 Google Credential 전송:", credential);

  // 1.5초 후, 백엔드가 응답한 것처럼 가짜 데이터를 반환합니다.
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        success: true,
        data: {
          userId: "12345-abcde",
          name: "오민석",
          isNewUser: true, // 신규 유저라고 가정
          accessToken: "가짜-JWT-토큰-입니다"
        }
      });
    }, 1500);
  });
};

// 프로필 설정 정보를 백엔드에 저장하는 척하는 가짜 API 함수
export const saveUserProfile = async (profileData) => {
  console.log("가짜 백엔드로 전송할 프로필 데이터:", profileData);
  
  // 1.5초간 저장 시간을 흉내 냅니다.
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        success: true,
        data: {
          ...profileData,
          userId: "12345-abcde",
          message: "프로필이 성공적으로 저장되었습니다."
        }
      });
    }, 1500);
  });
};
