// src/pages/PromptInput.js

import React, { useState, useRef, useEffect } from 'react';
import styles from './PromptInput.module.css';
import { checkGuardrails } from '../utils/guardrails';
import apiClient from '../api/apiClient'; // [신규] apiClient 임포트

// [신규] sessionStorage에서 userId를 가져오는 헬퍼
const getUserIdFromStorage = () => {
  try {
    const storedUser = JSON.parse(sessionStorage.getItem('mentoUser'));
    return storedUser ? storedUser.user.userId : null;
  } catch (e) {
    return null;
  }
};

// [삭제] 가짜 AI 응답 데이터 (sampleResults)

// [삭제] 가짜 채팅 히스토리 데이터
// const mockChatHistory = [ ... ];

function PromptInput() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [messages, setMessages] = useState([
    { role: 'ai', content: '안녕하세요! AI 멘토입니다. 진로 설계에 대해 무엇이든 물어보세요.' }
  ]);

  // [수정] 기본 채팅방 삭제
  const [chatHistory, setChatHistory] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);

  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // [수정] 백엔드 API 연동
  const handleRecommend = async () => {
    if (isLoading || !prompt.trim()) return;

    const guardrailResult = checkGuardrails(prompt);
    if (!guardrailResult.isSafe) {
      alert(guardrailResult.message);
      return;
    }

    // 1. 사용자 메시지 UI에 즉시 추가
    setMessages(prev => [...prev, { role: 'user', content: prompt }]);
    const currentPrompt = prompt; // state가 비동기로 비워지기 전, 현재 프롬프트를 변수에 저장
    setPrompt(''); 
    setIsLoading(true);

    try {
      const userId = getUserIdFromStorage();
      if (!userId) {
        throw new Error("사용자 ID를 찾을 수 없습니다. (sessionStorage)");
      }

      // 2. API 요청 객체 생성 (API 명세서 RecommendRequest 참고)
      const requestBody = {
        userId: userId,
        query: currentPrompt,
        useProfileHints: true // 사용자 프로필 반영
      };

      // 3. API 호출
      const response = await apiClient.post('/recommend', requestBody);

      // 4. API 응답 처리 (API 명세서 RecommendResponse 참고)
      // [수정] API 명세서의 Tag 객체 스키마를 다시 확인 (tags가 객체 배열이 아닐 수 있음)
      if (response.data && response.data.items && response.data.items.length > 0) {
        
        const aiResponses = response.data.items.map(item => {
          let tags = [];
          // [수정] item.activity.tags가 문자열 배열인지 객체 배열인지 확인
          if (item.activity.tags && item.activity.tags.length > 0) {
            if (typeof item.activity.tags[0] === 'string') {
              tags = item.activity.tags; // 문자열 배열인 경우
            } else if (typeof item.activity.tags[0] === 'object' && item.activity.tags[0].tagName) {
              tags = item.activity.tags.map(tag => tag.tagName); // 객체 배열인 경우
            }
          }

          return {
            role: 'ai',
            content: item.reason || item.activity.summary, // LLM 요약(reason)을 우선 사용
            title: item.activity.title,
            tags: tags
          };
        });
        
        setMessages(prev => [...prev, ...aiResponses]);

      } else {
        // 추천 결과가 없는 경우
        setMessages(prev => [
          ...prev, 
          { role: 'ai', content: '관련 활동을 찾지 못했습니다. 질문을 조금 더 구체적으로 해주시겠어요?' }
        ]);
      }

    } catch (error) {
      console.error("AI 추천 API 호출 실패:", error);
      setMessages(prev => [
        ...prev, 
        { role: 'ai', content: `오류가 발생했습니다: ${error.message}` }
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleNewChat = () => {
    // [수정] ID 생성 방식 변경 (임시)
    const newId = (chatHistory.length > 0 ? Math.max(...chatHistory.map(c => c.id)) : 0) + 1;
    setChatHistory(prev => [...prev, { id: newId, title: '새 채팅' }]);
    setActiveChatId(newId);
    setMessages([
      { role: 'ai', content: '새 채팅을 시작합니다. 무엇을 도와드릴까요?' }
    ]);
  };

  return (
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
                  {/* [오타 수정] className.dot -> className={styles.dot} */}
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