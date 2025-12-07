import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Page.css'; // 기본 페이지 스타일 사용 (필요시 Onboarding.css 분리)

const Onboarding = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/login');
  };

  return (
    <div className="onboarding-container" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      padding: '20px',
      textAlign: 'center'
    }}>
      {/* 1. Header / Logo Area */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          color: '#1976d2',
          margin: 0
        }}>
          MentoAI
        </h1>
        <p style={{
          fontSize: '1rem',
          color: '#666',
          marginTop: '10px'
        }}>
          AI 커리어 멘토와 함께하는 스마트한 취업 준비
        </p>
      </div>

      {/* 2. Hero Image / Visual (Placeholder) */}
      <div style={{
        marginBottom: '40px',
        maxWidth: '600px',
        width: '100%'
      }}>
        {/* 실제 이미지가 있다면 img 태그 사용, 여기서는 이모지로 대체하여 분위기 연출 */}
        <div style={{
          fontSize: '5rem',
          marginBottom: '20px'
        }}>
          🚀 🎯 📊
        </div>
      </div>

      {/* 3. Key Features List */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '50px',
        width: '100%',
        maxWidth: '900px'
      }}>
        <div className="feature-card" style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🔍</div>
          <h3 style={{ margin: '10px 0', color: '#333' }}>맞춤 공고 추천</h3>
          <p style={{ color: '#666', fontSize: '0.9rem', lineHeight: '1.5' }}>
            나의 관심 직무와 기술 스택에 딱 맞는<br />
            최적의 채용 공고를 찾아드립니다.
          </p>
        </div>

        <div className="feature-card" style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📊</div>
          <h3 style={{ margin: '10px 0', color: '#333' }}>AI 역량 진단</h3>
          <p style={{ color: '#666', fontSize: '0.9rem', lineHeight: '1.5' }}>
            공고와 나의 적합도를 AI가 분석하고,<br />
            부족한 점수를 채울 방법을 제안합니다.
          </p>
        </div>

        <div className="feature-card" style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🤖</div>
          <h3 style={{ margin: '10px 0', color: '#333' }}>1:1 AI 멘토링</h3>
          <p style={{ color: '#666', fontSize: '0.9rem', lineHeight: '1.5' }}>
            자소서 작성부터 면접 준비까지,<br />
            궁금한 점은 언제든 AI 멘토에게 물어보세요.
          </p>
        </div>
      </div>

      {/* 4. Call to Action Button */}
      <button
        onClick={handleStart}
        style={{
          padding: '16px 40px',
          fontSize: '1.2rem',
          fontWeight: 'bold',
          color: 'white',
          backgroundColor: '#1976d2',
          border: 'none',
          borderRadius: '30px',
          cursor: 'pointer',
          boxShadow: '0 4px 6px rgba(25, 118, 210, 0.3)',
          transition: 'transform 0.2s'
        }}
        onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
        onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
      >
        MentoAI 시작하기
      </button>

      {/* 5. Footer Text */}
      <p style={{
        marginTop: '20px',
        color: '#999',
        fontSize: '0.8rem'
      }}>
        이미 계정이 있으신가요? '시작하기'를 눌러 로그인하세요.
      </p>
    </div>
  );
};

export default Onboarding;
