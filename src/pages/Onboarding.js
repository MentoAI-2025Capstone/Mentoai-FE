import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Page.css';

const Onboarding = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/login');
  };

  return (
    <div className="onboarding-container" style={{
      display: 'flex',
      flexDirection: 'column',
      // alignItems: 'center', // Wrapper handles centering
      // justifyContent: 'center', // Removed to fix top clipping on small screens
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #ffffff, #f0f7ff)',
      padding: '40px 20px',
      textAlign: 'center',
      fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif"
    }}>
      {/* Content Wrapper for safe centering */}
      <div style={{
        width: '100%',
        maxWidth: '1000px',
        margin: 'auto', // Auto margin vertically centers content if space is available, top-aligns if overflowing
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* 1. Hero Section */}
        <div style={{ marginBottom: '60px', animation: 'fadeIn 0.8s ease-out' }}>
          <div style={{
            display: 'inline-block',
            backgroundColor: '#e3f2fd',
            color: '#1565c0',
            padding: '8px 16px',
            borderRadius: '20px',
            fontWeight: 'bold',
            fontSize: '0.9rem',
            marginBottom: '20px'
          }}>
            ✨ AI 멘토
          </div>
          <h1 style={{
            fontSize: '3.5rem',
            fontWeight: '800',
            color: '#1976d2',
            margin: '0 0 20px 0',
            letterSpacing: '-1px',
            lineHeight: '1.2'
          }}>
            MentoAI
          </h1>
          <p style={{
            fontSize: '1.2rem',
            color: '#555',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            막막한 취업 준비, 이제 AI와 함께 체계적으로 시작하세요.<br />
            직무 탐색부터 합격까지 MentoAI가 함께합니다.
          </p>
        </div>

        {/* 2. Visual Icons (Animated) */}
        <div style={{
          display: 'flex',
          gap: '40px',
          marginBottom: '60px',
          animation: 'fadeIn 1s ease-out 0.2s backwards'
        }}>
          <div className="floating-icon" style={{ fontSize: '4rem' }}>🚀</div>
          <div className="floating-icon" style={{ fontSize: '4rem', animationDelay: '0.2s' }}>🎯</div>
          <div className="floating-icon" style={{ fontSize: '4rem', animationDelay: '0.4s' }}>📊</div>
        </div>

        {/* 3. Key Features List */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '30px',
          marginBottom: '60px',
          width: '100%',
          maxWidth: '1000px',
          animation: 'fadeIn 1s ease-out 0.4s backwards'
        }}>
          <FeatureCard
            icon="🔍"
            title="맞춤 공고 추천"
            desc="나의 관심 직무에 맞는 최적의 채용 공고를 찾아드립니다."
          />
          <FeatureCard
            icon="📊"
            title="AI 역량 진단"
            desc="공고별 요구 역량과 내 스펙을 비교 분석하고, 합격 가능성을 높일 전략을 제안합니다."
          />
          <FeatureCard
            icon="🤖"
            title="1:1 AI 멘토링"
            desc="내 부족한 점을 채워줄 공모전이 궁금하다면? AI 멘토에게 언제든 조언을 구해보세요."
          />
        </div>

        {/* 4. Call to Action Button */}
        <div style={{ animation: 'fadeIn 1s ease-out 0.6s backwards' }}>
          <button
            onClick={handleStart}
            style={{
              padding: '20px 60px',
              fontSize: '1.3rem',
              fontWeight: 'bold',
              color: 'white',
              background: 'linear-gradient(90deg, #1976d2, #1565c0)',
              border: 'none',
              borderRadius: '50px',
              cursor: 'pointer',
              boxShadow: '0 10px 20px rgba(25, 118, 210, 0.3)',
              transition: 'all 0.3s ease',
              transform: 'translateY(0)'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-3px)';
              e.target.style.boxShadow = '0 15px 30px rgba(25, 118, 210, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 10px 20px rgba(25, 118, 210, 0.3)';
            }}
          >
            MentoAI 시작하기
          </button>
        </div>
      </div>

      {/* Keyframes for animations (Inline Style Tag for simplicity) */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .floating-icon {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </div>
  );
};

// Sub-component for Feature Card
const FeatureCard = ({ icon, title, desc }) => (
  <div style={{
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '20px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
    transition: 'transform 0.3s ease',
    border: '1px solid #f0f0f0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  }}
    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
  >
    <div style={{
      fontSize: '3rem',
      marginBottom: '20px',
      backgroundColor: '#f5f9ff',
      width: '80px',
      height: '80px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '50%'
    }}>
      {icon}
    </div>
    <h3 style={{ margin: '10px 0', color: '#333', fontSize: '1.4rem' }}>{title}</h3>
    <p style={{ color: '#666', fontSize: '1rem', lineHeight: '1.6', wordBreak: 'keep-all' }}>
      {desc}
    </p>
  </div>
);

export default Onboarding;
