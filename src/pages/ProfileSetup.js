import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import './Page.css';
import CustomSelect from '../components/CustomSelect';

const SKILL_LIST = [
  'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Node.js', 'Spring', 'Java',
  'Python', 'Django', 'Flask', 'C++', 'C#', 'Go', 'Kotlin', 'Swift', 'Android', 'iOS',
  'AWS', 'Docker', 'Kubernetes', 'Git', 'MySQL', 'PostgreSQL', 'MongoDB'
];

const experienceOptions = [{ value: 'PROJECT', label: '프로젝트' }, { value: 'INTERN', label: '인턴' }];
const gradeOptions = [
  { value: '1', label: '1학년' },
  { value: '2', label: '2학년' },
  { value: '3', label: '3학년' },
  { value: '4', label: '4학년' },
  { value: '5', label: '5학년 이상' }
];

const getAuthDataFromStorage = () => {
  try {
    const storedUser = JSON.parse(sessionStorage.getItem('mentoUser'));
    return {
      userId: storedUser?.user?.userId || null
    };
  } catch (e) {
    return { userId: null };
  }
};

function ProfileSetup() {
  const [education, setEducation] = useState({ school: '', major: '', grade: '' });
  const [careerGoal, setCareerGoal] = useState('');

  const [skills, setSkills] = useState([]);
  const [currentSkill, setCurrentSkill] = useState({ name: '', level: '중' });
  const [experiences, setExperiences] = useState([]);
  const [currentExperience, setCurrentExperience] = useState({ type: 'PROJECT', role: '', period: '', techStack: '' });
  const [evidence, setEvidence] = useState({ certifications: [] });
  const [currentCert, setCurrentCert] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [techStackOptions, setTechStackOptions] = useState(
    SKILL_LIST.map(s => ({ value: s, label: s }))
  );
  const [certificationOptions, setCertificationOptions] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    fetch('/certifications.csv')
      .then(res => res.text())
      .then(text => {
        const lines = text.split('\n').map(line => line.trim()).filter(line => line);
        setCertificationOptions(lines.map(c => ({ value: c, label: c })));
      })
      .catch(err => console.error('Failed to load certifications:', err));
  }, []);

  const handleAddExperience = () => { if (currentExperience.role && currentExperience.period) { setExperiences([...experiences, currentExperience]); setCurrentExperience({ type: 'PROJECT', role: '', period: '', techStack: '' }); } };
  const handleRemoveExperience = (index) => setExperiences(experiences.filter((_, i) => i !== index));
  const handleAddCert = () => { if (currentCert) { setEvidence({ ...evidence, certifications: [...evidence.certifications, currentCert] }); setCurrentCert(''); } };
  const handleRemoveCert = (index) => { setEvidence({ ...evidence, certifications: evidence.certifications.filter((_, i) => i !== index) }); };

  const handleAddSkill = () => {
    if (currentSkill.name && !skills.some(s => s.name === currentSkill.name)) {
      setSkills([...skills, currentSkill]);
      setCurrentSkill({ ...currentSkill, name: '' });
    }
  };

  const handleRemoveSkill = (index) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const { userId } = getAuthDataFromStorage();
      if (!userId) {
        throw new Error("인증 정보(userId)가 없습니다. 다시 로그인해주세요.");
      }

      const profileData = {
        university: {
          universityName: education.school || undefined,
          major: education.major || undefined,
          grade: education.grade ? parseInt(education.grade) : undefined
        },
        interestDomains: careerGoal ? [careerGoal] : [],
        techStack: skills.map(skill => ({
          name: skill.name,
          level: skill.level === '상' ? 'ADVANCED' :
            skill.level === '중' ? 'INTERMEDIATE' : 'BEGINNER'
        })),
        experiences: experiences.map(exp => {
          const periodParts = exp.period.split('~').map(s => s.trim());
          const startDate = periodParts[0] || undefined;
          const endDate = periodParts[1] || undefined;

          return {
            type: exp.type === 'PROJECT' ? 'PROJECT' : 'INTERNSHIP',
            role: exp.role,
            startDate: startDate,
            endDate: endDate,
            techStack: exp.techStack ? exp.techStack.split(',').map(t => t.trim()) : []
          };
        }),
        certifications: evidence.certifications.map(cert => ({
          name: cert
        }))
      };

      await apiClient.put(
        `/users/${userId}/profile`,
        profileData
      );

      const storedUser = JSON.parse(sessionStorage.getItem('mentoUser'));
      if (storedUser) {
        if (storedUser.user) {
          storedUser.user.profileComplete = true;
        } else {
          storedUser.user = { profileComplete: true };
        }
        sessionStorage.setItem('mentoUser', JSON.stringify(storedUser));
      }

      if (careerGoal) {
        const roleFitRequestBody = {
          target: careerGoal,
          topNImprovements: 5
        };

        try {
          await apiClient.post(
            `/users/${userId}/role-fit`,
            roleFitRequestBody
          );
        } catch (error) {
          console.error("Role fit calculation failed", error);
        }
      }

      navigate('/mypage');

    } catch (error) {
      console.error("Profile setup failed:", error);
      alert("프로필 설정 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="profile-setup-container">
      <form className="profile-card" onSubmit={handleSubmit}>
        <h2 className="profile-card-title">📝 상세 프로필 설정</h2>
        <p className="profile-card-description">AI 추천 정확도를 높이기 위해 정보를 입력해주세요. (나중에 마이페이지에서 수정할 수 있습니다)</p>

        <div className="form-section">
          <h3>기본 학력</h3>
          <div className="form-grid two-cols">
            <div className="form-group">
              <label>학교</label>
              <input type="text" value={education.school} onChange={(e) => setEducation({ ...education, school: e.target.value })} placeholder="학교명" />
            </div>
            <div className="form-group">
              <label>전공</label>
              <input type="text" value={education.major} onChange={(e) => setEducation({ ...education, major: e.target.value })} placeholder="전공" />
            </div>
            <div className="form-group">
              <label>학년</label>
              <CustomSelect options={gradeOptions} value={education.grade} onChange={(val) => setEducation({ ...education, grade: val })} />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>희망 직무</h3>
          <div className="form-group">
            <input type="text" value={careerGoal} onChange={(e) => setCareerGoal(e.target.value)} placeholder="희망 직무 (예: 백엔드 개발자)" />
          </div>
        </div>

        <div className="form-section">
          <h3>기술 스택</h3>
          <div className="form-grid skill-grid" style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>기술 이름</label>
              <CustomSelect
                options={techStackOptions}
                value={currentSkill.name}
                onChange={(newValue) => setCurrentSkill({ ...currentSkill, name: newValue })}
                placeholder="선택 또는 검색..."
                isSearchable
              />
            </div>
            <button
              type="button"
              className="add-item-btn"
              onClick={handleAddSkill}
              style={{ height: '40px', marginBottom: '1px', flex: '0 0 80px', borderRadius: '8px' }}
            >
              추가
            </button>
          </div>
          <ul className="added-list">
            {skills.map((skill, index) => (
              <li key={index} className="added-item">
                {skill.name}
                <button type="button" className="remove-item-btn" onClick={() => handleRemoveSkill(index)}>×</button>
              </li>
            ))}
          </ul>
        </div>

        <div className="form-section">
          <h3>주요 경험</h3>
          <div className="form-grid two-cols">
            <div className="form-group">
              <label>유형</label>
              <CustomSelect
                options={experienceOptions}
                value={currentExperience.type}
                onChange={(newValue) => setCurrentExperience({ ...currentExperience, type: newValue })}
              />
            </div>
            <div className="form-group">
              <label>역할</label>
              <input type="text" placeholder="예: 프론트엔드 개발" value={currentExperience.role} onChange={(e) => setCurrentExperience({ ...currentExperience, role: e.target.value })} />
            </div>
            <div className="form-group">
              <label>기간</label>
              <input type="text" placeholder="예: 3개월" value={currentExperience.period} onChange={(e) => setCurrentExperience({ ...currentExperience, period: e.target.value })} />
            </div>
            <div className="form-group">
              <label>사용 기술</label>
              <input
                type="text"
                placeholder="예: React, Spring"
                value={currentExperience.techStack}
                onChange={(e) => setCurrentExperience({ ...currentExperience, techStack: e.target.value })}
                list="techstack-datalist"
              />
              <datalist id="techstack-datalist">
                {techStackOptions.map((option, i) => (
                  <option key={i} value={option.value} />
                ))}
              </datalist>
            </div>

            <div className="form-group grid-col-span-2 grid-align-end">
              <button type="button" className="add-item-btn" onClick={handleAddExperience}>추가</button>
            </div>
          </div>
          <ul className="added-list">
            {experiences.map((exp, index) => (
              <li key={index} className="added-item">
                [{exp.type}] {exp.role} ({exp.period}) - {exp.techStack}
                <button type="button" className="remove-item-btn" onClick={() => handleRemoveExperience(index)}>×</button>
              </li>
            ))}
          </ul>
        </div>

        <div className="form-section">
          <h3 style={{ marginBottom: '15px' }}>자격증</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <div style={{ flex: 1 }}>
              <CustomSelect
                options={certificationOptions}
                value={currentCert}
                onChange={(val) => setCurrentCert(val)}
                placeholder="자격증 선택..."
                isSearchable
              />
            </div>
            <button
              type="button"
              className="add-item-btn"
              onClick={handleAddCert}
              style={{ height: '40px', flex: '0 0 80px', borderRadius: '8px' }}
            >
              추가
            </button>
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

        <button type="submit" className="submit-button" disabled={isSaving}>
          {isSaving ? '저장 중...' : '설정 완료하고 시작하기'}
        </button>
      </form >
    </div >
  );
}

export default ProfileSetup;