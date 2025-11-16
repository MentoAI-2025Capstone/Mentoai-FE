// src/pages/PromptInput.js

import React, { useState, useRef, useEffect } from 'react';
// [수정] Page.css 대신 PromptInput.module.css를 import
import styles from './PromptInput.module.css';
import { checkGuardrails } from '../utils/guardrails';
// import { createFinalPrompt } from '../utils/prompt-engineering'; // (API 연동 시 주석 해제)

// 가짜 AI 응답 데이터
const sampleResults = [
  {
    activityId: 1,
    title: "AI 데이터 분석 전문가 양성과정",
    summary: "Python과 머신러닝을 활용한 실전 데이터 분석 프로젝트를 경험하고, 현업 전문가의 멘토링을 받을 수 있는 기회입니다.",
    tags: ["AI", "데이터 분석", "머신러닝"],
  },
  {
    activityId: 2,
    title: "대한민국 AI 경진대회 (K-AI Challenge)",
    summary: "자연어 처리, 이미지 인식 등 다양한 AI 분야의 문제를 해결하고 자신의 실력을 증명해보세요. 수상 시 채용 연계 혜택 제공.",
    tags: ["경진대회", "자연어 처리", "포트폴리오"],
  }
];

// 가짜 채팅 히스토리 데이터
const mockChatHistory = [
  { id: 1, title: 'AI 분야 취업 스펙' },
  { id: 2, title: '3학년 여름방학 계획' },
  { id: 3, title: '데이터 분석가 로드맵' },
];

function PromptInput() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [messages, setMessages] = useState([
    { role: 'ai', content: '안녕하세요! AI 멘토입니다. 진로 설계에 대해 무엇이든 물어보세요.' }
  ]);

  const [chatHistory, setChatHistory] = useState(mockChatHistory);
  const [activeChatId, setActiveChatId] = useState(1);

  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleRecommend = () => {
    if (isLoading || !prompt.trim()) return;

    const guardrailResult = checkGuardrails(prompt);
    if (!guardrailResult.isSafe) {
      alert(guardrailResult.message);
      return;
    }

    setMessages(prev => [...prev, { role: 'user', content: prompt }]);
    setPrompt(''); 
    setIsLoading(true);

    console.log("RAG 프롬프트 생성 (시뮬레이션)");

    setTimeout(() => {
      const aiResponse = sampleResults[Math.floor(Math.random() * sampleResults.length)];
      
      setMessages(prev => [
        ...prev, 
        { 
          role: 'ai', 
          content: aiResponse.summary,
          title: aiResponse.title,
          tags: aiResponse.tags,
        }
      ]);
      setIsLoading(false);
    }, 2000);
  };
  
  const handleNewChat = () => {
    const newId = chatHistory.length + 1;
    setChatHistory(prev => [...prev, { id: newId, title: '새 채팅' }]);
    setActiveChatId(newId);
    setMessages([
      { role: 'ai', content: '새 채팅을 시작합니다. 무엇을 도와드릴까요?' }
    ]);
  };

  return (
    // [수정] className 적용
    <div className={styles.chatPageContainer}>
      <div className={styles.chatLayout}>
        
        {/* 1. 채팅 히스토리 사이드바 */}
        <div className={styles.chatHistorySidebar}>
          <button className={styles.newChatBtn} onClick={handleNewChat}>
            + 새 채팅 시작
          </button>
          <ul className={styles.chatHistoryList}>
            {chatHistory.map(chat => (
              <li 
                key={chat.id} 
                className={chat.id === activeChatId ? styles.active : ''}
                onClick={() => setActiveChatId(chat.id)}
              >
                {chat.title}
              </li>
            ))}
          </ul>
        </div>
        
        {/* 2. 메인 채팅창 */}
        <div className={styles.chatWindow}>
          
          {/* 2-1. 메시지 출력 영역 */}
          <div className={styles.chatMessagesArea}>
            {messages.map((msg, index) => (
              <div key={index} className={`${styles.chatMessage} ${styles[msg.role]}`}>
                {msg.role === 'ai' && msg.title ? (
                  <div className={styles.resultCardChat}>
                    <h4>{msg.title}</h4>
                    <p>{msg.content}</p>
                    <div className={styles.tags}>
                      {/* [수정] 공통 .tag 클래스 대신 모듈 내 .tag 사용 */}
                      {msg.tags?.map(tag => <span key={tag} className={styles.tag}>{tag}</span>)}
                    </div>
                  </div>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className={`${styles.chatMessage} ${styles.ai}`}>
                <div className={styles.spinnerDots}>
                  <div className={styles.dot}></div>
                  <div className={styles.dot}></div>
                  <div className={styles.dot}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* 2-2. 메시지 입력 영역 (Gemini 스타일) */}
          <div className={styles.chatInputArea}>
            <div className={styles.chatInputWrapper}>
              <textarea
                className={styles.chatTextarea}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="AI 멘토에게 질문을 입력하세요..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleRecommend();
                  }
                }}
                rows={1}
              />
              <button 
                className={styles.chatSendButton}
                onClick={handleRecommend} 
                disabled={isLoading || !prompt.trim()}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  width="24" 
                  height="24" 
                  className={styles.sendIcon}
                >
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2 .01 7z"></path>
                </svg>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default PromptInput;