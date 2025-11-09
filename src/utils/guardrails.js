// AI가 답변하면 안 되는 금지 키워드 목록
const forbiddenKeywords = [
  '저녁 메뉴', '점심 메뉴', '아침 메뉴', '야식',
  '영화 추천', '드라마 추천', '애니메이션 추천',
  'MBTI', '연애', '소개팅',
];

/**
 * 사용자의 프롬프트에 부적절하거나 관련 없는 키워드가 있는지 확인하는 함수
 * @param {string} prompt - 사용자가 입력한 질문
 * @returns {{isSafe: boolean, message: string}} - 안전 여부와 메시지를 담은 객체
 */
export const checkGuardrails = (prompt) => {
  // 입력된 프롬프트를 소문자로 변환하여 검사
  const lowerCasePrompt = prompt.toLowerCase();

  for (const keyword of forbiddenKeywords) {
    if (lowerCasePrompt.includes(keyword.toLowerCase())) {
      // 금지 키워드가 발견되면 즉시 '안전하지 않음' 상태와 메시지 반환
      return {
        isSafe: false,
        message: `"${keyword}"와(과) 같이 진로 설계와 직접 관련 없는 질문이나 부적절한 내용은 답변하기 어렵습니다. 진로에 대한 질문을 해주세요.`
      };
    }
  }
  // 모든 키워드 검사를 통과하면 '안전함' 상태 반환
  return { isSafe: true, message: '' };
};