import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

function ProfileSetup() {
  const { skillOptions, majorOptions, jobOptions } = useMetaData();

  const [education, setEducation] = useState({ school: '', major: '', grade: '' });
  const [careerGoal, setCareerGoal] = useState('');

  const [skills, setSkills] = useState([]);
  const [currentSkill, setCurrentSkill] = useState({ name: '' });
  const [experiences, setExperiences] = useState([]);
  const [currentExperience, setCurrentExperience] = useState({ type: 'PROJECT', role: '', techStack: '' });
  const [evidence, setEvidence] = useState({ certifications: [] });
  const [currentCert, setCurrentCert] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const navigate = useNavigate();

  // 학교 검색 (AsyncSelect 용)
  const loadSchoolOptions = (inputValue = '') => {
    const query = inputValue || '';
    return apiClient.get(`/meta/data/schools?q=${query}`)
      .then(res => {
        return res.data.map(s => ({ value: s, label: s }));
      });
  };

  const loadCertificationOptions = (inputValue = '') => {
    const query = (inputValue || '').trim();
    if (!query) {
      return Promise.resolve([]);
    }
    return apiClient.get(`/meta/data/certifications?q=${encodeURIComponent(query)}`)
      .then(res => res.data.map(c => ({ value: c, label: c })));
  };

  const handleAddExperience = () => { if (currentExperience.role) { setExperiences([...experiences, currentExperience]); setCurrentExperience({ type: 'PROJECT', role: '', techStack: '' }); } };
  const handleRemoveExperience = (index) => setExperiences(experiences.filter((_, i) => i !== index));
  const handleAddCert = () => { if (currentCert) { setEvidence({ ...evidence, certifications: [...evidence.certifications, currentCert] }); setCurrentCert(''); } };
  const handleRemoveCert = (index) => { setEvidence({ ...evidence, certifications: evidence.certifications.filter((_, i) => i !== index) }); };

  const handleAddSkill = () => {
    if (currentSkill.name && !skills.some(s => s.name === currentSkill.name)) {
      setSkills([...skills, currentSkill]);
      setCurrentSkill({ name: '' });
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
          level: 'INTERMEDIATE'
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

  // 공통 Select 스타일
  const selectStyles = {
    control: (base, state) => ({
      ...base,
      height: '40px',
      minHeight: '40px',
      borderRadius: '8px',
      borderColor: '#dadce0',
      boxShadow: 'none',
      backgroundColor: 'white',
      '&:hover': {
        borderColor: '#888'
      },
      fontSize: '15px',
    }),
    valueContainer: (base, state) => ({
      ...base,
      padding: '0 12px',
      display: state.selectProps.isMulti ? 'flex' : 'grid',
      flexWrap: state.selectProps.isMulti ? 'wrap' : undefined,
      gap: state.selectProps.isMulti ? '4px' : undefined,
      gridTemplateColumns: state.selectProps.isMulti ? undefined : '1fr',
      alignItems: 'center',
      height: '100%',
      flex: 1
    }),
    placeholder: (base, state) => ({
      ...base,
      color: '#888',
      margin: 0,
      gridArea: state.selectProps.isMulti ? undefined : '1/1',
      display: state.isFocused ? 'none' : 'block'
    }),
    singleValue: (base) => ({
      ...base,
      color: '#333',
      margin: 0,
      maxWidth: '100%',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      gridArea: '1/1',
    }),
    input: (base, state) => ({
      ...base,
      margin: 0,
      padding: 0,
      color: '#333',
      gridArea: state.selectProps.isMulti ? undefined : '1/1',
      visibility: 'visible',
      minWidth: '2px'
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
              <AsyncSelect
                cacheOptions
                defaultOptions
                loadOptions={loadSchoolOptions}
                onChange={(selected) => setEducation({ ...education, school: selected ? selected.value : '' })}
                value={education.school ? { label: education.school, value: education.school } : null}
                placeholder="학교 검색"
                noOptionsMessage={({ inputValue }) =>
                  inputValue ? '검색 결과가 없습니다.' : '학교명을 입력해 검색하세요.'
                }
                styles={{
                  ...selectStyles,
                  input: (base) => ({
                    ...base,
                    margin: 0,
                    padding: 0,
                    color: '#333',
                    caretColor: 'auto',
                    '& input': {
                      opacity: 1
                    },
                    gridArea: '1/1',
                    visibility: 'visible',
                    minWidth: '2px'
                  })
                }}
                components={{ DropdownIndicator: CustomDropdownIndicator, IndicatorSeparator: () => null }}
                required
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
                components={{ DropdownIndicator: CustomDropdownIndicator, IndicatorSeparator: () => null }}
              />
            </div>
            <div className="form-group">
              <label>학년</label>
              <CustomSelect
                options={gradeOptions}
                value={gradeOptions.find(g => g.value === education.grade)}
                onChange={(val) => setEducation({ ...education, grade: val.value })}
                styles={selectStyles}
                components={{ DropdownIndicator: CustomDropdownIndicator, IndicatorSeparator: () => null }}
                placeholder="학년 선택"
                isSearchable={false}
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
              placeholder="희망 직무 선택"
              isSearchable
              styles={selectStyles}
              components={{ DropdownIndicator: CustomDropdownIndicator, IndicatorSeparator: () => null }}
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
                value={skillOptions.find(s => s.value === currentSkill.name) || null}
                onChange={(selected) => setCurrentSkill({ ...currentSkill, name: selected ? selected.value : '' })}
                placeholder="선택 또는 검색..."
                isSearchable
                styles={selectStyles}
                components={{ DropdownIndicator: CustomDropdownIndicator, IndicatorSeparator: () => null }}
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
                components={{ DropdownIndicator: CustomDropdownIndicator, IndicatorSeparator: () => null }}
                isSearchable={false}
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
                components={{ DropdownIndicator: CustomDropdownIndicator, IndicatorSeparator: () => null }}
                blurInputOnSelect={false}
                openMenuOnFocus={false}
                isSearchable
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
          <h3>자격증</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <div style={{ flex: 1 }}>
              <AsyncSelect
                cacheOptions
                defaultOptions={false}
                loadOptions={loadCertificationOptions}
                value={currentCert ? { label: currentCert, value: currentCert } : null}
                onChange={(selected) => setCurrentCert(selected ? selected.value : '')}
                placeholder="자격증 검색"
                noOptionsMessage={({ inputValue }) =>
                  inputValue ? '검색 결과가 없습니다.' : '자격증명을 입력해 검색하세요.'
                }
                styles={{
                  ...selectStyles,
                  input: (base) => ({
                    ...base,
                    margin: 0,
                    padding: 0,
                    color: '#333',
                    caretColor: 'auto',
                    '& input': {
                      opacity: 1
                    },
                    gridArea: '1/1',
                    visibility: 'visible',
                    minWidth: '2px'
                  })
                }}
                components={{ DropdownIndicator: CustomDropdownIndicator, IndicatorSeparator: () => null }}
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