import React, { useState } from 'react';
import { saveUserProfile } from '../api/authApi'; // 프로필 저장 API
import './Page.css';

// MyPage는 ProfileSetup과 거의 동일한 폼을 가지지만,
// 'completeProfile' 대신 'saveUserProfile'만 호출하고
// 기존 데이터를 불러와서 보여줍니다.
function MyPage() {
  // --- 데모를 위해, 사용자의 프로필 정보 예시를 미리 채워둡니다. ---
  const [education, setEducation] = useState({ school: '멘토대학교', major: '컴퓨터공학과', grade: 3 });
  const [careerGoal, setCareerGoal] = useState('AI 엔지니어');
  
  // SkillFit
  const [skills, setSkills] = useState([
    { name: 'React', level: '중' },
    { name: 'Spring Boot', level: '하' }
  ]);
  const [currentSkill, setCurrentSkill] = useState({ name: '', level: '중' });
  
  // ExperienceFit
  const [experiences, setExperiences] = useState([
    { type: 'PROJECT', role: '프론트엔드 개발', period: '3개월', techStack: 'React', url: 'https://github.com/my-project' }
  ]);
  const [currentExperience, setCurrentExperience] = useState({ type: 'PROJECT', role: '', period: '', techStack: '', url: '' });
  
  // EvidenceFit
  const [evidence, setEvidence] = useState({ certifications: ['정보처리기사'] });
  const [currentCert, setCurrentCert] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  // -----------------------------------------------------------------

  // --- SkillFit 핸들러 ---
  const handleAddSkill = () => {
    if (currentSkill.name) {
      setSkills([...skills, currentSkill]);
      setCurrentSkill({ name: '', level: '중' });
    }
  };
  const handleRemoveSkill = (index) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  // --- ExperienceFit 핸들러 ---
  const handleAddExperience = () => {
    if (currentExperience.role && currentExperience.period) {
      setExperiences([...experiences, currentExperience]);
      setCurrentExperience({ type: 'PROJECT', role: '', period: '', techStack: '', url: '' });
    }
  };
  const handleRemoveExperience = (index) => {
    setExperiences(experiences.filter((_, i) => i !== index));
  };

  // --- EvidenceFit 핸들러 ---
  const handleAddCert = () => {
    if (currentCert) {
      setEvidence({ ...evidence, certifications: [...evidence.certifications, currentCert] });
      setCurrentCert('');
    }
  };
  const handleRemoveCert = (index) => {
    setEvidence({
      ...evidence,
      certifications: evidence.certifications.filter((_, i) => i !== index),
    });
  };

  // --- 프로필 저장 핸들러 ---
  const handleSave = async () => {
    setIsSaving(true);
    
    // [오류 수정] ES6 객체 축약 문법 대신 표준 문법 사용
    const profileData = {
      education: education,
      careerGoal: careerGoal,
      skillFit: skills,
      experienceFit: experiences,
      evidenceFit: evidence
    };

    try {
      // 가짜 API 호출
      await saveUserProfile(profileData);
      
      // 저장 완료 토스트 메시지를 보여줍니다.
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 2000);

    } catch (error) {
      console.error("프로필 저장 실패:", error);
      alert("프로필 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page-container">
      <h2>👤 마이페이지</h2>
      <p>AI 추천 점수(RoleFitScore) 계산의 정확도를 높이기 위해 프로필 정보를 최신으로 유지해주세요.</p>

      {/* ProfileSetup.js와 동일한 폼 구조를 사용합니다.
        CSS는 Page.css의 .profile-card, .form-section 등을 공유합니다.
      */}
      <div className="profile-card mypage-card">
        
        {/* --- 1. 기본 정보 섹션 (EducationFit, CareerGoal) --- */}
        <div className="form-section">
          <h3>기본 학력</h3>
          <div className="form-grid two-cols">
            <div className="form-group">
              <label>학교</label>
              <input type="text" value={education.school} onChange={(e) => setEducation({ ...education, school: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>전공</label>
              <input type="text" value={education.major} onChange={(e) => setEducation({ ...education, major: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>학년</label>
              <input type="number" value={education.grade} onChange={(e) => setEducation({ ...education, grade: e.target.value })} required min="1" max="5" />
            </div>
            <div className="form-group">
              <label>목표 직무</label>
              <input type="text" value={careerGoal} onChange={(e) => setCareerGoal(e.target.value)} required />
            </div>
          </div>
        </div>

        {/* --- 2. 기술 스택 섹션 (SkillFit) --- */}
        <div className="form-section">
          <h3>기술 스택</h3>
          <div className="input-group">
            <input type="text" placeholder="기술 이름 (예: React)" value={currentSkill.name} onChange={(e) => setCurrentSkill({ ...currentSkill, name: e.target.value })} />
            <select value={currentSkill.level} onChange={(e) => setCurrentSkill({ ...currentSkill, level: e.target.value })}>
              <option value="상">상 (업무 활용)</option>
              <option value="중">중 (토이 프로젝트)</option>
              <option value="하">하 (학습 경험)</option>
            </select>
            <button type="button" className="add-item-btn" onClick={handleAddSkill}>추가</button>
          </div>
          <ul className="added-list">
            {skills.map((skill, index) => (
              <li key={index} className="added-item">
                {skill.name} ({skill.level})
                <button type="button" className="remove-item-btn" onClick={() => handleRemoveSkill(index)}>×</button>
              </li>
            ))}
          </ul>
        </div>

        {/* --- 3. 주요 경험 섹션 (ExperienceFit) --- */}
        <div className="form-section">
          <h3>주요 경험</h3>
          <div className="input-group experience-group" style={{gridTemplateColumns: "1fr 2fr 1fr 2fr 2fr auto"}}>
            <select value={currentExperience.type} onChange={(e) => setCurrentExperience({ ...currentExperience, type: e.target.value })}>
              <option value="PROJECT">프로젝트</option>
              <option value="INTERN">인턴</option>
            </select>
            <input type="text" placeholder="역할 (예: 프론트엔드 개발)" value={currentExperience.role} onChange={(e) => setCurrentExperience({ ...currentExperience, role: e.target.value })} />
            <input type="text" placeholder="기간 (예: 3개월)" value={currentExperience.period} onChange={(e) => setCurrentExperience({ ...currentExperience, period: e.target.value })} />
            <input type="text" placeholder="사용 기술 (예: React, Spring)" value={currentExperience.techStack} onChange={(e) => setCurrentExperience({ ...currentExperience, techStack: e.target.value })} />
            {/* 'EvidenceFit'의 'portfolio' 항목을 위해 URL 입력란 추가 */}
            <input type="text" placeholder="관련 URL (GitHub, 포트폴리오)" value={currentExperience.url} onChange={(e) => setCurrentExperience({ ...currentExperience, url: e.target.value })} />
            <button type="button" className="add-item-btn" onClick={handleAddExperience}>추가</button>
          </div>
          <ul className="added-list">
            {experiences.map((exp, index) => (
              <li key={index} className="added-item">
                [{exp.type}] {exp.role} ({exp.period}) - {exp.techStack} {exp.url && `(${exp.url})`}
                <button type="button" className="remove-item-btn" onClick={() => handleRemoveExperience(index)}>×</button>
              </li>
            ))}
          </ul>
        </div>

        {/* --- 4. 증빙 자료 섹션 (EvidenceFit) --- */}
        <div className="form-section">
          <h3>증빙 자료</h3>
          <div className="form-group">
            <label>자격증</label>
            <div className="input-group">
              <input type="text" placeholder="자격증 이름 (예: 정보처리기사)" value={currentCert} onChange={(e) => setCurrentCert(e.target.value)} />
              <button type="button" className="add-item-btn" onClick={handleAddCert}>추가</button>
            </div>
            <ul className="added-list">
              {evidence.certifications.map((cert, index) => (
                <li key={index} className="added-item">
                  {cert}
                  <button type="button" className="remove-item-btn" onClick={() => handleRemoveCert(index)}>×</button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* MyPage에서는 submit이 아닌 onClick으로 변경, completeProfile 호출 제거 */}
        <button onClick={handleSave} className="submit-button" disabled={isSaving}>
          {isSaving ? '저장 중...' : '프로필 저장'}
        </button>
      </div>

      {showToast && (
        <div className="toast-message">
          ✅ 프로필이 저장되었습니다!
        </div>
      )}
    </div>
  );
}

export default MyPage;