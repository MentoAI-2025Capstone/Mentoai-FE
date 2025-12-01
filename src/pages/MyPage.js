import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import './Page.css';
import CustomSelect, { components } from 'react-select';
import AsyncSelect from 'react-select/async';
import { useMetaData } from '../hooks/useMetaData';

const experienceOptions = [{ value: 'PROJECT', label: '프로젝트' }, { value: 'INTERN', label: '인턴' }];
const gradeOptions = [
  { value: '1', label: '1학년' },
  { value: '2', label: '2학년' },
  { value: '3', label: '3학년' },
  { value: '4', label: '4학년' },
  { value: '5', label: '5학년 이상' }
];

const getUserIdFromStorage = () => {
  try {
    const storedUser = JSON.parse(sessionStorage.getItem('mentoUser'));
    return storedUser ? storedUser.user.userId : null;
  } catch (e) {
    return null;
  }
};

// CustomDropdownIndicator 컴포넌트
const CustomDropdownIndicator = (props) => {
  return (
    <components.DropdownIndicator {...props}>
      <div style={{
        width: 0,
        height: 0,
        borderLeft: '5px solid transparent',
        borderRight: '5px solid transparent',
        borderTop: '6px solid #6c757d',
        transform: props.selectProps.menuIsOpen ? 'rotate(180deg)' : 'none',
        transition: 'transform 0.2s ease',
        cursor: 'pointer'
      }} />
    </components.DropdownIndicator>
  );
};

