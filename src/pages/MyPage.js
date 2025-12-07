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
  const { skillOptions, majorOptions, jobOptions, schoolOptions } = useMetaData();

  const [education, setEducation] = useState({ school: '', major: '', grade: '' });
  const [careerGoal, setCareerGoal] = useState('');
  const [skills, setSkills] = useState([]);
  const [currentSkill, setCurrentSkill] = useState({ name: '' });
  const [experiences, setExperiences] = useState([]);
  const [currentExperience, setCurrentExperience] = useState({ type: 'PROJECT', role: '', techStack: '' });
  const [evidence, setEvidence] = useState({ certifications: [] });
  const [currentCert, setCurrentCert] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);

  // 학교 검색 (AsyncSelect 용)
  const loadSchoolOptions = (inputValue = '') => {
    const normalized = (inputValue || '').trim().toLowerCase();
    if (!normalized) {
      return Promise.resolve(schoolOptions);
    }
    return Promise.resolve(
      schoolOptions.filter(option =>
        option.label.toLowerCase().includes(normalized)
      )
    );
  };

  const loadCertificationOptions = (inputValue = '') => {
    const query = (inputValue || '').trim();
    if (!query) {
      console.log('[MyPage] 자격증 검색 요청: 빈 입력 -> skip');
      return Promise.resolve([]);
    }
    console.log('[MyPage] 자격증 검색 요청:', query);
    return apiClient.get(`/meta/data/certifications?q=${encodeURIComponent(query)}`)
      .then(res => {
        console.log('[MyPage] 자격증 검색 응답:', res.data);
        return res.data.map(c => ({ value: c, label: c }));
      })
      .catch(err => {
        console.error('[MyPage] 자격증 검색 실패:', err.response?.data || err.message);
        return [];
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
          setSkills(data.techStack?.map(ts => ({ name: ts.name })) || []);
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
      setCurrentSkill({ name: '' });
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
                defaultOptions={schoolOptions}
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
                onChange={(selected) => setCurrentSkill({ name: selected ? selected.value : '' })}
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