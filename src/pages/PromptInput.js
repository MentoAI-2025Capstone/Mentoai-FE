// src/pages/PromptInput.js

import React, { useState, useRef, useEffect } from 'react';
import styles from './PromptInput.module.css';
import { checkGuardrails } from '../utils/guardrails';
import apiClient from '../api/apiClient';

// sessionStorage에서 userId를 가져오는 헬퍼
const getUserIdFromStorage = () => {
  try {
    const storedUser = JSON.parse(sessionStorage.getItem('mentoUser'));
    return storedUser ? storedUser.user.userId : null;
  } catch (e) {
    return null;
  }
};

// JSON 코드 블록 제거 함수
const cleanContent = (text) => {
  if (!text) return '';
  // ```json ... ``` 또는 ``` ... ``` 제거
  return text.replace(/```json\s*([\s\S]*?)\s*```/g, '$1')
    .replace(/```\s*([\s\S]*?)\s*```/g, '$1')
    .trim();
};

// 추천 결과 리스트 컴포넌트 (아코디언)
const RecommendationList = ({ items, onAddToCalendar }) => {
  return (
    <div className={styles.recommendationList}>
      {items.map((item, idx) => (
        <RecommendationItem
          key={idx}
          item={item}
          onAddToCalendar={onAddToCalendar}
        />
      ))}
    </div>
  );
};

