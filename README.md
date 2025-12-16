# Mento AI (멘토 AI)

Mento AI는 사용자의 역량을 분석하고 커리어 개발을 위한 맞춤형 활동을 추천해주는 AI 멘토링 플랫폼입니다.

## 🚀 주요 기능 (Features)

*   **대시보드 (Dashboard)**: 사용자의 기술 역량, 자격, 관련 경험, 학력/전공 점수를 시각적으로 분석(Radar Chart)하여 보여줍니다.
*   **활동 추천 (Activity Recommender)**: 사용자의 현재 상태와 목표에 맞춰 필요한 활동을 추천합니다.
*   **AI 멘토링 (AI Mentoring)**: 사용자가 입력한 프롬프트를 기반으로 AI 멘토가 조언을 제공합니다.
*   **구글 로그인 (Google Login)**: 간편하고 안전한 구글 OAuth 인증을 지원합니다.

## 🛠 기술 스택 (Tech Stack)

*   Frontend: React (v19), React Router (v7)
*   Visualization: Recharts
*   HTTP Client: Axios
*   Authentication: @react-oauth/google
*   Testing: Jest, React Testing Library

## 📦 설치 및 실행 (Installation & Getting Started)

이 프로젝트는 [Create React App](https://github.com/facebook/create-react-app)을 기반으로 생성되었습니다.

### 1. 저장소 클론 (Clone Repository)

```bash
git clone [repository-url]
cd Mentoai-FE
```

### 2. 패키지 설치 (Install Dependencies)

```bash
npm install
```

### 3. 개발 서버 실행 (Run Development Server)

```bash
npm start
```
앱이 개발 모드에서 실행됩니다.\
[http://localhost:3000](http://localhost:3000)을 열어 브라우저에서 확인하세요.

코드를 수정하면 페이지가 자동으로 새로고침됩니다.

### 4. 빌드 (Build)

```bash
npm run build
```
프로덕션 배포를 위해 앱을 빌드합니다.\
`build` 폴더에 최적화된 파일이 생성됩니다.

## 📂 프로젝트 구조 (Project Structure)

```
mento-ai/
├── public/
├── src/
│   ├── api/            # API 통신 관련 로직
│   ├── components/     # 재사용 가능한 UI 컴포넌트
│   ├── pages/          # 주요 페이지 (Dashboard, ActivityRecommender 등)
│   ├── App.js          # 메인 앱 컴포넌트 & 라우팅
│   └── index.js        # 진입점 (Entry Point)
└── package.json
```
