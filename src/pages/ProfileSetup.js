// src/pages/ProfileSetup.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // [!!!]
import axios from 'axios'; // [!!!]
import './Page.css';
import CustomSelect from '../components/CustomSelect'; 

// 백엔드 서버 주소
const API_BASE_URL = 'https://mentoai.onrender.com';

const skillOptions = [
  { value: '상', label: '상 (업무 활용)' },
  { value: '중', label: '중 (토이 프로젝트)' },
  { value: '하', label: '하 (학습 경험)' }
];
const experienceOptions = [
  { value: 'PROJECT', label: '프로젝트' },
  { value: 'INTERN', label: '인턴' }
];

/**
 * [!!!] sessionStorage에서 토큰과 userId를 직접 가져오는 헬퍼 함수
 */
const getAuthDataFromStorage = () => {
  try {
    const storedUser = JSON.parse(sessionStorage.getItem('mentoUser'));
    return { 
      userId: storedUser ? storedUser.user.userId : null,
      token: storedUser ? storedUser.tokens.accessToken : null
    };
  } catch (e) {
    return { userId: null, token: null };
  }
};


function ProfileSetup() {
  // (기존 state들은 그대로 사용)
  const [education, setEducation] = useState({ school: '멘토대학교', major: '컴퓨터공학과', grade: 3 });
  const [careerGoal, setCareerGoal] = useState('AI 엔지니어');
  const [skills, setSkills] = useState([]);
  const [currentSkill, setCurrentSkill] = useState({ name: '', level: '중' });
  const [experiences, setExperiences] = useState([]);
  const [currentExperience, setCurrentExperience] = useState({ type: 'PROJECT', role: '', period: '', techStack: '', url: '' });
  const [evidence, setEvidence] = useState({ certifications: [] });
  const [currentCert, setCurrentCert] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // [!!!] Context 대신 useNavigate 임포트
  const navigate = useNavigate();

  // (핸들러 함수들은 기존과 동일)
  const handleAddSkill = () => {
    if (currentSkill.name) {
      setSkills([...skills, currentSkill]);
      setCurrentSkill({ name: '', level: '중' });
    }
  };
  const handleRemoveSkill = (index) => setSkills(skills.filter((_, i) => i !== index));
  const handleAddExperience = () => {
    if (currentExperience.role && currentExperience.period) {
      setExperiences([...experiences, currentExperience]);
      setCurrentExperience({ type: 'PROJECT', role: '', period: '', techStack: '', url: '' });
    }
  };
  const handleRemoveExperience = (index) => setExperiences(experiences.filter((_, i) => i !== index));
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

  // [!!!] Context.completeProfile() 대신 axios를 직접 호출
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    const profileData = {
      education,
      careerGoal,
      skillFit: skills,
      experienceFit: experiences,
      evidenceFit: evidence
    };

    try {
      // 1. 스토리지에서 인증 정보 가져오기
      const { userId, token } = getAuthDataFromStorage();
      if (!userId || !token) {
        throw new Error("인증 정보가 없습니다. 다시 로그인해주세요.");
      }

      // 2. axios로 직접 API 호출 (PUT /users/{userId}/profile)
      await axios.put(
        `${API_BASE_URL}/users/${userId}/profile`, 
        profileData,
        {
          headers: {
            'Authorization': `Bearer ${token}` // 수동으로 토큰 주입
          },
          timeout: 30000 // 30초 대기
        }
      );
      
      // 3. 성공 시, sessionStorage의 profileComplete 상태도 수동으로 업데이트
      const storedUser = JSON.parse(sessionStorage.getItem('mentoUser'));
      storedUser.user.profileComplete = true;
      sessionStorage.setItem('mentoUser', JSON.stringify(storedUser));
      
      // 4. 메인 페이지로 이동
      navigate('/recommend', { replace: true });

    } catch (error) {
      console.error("프로필 저장 실패:", error);
      alert(`프로필 저장 중 오류가 발생했습니다: ${error.message}`);
      setIsSaving(false);
    }
  };

  // (이하 JSX는 기존과 동일)
  return (
    <div className="profile-setup-container">
      <form className="profile-card" onSubmit={handleSubmit}>
        <h2 className="profile-card-title">📝 상세 프로필 설정</h2>
        <p className="profile-card-description">AI 추천 정확도를 높이기 위해 정보를 입력해주세요. (나중에 마이페이지에서 수정할 수 있습니다)</p>

        {/* --- 1. 기본 정보 섹션 --- */}
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

        {/* --- 2. 기술 스택 섹션 --- */}
        <div className="form-section">
          <h3>기술 스택</h3>
          <div className="input-group skill-group">
            <input type="text" placeholder="기술 이름 (예: React)" value={currentSkill.name} onChange={(e) => setCurrentSkill({ ...currentSkill, name: e.target.value })} />
            <CustomSelect
              options={skillOptions}
              value={currentSkill.level}
              onChange={(newValue) => setCurrentSkill({ ...currentSkill, level: newValue })}
            />
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

        {/* --- 3. 주요 경험 섹션 --- */}
        <div className="form-section">
          <h3>주요 경험</h3>
          <div className="input-group experience-group">
            <CustomSelect
              options={experienceOptions}
              value={currentExperience.type}
              onChange={(newValue) => setCurrentExperience({ ...currentExperience, type: newValue })}
            />
            <input type="text" placeholder="역할 (예: 프론트엔드 개발)" value={currentExperience.role} onChange={(e) => setCurrentExperience({ ...currentExperience, role: e.target.value })} />
            <input type="text" placeholder="기간 (예: 3개월)" value={currentExperience.period} onChange={(e) => setCurrentExperience({ ...currentExperience, period: e.target.value })} />
            <input type="text" placeholder="사용 기술 (예: React, Spring)" value={currentExperience.techStack} onChange={(e) => setCurrentExperience({ ...currentExperience, techStack: e.target.value })} />
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

        {/* --- 4. 증빙 자료 섹션 --- */}
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

        <button type="submit" className="submit-button" disabled={isSaving}>
          {isSaving ? '저장 중...' : '설정 완료하고 시작하기'}
        </button>
      </form>
    </div>
  );
}

export default ProfileSetup;