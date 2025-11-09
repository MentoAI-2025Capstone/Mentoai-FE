// src/utils/gapAnalysisPrompt.js (백엔드에서 사용할 프롬프트 생성기 예시)

/**
 * [백엔드 전용]
 * 사용자의 '전체 프로필'과 '목표 직무'의 요구사항을 LLM에게 전달하여,
 * RoleFitScore와 격차를 줄이기 위한 '할 일(To-do)' 목록을 생성하도록 요청하는
 * '역량 진단(Gap Analysis)' 프롬프트를 생성합니다.
 *
 * @param {object} userProfile - DB에서 가져온 사용자 프로필 (SkillFit, ExperienceFit 등 포함)
 * @param {object} targetJob - DB에서 가져온 목표 직무 (요구 스킬, 우대 자격증 등 포함)
 * @returns {string} - LLM(GPT, Gemini)에게 전달될 최종 프롬프트
 */
export const createGapAnalysisPrompt = (userProfile, targetJob) => {

  // 1. 사용자 프로필을 텍스트로 변환 (실제로는 더 복잡한 데이터가 들어옴)
  const profileText = `
    - 학력: ${userProfile.education?.major || '정보 없음'} (${userProfile.education?.grade || 0}학년)
    - 보유 스킬: ${userProfile.skillFit?.map(s => `${s.name}(${s.level})`).join(', ') || '없음'}
    - 주요 경험: ${userProfile.experienceFit?.map(e => `${e.type}: ${e.role}(${e.period})`).join(', ') || '없음'}
    - 자격증: ${userProfile.evidenceFit?.certifications?.join(', ') || '없음'}
  `;

  // 2. 목표 직무 요구사항을 텍스트로 변환 (RAG로 DB에서 가져온 데이터)
  const jobText = `
    - 직무명: ${targetJob.title}
    - 주요 요구 스킬: ${targetJob.requiredSkills.join(', ')}
    - 우대 자격증: ${targetJob.preferredCerts.join(', ')}
    - 핵심 업무: ${targetJob.description}
  `;

  // 3. LLM에게 전달할 시스템 지시문
  const systemInstruction = `
    # ROLE
    당신은 사용자의 역량을 AI 직무와 비교하여 점수를 매기고,
    격차(Gap)를 분석해 주는 전문 커리어 컨설턴트입니다.
    'RoleFitScore' 계산식을 기반으로 사고해야 합니다.

    # RoleFitScore 계산식 (참고용)
    - RoleFitScore = 0.50 * SkillFit + 0.30 * ExperienceFit + 0.15 * EducationFit + 0.05 * EvidenceFit
    - SkillFit: (기술 스택 일치도 + 코사인 유사도)
    - ExperienceFit: (경험의 연관성 * 기간 * 타입 가중치)
    - EducationFit: (전공 일치도 + 학년 적합도)
    - EvidenceFit: (자격증 일치도 + 포트폴리오 URL 유무)

    # INSTRUCTIONS
    1.  [USER PROFILE]과 [TARGET JOB]의 요구사항을 'RoleFitScore 계산식'에 근거하여 비교 분석합니다.
    2.  [TARGET JOB]의 목표 점수(80~90점 사이)를 추정합니다.
    3.  [USER PROFILE]의 현재 점수(60~70점 사이)를 추정합니다.
    4.  두 점수 간의 격차를 줄이기 위한 **가장 중요하고 구체적인 '활동 추천 목록' 3가지**를 제안합니다.
    5.  '활동 추천 목록'에는 왜 그것이 필요한지, 그리고 그것을 달성했을 때 예상되는 '목표 점수' (+X점)를 포함해야 합니다.

    # OUTPUT FORMAT (반드시 JSON 형식으로만 응답)
    {
      "targetJobTitle": "NAVER (AI 엔지니어)",
      "targetJobScore": 85,
      "userScore": 70,
      "analysis": "NAVER는 ... 탄탄한 CS 기본기를 중요하게 봅니다.",
      "recommendations": [
        {
          "title": "정보처리기사 자격증 취득",
          "reason": "CS 전공 지식과 SW 공학 전반의 이해도를 증명할 수 있는 기본 자격증입니다.",
          "scoreEffect": "+5점"
        },
        {
          "title": "NAVER AI RUSH 참여",
          "reason": "네이버가 직접 주최하는 AI 경진대회에 참여하여 실무 문제를 경험하고 입상 시 강력한 스펙이 됩니다.",
          "scoreEffect": "+10점"
        }
      ]
    }
  `;

  // 4. 최종 프롬프트 조립
  const finalPrompt = `
[SYSTEM INSTRUCTION]
${systemInstruction.trim()}

[USER PROFILE]
${profileText.trim()}

[TARGET JOB]
${jobText.trim()}

[CONSULTANT's RESPONSE (JSON ONLY)]
`.trim();

  // 이 프롬프트가 백엔드에서 LLM으로 전송됩니다.
  console.log("--- 역량 진단(Gap Analysis) 프롬프트 생성 ---");
  console.log(finalPrompt);
  console.log("-----------------------------------------");

  return finalPrompt;
};