const RecommendationItem = ({ item, onAddToCalendar }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleAddClick = (e) => {
    e.stopPropagation(); // 아코디언 토글 방지
    onAddToCalendar(item);
  };

  // 태그 처리
  let tags = [];
  if (item.activity && item.activity.tags) {
    tags = item.activity.tags.map(t => (typeof t === 'string' ? t : t.tagName));
  } else if (item.tags) {
    tags = item.tags;
  }

  // 제목 처리 (activity.title이 없으면 reason의 첫 문장이나 기본값 사용)
  const title = item.activity?.title || item.title || `추천 활동 #${item.activityIndex || '?'}`;
  const content = item.reason || item.activity?.summary || item.content;

  return (
    <div className={styles.recommendationItem}>
      {/* 헤더: 제목 + 추가 버튼 */}
      <div className={styles.itemHeader} onClick={toggleExpand}>
        <div className={styles.itemTitle} title={title}>
          {title}
        </div>
        <button className={styles.addButton} onClick={handleAddClick}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
            <line x1="12" y1="14" x2="12" y2="18"></line>
            <line x1="10" y1="16" x2="14" y2="16"></line>
          </svg>
          추가
        </button>
      </div>

      {/* 상세 내용 (확장 시 표시) */}
      {isExpanded && (
        <div className={styles.itemDetail}>
          <div className={styles.detailContent}>
            {content}
          </div>
          {tags.length > 0 && (
            <div className={styles.detailTags}>
              {tags.map((tag, idx) => (
                <span key={idx} className={styles.detailTag}>#{tag}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

function PromptInput() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [messages, setMessages] = useState([
    { role: 'ai', content: '안녕하세요! AI 멘토입니다. 진로 설계에 대해 무엇이든 물어보세요.' }
  ]);

  // 채팅 히스토리 (백엔드 연동)
  const [chatHistory, setChatHistory] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null); // logId

  const messagesEndRef = useRef(null);
  const messagesAreaRef = useRef(null);
  const prevMessagesLength = useRef(0);

  const scrollToBottom = () => {
    if (messagesAreaRef.current) {
      messagesAreaRef.current.scrollTop = messagesAreaRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      scrollToBottom();
    }
    prevMessagesLength.current = messages.length;
  }, [messages]);

  // 1. 초기 히스토리 로드 (GET /recommend/chats)
  useEffect(() => {
    const fetchHistory = async () => {
      console.log('[PromptInput] 초기 히스토리 로드 시작...');
      try {
        const response = await apiClient.get('/recommend/chats');
        console.log('[PromptInput] 히스토리 응답:', response.data);
        if (Array.isArray(response.data)) {
          // 날짜 내림차순 정렬
          const sorted = response.data.sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
          );
          setChatHistory(sorted);
          console.log('[PromptInput] ✅ 히스토리 로드 완료:', sorted.length + '개');
        }
      } catch (error) {
        console.error('[PromptInput] ❌ 히스토리 로드 실패:', error);
        console.error('[PromptInput] 에러 상세:', error.response?.data || error.message);
      }
    };
    fetchHistory();
  }, []);

  // 캘린더 추가 핸들러
  const handleAddToCalendar = async (item) => {
    const userId = getUserIdFromStorage();
    if (!userId) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (!item.activity || !item.activity.activityId) {
      alert("활동 정보를 찾을 수 없어 캘린더에 추가할 수 없습니다.");
      return;
    }

    // 날짜 결정 로직: APPLY_END -> EVENT_START -> 현재 시간
    let targetDate = new Date();
    if (item.activity.dates && item.activity.dates.length > 0) {
      const applyEnd = item.activity.dates.find(d => d.dateType === 'APPLY_END');
      const eventStart = item.activity.dates.find(d => d.dateType === 'EVENT_START');

      if (applyEnd) targetDate = new Date(applyEnd.dateValue);
      else if (eventStart) targetDate = new Date(eventStart.dateValue);
    }

    // ISO String 변환
    const startAt = targetDate.toISOString();

    try {
      await apiClient.post(`/users/${userId}/calendar/events`, {
        activityId: item.activity.activityId,
        startAt: startAt,
        alertMinutes: 1440 // 1일 전 알림 기본값
      });
      alert(`"${item.activity.title}" 일정이 캘린더에 추가되었습니다.`);
    } catch (error) {
      console.error("캘린더 추가 실패:", error);
      alert("캘린더 추가에 실패했습니다.");
    }
  };

  // 2. 히스토리 클릭 시 상세 로드 (GET /recommend/chats/{logId})
  const handleLoadChat = async (logId) => {
    if (activeChatId === logId) return;
    setActiveChatId(logId);
    setIsLoading(true);

    try {
      const response = await apiClient.get(`/recommend/chats/${logId}`);
      const logDetail = response.data;
      console.log('[PromptInput] 상세 로그 로드:', logDetail);

      const loadedMessages = [];

      // 사용자 질문
      if (logDetail.userQuery) {
        loadedMessages.push({ role: 'user', content: logDetail.userQuery });
      }

      // AI 응답
      if (logDetail.geminiResponse) {
        // 텍스트 응답 (JSON이면 정제)
        const cleanedContent = cleanContent(logDetail.geminiResponse);
        if (cleanedContent) {
          loadedMessages.push({ role: 'ai', content: cleanedContent });
        }

        // 추천 아이템이 있으면 리스트 형태로 추가
        if (logDetail.responsePayload && logDetail.responsePayload.items) {
          loadedMessages.push({
            role: 'ai',
            type: 'recommendation_list',
            items: logDetail.responsePayload.items
          });
        }
      }

      setMessages(loadedMessages);

    } catch (error) {
      console.error('[PromptInput] 상세 로그 로드 실패:', error);
      // 실패 시 초기화 안함 (이전 메시지 유지)
    } finally {
      setIsLoading(false);
    }
  };

  // 3. 새 채팅 시작
  const handleNewChat = () => {
    console.log('[PromptInput] 새 채팅 시작');
    setActiveChatId(null);
    setMessages([
      { role: 'ai', content: '새로운 대화를 시작합니다. 무엇을 도와드릴까요?' }
    ]);
  };

  const handleRecommend = async () => {
    if (isLoading || !prompt.trim()) return;

    const guardrailResult = checkGuardrails(prompt);
    if (!guardrailResult.isSafe) {
      alert(guardrailResult.message);
      return;
    }

    // 새 메시지 추가 (낙관적 업데이트)
    setMessages(prev => [...prev, { role: 'user', content: prompt }]);
    const currentPrompt = prompt;
    setPrompt('');
    setIsLoading(true);

    console.log('[PromptInput] ===== 추천 요청 시작 =====');
    console.log('[PromptInput] 사용자 질문:', currentPrompt);

    try {
      const userId = getUserIdFromStorage();
      if (!userId) {
        throw new Error("로그인이 필요합니다.");
      }

      const requestBody = {
        userId: userId,
        query: currentPrompt,
        topK: 5,
        useProfileHints: true
      };

      console.log('[PromptInput] 요청 데이터:', requestBody);

      // POST /recommend 호출
      const response = await apiClient.post('/recommend', requestBody);
      console.log('[PromptInput] ✅ 응답 성공:', response.data);

      // 응답 처리
      const newAiMessages = [];

      // 1. 텍스트 응답이 있으면 추가 (단, JSON만 있는 경우는 제외하고 싶을 수 있음. 
      //    하지만 보통 서론이 있으므로 정제해서 보여줌)
      //    만약 응답 전체가 JSON이라면 cleanContent가 빈 문자열을 반환할 수도 있음.
      //    여기서는 "추천 결과입니다" 같은 멘트가 있을 수 있으니 일단 추가.
      //    (사용자 요청: "저런 코드 같은거 안뜨게하고")

      // items가 있으면 텍스트 메시지는 생략하거나 간단히 표시? 
      // -> 일단 텍스트도 보여주되 JSON은 제거.

      // 2. 추천 아이템 리스트 그룹화
      if (response.data && response.data.items && response.data.items.length > 0) {
        console.log('[PromptInput] 추천 아이템 개수:', response.data.items.length);
        newAiMessages.push({
          role: 'ai',
          type: 'recommendation_list',
          items: response.data.items
        });
      } else {
        console.log('[PromptInput] ⚠️ 추천 결과 없음');
        newAiMessages.push({
          role: 'ai',
          content: '관련된 추천 활동을 찾지 못했습니다. 조금 더 구체적으로 질문해 주세요.'
        });
      }

      setMessages(prev => [...prev, ...newAiMessages]);

      // 4. 채팅 후 히스토리 갱신 (약간의 딜레이 후 재조회)
      console.log('[PromptInput] 히스토리 갱신 대기 중...');
      setTimeout(async () => {
        try {
          console.log('[PromptInput] 히스토리 재조회 시작...');
          const historyResponse = await apiClient.get('/recommend/chats');
          if (Array.isArray(historyResponse.data)) {
            const sorted = historyResponse.data.sort((a, b) =>
              new Date(b.createdAt) - new Date(a.createdAt)
            );
            setChatHistory(sorted);
            console.log('[PromptInput] ✅ 히스토리 갱신 완료:', sorted.length + '개');

            // 방금 생성된 로그를 활성화 (새 채팅이었던 경우)
            if (sorted.length > 0 && !activeChatId) {
              setActiveChatId(sorted[0].logId);
              console.log('[PromptInput] 새 채팅 활성화:', sorted[0].logId);
            }
          }
        } catch (histError) {
          console.error('[PromptInput] ❌ 히스토리 갱신 실패:', histError);
        }
      }, 1000); // 1초 대기 (백엔드 저장 시간 고려)

    } catch (error) {
      console.error('[PromptInput] ❌ 추천 요청 실패:', error);
      console.error('[PromptInput] 에러 상세:', error.response?.data || error.message);

      setMessages(prev => [
        ...prev,
        { role: 'ai', content: `오류가 발생했습니다: ${error.response?.data?.message || error.message}` }
      ]);

      // 사용자에게 알림
      alert(`추천 요청 실패: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
      console.log('[PromptInput] ===== 요청 종료 =====');
    }
  };

  return (
    <div className={styles.chatPageContainer}>
      <div className={styles.chatLayout}>

        {/* 1. 채팅 히스토리 사이드바 */}
        <div className={styles.chatHistorySidebar}>
          <button className={styles.newChatBtn} onClick={handleNewChat}>
            + 새 채팅
          </button>
          <div className={styles.historyListContainer} style={{ overflowY: 'auto', flex: 1 }}>
            <ul className={styles.chatHistoryList}>
              {chatHistory.map(chat => (
                <li
                  key={chat.logId}
                  className={chat.logId === activeChatId ? styles.active : ''}
                  onClick={() => handleLoadChat(chat.logId)}
                >
                  {/* 제목은 userQuery를 잘라서 표시 */}
                  <span title={chat.userQuery}>
                    {chat.userQuery
                      ? (chat.userQuery.length > 18 ? chat.userQuery.substring(0, 18) + '...' : chat.userQuery)
                      : '대화 기록 없음'}
                  </span>
                  <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '4px' }}>
                    {new Date(chat.createdAt).toLocaleDateString()}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 2. 메인 채팅창 */}
        <div className={styles.chatWindow}>

          {/* 2-1. 메시지 출력 영역 */}
          <div ref={messagesAreaRef} className={styles.chatMessagesArea}>

            {messages.map((msg, index) => (
              <div key={index} className={`${styles.chatMessage} ${msg.role === 'ai' ? styles.ai : styles.user}`} style={{ width: msg.type === 'recommendation_list' ? '100%' : 'fit-content', maxWidth: msg.type === 'recommendation_list' ? '95%' : '85%' }}>

                {/* 추천 리스트인 경우 */}
                {msg.type === 'recommendation_list' ? (
                  <RecommendationList items={msg.items} onAddToCalendar={handleAddToCalendar} />
                ) : (
                  /* 일반 텍스트 메시지 */
                  <p style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
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

          {/* 2-2. 메시지 입력 영역 */}
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