function MyPage() {
  const { skillOptions, certOptions, majorOptions, jobOptions } = useMetaData();

  const [education, setEducation] = useState({ school: '', major: '', grade: '' });
  const [careerGoal, setCareerGoal] = useState('');
  const [skills, setSkills] = useState([]);
  const [currentSkill, setCurrentSkill] = useState({ name: '', level: '중' });
  const [experiences, setExperiences] = useState([]);
  const [currentExperience, setCurrentExperience] = useState({ type: 'PROJECT', role: '', techStack: '' });
  const [evidence, setEvidence] = useState({ certifications: [] });
  const [currentCert, setCurrentCert] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);

  // 학교 검색 (AsyncSelect 용)
  const loadSchoolOptions = (inputValue) => {
    return apiClient.get(`/meta/data/schools?q=${inputValue}`)
      .then(res => {
        return res.data.map(s => ({ value: s, label: s }));
      });
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userId = getUserIdFromStorage();
        if (!userId) return;

        const response = await apiClient.get(`/users/${userId}/profile`);
        const data = response.data;

        if (data) {
          setEducation({
            school: data.university?.universityName || '',
            major: data.university?.major || '',
            grade: data.university?.grade ? String(data.university.grade) : ''
          });
          setCareerGoal(data.interestDomains?.[0] || '');
          setSkills(data.techStack?.map(ts => ({ name: ts.name, level: ts.level === 'ADVANCED' ? '상' : ts.level === 'INTERMEDIATE' ? '중' : '하' })) || []);
          setExperiences(data.experiences?.map(exp => ({
            type: exp.type,
            role: exp.role,
            techStack: exp.techStack?.join(', ') || ''
          })) || []);
          setEvidence({ certifications: data.certifications?.map(c => c.name) || [] });
        }
      } catch (error) {
        console.error("마이페이지 초기화 중 오류:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleAddExperience = () => { if (currentExperience.role) { setExperiences([...experiences, currentExperience]); setCurrentExperience({ type: 'PROJECT', role: '', techStack: '' }); } };
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

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const userId = getUserIdFromStorage();
      if (!userId) throw new Error("인증 정보가 없습니다.");

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
          return {
            type: exp.type === 'PROJECT' ? 'PROJECT' : 'INTERNSHIP',
            role: exp.role,
            startDate: null,
            endDate: null,
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
        } catch (roleFitError) {
          console.error('Role fit calculation failed', roleFitError);
        }
      }

      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);

    } catch (error) {
      console.error("프로필 저장 실패:", error);
      alert("프로필 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  // 공통 Select 스타일
  const selectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: '40px',
      height: '40px',
      borderRadius: '8px',
      borderColor: '#ccc',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#888'
      },
      fontSize: '15px',
      backgroundColor: 'white'
    }),
    valueContainer: (base) => ({
      ...base,
      padding: '0 12px',
      height: '38px',
      display: 'flex',
      alignItems: 'center',
      lineHeight: '38px'
    }),
    placeholder: (base) => ({
      ...base,
      color: '#888',
      margin: 0,
      lineHeight: '38px'
    }),
    menu: (base) => ({
      ...base,
      borderRadius: '8px',
      marginTop: '4px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      zIndex: 9999
    }),
    option: (base, state) => ({
      ...base,
      padding: '10px',
      backgroundColor: state.isSelected ? '#e7f3ff' : state.isFocused ? '#f1f3f5' : 'white',
      color: state.isSelected ? '#007bff' : '#333',
      fontWeight: state.isSelected ? '500' : 'normal',
      cursor: 'pointer',
      ':active': {
        backgroundColor: '#e7f3ff'
      }
    }),
    singleValue: (base) => ({
      ...base,
      color: '#333',
      margin: 0,
      lineHeight: '38px'
    }),
    input: (base) => ({
      ...base,
      margin: 0,
      padding: 0,
      color: '#333',
      caretColor: 'transparent',
      lineHeight: '38px',
      '& input': {
        opacity: 0
      }
    }),
    indicatorSeparator: () => ({
      display: 'none'
    }),
    dropdownIndicator: (base) => ({
      ...base,
      padding: '8px',
      color: '#6c757d',
      '&:hover': {
        color: '#333'
      }
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: '#e7f3ff',
      borderRadius: '12px',
      padding: '2px 4px',
      margin: '2px'
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: '#007bff',
      fontWeight: '600',
      fontSize: '14px',
      padding: '2px 6px',
      paddingRight: '4px'
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: '#007bff',
      cursor: 'pointer',
      borderRadius: '0 12px 12px 0',
      paddingLeft: '4px',
      paddingRight: '6px',
      ':hover': {
        backgroundColor: 'rgba(0, 123, 255, 0.1)',
        color: '#0056b3'
      }
    })
  };

  if (isLoading) {
    return <div className="profile-setup-container"><div className="profile-card">프로필 정보를 불러오는 중...</div></div>;
  }

  return (
    <div className="profile-setup-container">
      <div className="profile-card">
        <h2 className="profile-card-title">📝 프로필 수정</h2>
        <p className="profile-card-description">
          AI 추천 정확도를 높이기 위해 프로필 정보를 최신으로 유지해주세요.
        </p>

        <div className="form-section">
          <h3>기본 학력</h3>
          <div className="form-grid two-cols">
            <div className="form-group">
              <label>학교</label>
              <AsyncSelect
                cacheOptions
                defaultOptions
                loadOptions={loadSchoolOptions}
                onChange={(selected) => setEducation({ ...education, school: selected ? selected.value : '' })}
                value={education.school ? { label: education.school, value: education.school } : null}
                placeholder="학교 검색"
                styles={{
                  ...selectStyles,
                  input: (base) => ({
                    ...base,
                    margin: 0,
                    padding: 0,
                    color: '#333',
                    caretColor: 'auto',
                    lineHeight: '38px',
                    '& input': {
                      opacity: 1
                    }
                  })
                }}
                components={{ DropdownIndicator: CustomDropdownIndicator }}
              />
            </div>
            <div className="form-group">
              <label>전공</label>
              <CustomSelect
                options={majorOptions}
                value={majorOptions.find(m => m.value === education.major)}
                onChange={(selected) => setEducation({ ...education, major: selected ? selected.value : '' })}
                placeholder="전공 선택"
                isSearchable
                styles={selectStyles}
                components={{ DropdownIndicator: CustomDropdownIndicator }}
              />
            </div>
            <div className="form-group">
              <label>학년</label>
              <CustomSelect
                options={gradeOptions}
                value={gradeOptions.find(g => g.value === education.grade)}
                onChange={(val) => setEducation({ ...education, grade: val.value })}
                styles={selectStyles}
                components={{ DropdownIndicator: CustomDropdownIndicator }}
                placeholder="학년 선택"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>희망 직무</h3>
          <div className="form-group">
            <CustomSelect
              options={jobOptions}
              value={jobOptions.find(j => j.value === careerGoal)}
              onChange={(selected) => setCareerGoal(selected ? selected.value : '')}
              placeholder="희망 직무 선택 (예: 백엔드 개발자)"
              isSearchable
              styles={selectStyles}
              components={{ DropdownIndicator: CustomDropdownIndicator }}
            />
          </div>
        </div>

        <div className="form-section">
          <h3>기술 스택</h3>
          <div className="form-grid skill-grid" style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>기술 이름</label>
              <CustomSelect
                options={skillOptions}
                value={skillOptions.find(s => s.value === currentSkill.name)}
                onChange={(selected) => setCurrentSkill({ ...currentSkill, name: selected ? selected.value : '' })}
                placeholder="선택 또는 검색..."
                isSearchable
                styles={selectStyles}
                components={{ DropdownIndicator: CustomDropdownIndicator }}
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
                value={experienceOptions.find(e => e.value === currentExperience.type)}
                onChange={(selected) => setCurrentExperience({ ...currentExperience, type: selected.value })}
                styles={selectStyles}
                components={{ DropdownIndicator: CustomDropdownIndicator }}
              />
            </div>
            <div className="form-group">
              <label>역할</label>
              <input type="text" placeholder="예: 프론트엔드 개발" value={currentExperience.role} onChange={(e) => setCurrentExperience({ ...currentExperience, role: e.target.value })} />
            </div>
            <div className="form-group">
              <label>사용 기술</label>
              <CustomSelect
                isMulti
                options={skillOptions}
                onChange={(selectedOptions) => {
                  const techString = selectedOptions ? selectedOptions.map(s => s.value).join(', ') : '';
                  setCurrentExperience({ ...currentExperience, techStack: techString });
                }}
                value={
                  currentExperience.techStack
                    ? currentExperience.techStack.split(',').map(s => s.trim()).filter(s => s).map(s => ({ label: s, value: s }))
                    : []
                }
                placeholder="사용 기술 선택 (다중 선택)"
                styles={selectStyles}
                components={{ DropdownIndicator: CustomDropdownIndicator }}
                blurInputOnSelect={false}
                openMenuOnFocus={false}
              />
            </div>
            <div className="form-group grid-col-span-2 grid-align-end">
              <button type="button" className="add-item-btn" onClick={handleAddExperience}>추가</button>
            </div>
          </div>
          <ul className="added-list">
            {experiences.map((exp, index) => (
              <li key={index} className="added-item">
                [{exp.type}] {exp.role} - {exp.techStack}
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
                options={certOptions}
                value={certOptions.find(c => c.value === currentCert)}
                onChange={(selected) => setCurrentCert(selected ? selected.value : '')}
                placeholder="자격증 선택..."
                isSearchable
                styles={selectStyles}
                components={{ DropdownIndicator: CustomDropdownIndicator }}
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