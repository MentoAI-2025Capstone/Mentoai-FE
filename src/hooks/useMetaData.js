import { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';

export const useMetaData = () => {
  const [skillOptions, setSkillOptions] = useState([]);
  const [certOptions, setCertOptions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 기술 스택 데이터 가져오기
        const skillsRes = await apiClient.get('/meta/data/skills');
        if (skillsRes.data && Array.isArray(skillsRes.data)) {
          setSkillOptions(skillsRes.data.map(s => ({ value: s, label: s })));
        }

        // 자격증 데이터 가져오기
        const certsRes = await apiClient.get('/meta/data/certifications');
        if (certsRes.data && Array.isArray(certsRes.data)) {
          setCertOptions(certsRes.data.map(c => ({ value: c, label: c })));
        }
      } catch (error) {
        console.error("메타데이터 로딩 실패:", error);
      }
    };

    fetchData();
  }, []);

  return { skillOptions, certOptions };
};
