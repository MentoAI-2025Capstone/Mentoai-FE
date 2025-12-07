import { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';

export const useMetaData = () => {
  const [skillOptions, setSkillOptions] = useState([]);
  const [majorOptions, setMajorOptions] = useState([]);
  const [jobOptions, setJobOptions] = useState([]);
  const [schoolOptions, setSchoolOptions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 기술 스택 데이터 가져오기
        const skillsRes = await apiClient.get('/meta/data/skills');
        if (skillsRes.data && Array.isArray(skillsRes.data)) {
          setSkillOptions(skillsRes.data.map(s => ({ value: s, label: s })));
        }

        // 학과 데이터 가져오기
        const majorsRes = await apiClient.get('/meta/data/majors');
        if (majorsRes.data && Array.isArray(majorsRes.data)) {
          setMajorOptions(majorsRes.data.map(m => ({ value: m, label: m })));
        }

        // 직업 데이터 가져오기
        const jobsRes = await apiClient.get('/meta/data/jobs');
        if (jobsRes.data && Array.isArray(jobsRes.data)) {
          setJobOptions(jobsRes.data.map(j => ({ value: j, label: j })));
        }

        // 학교 데이터 가져오기
        const schoolsRes = await apiClient.get('/meta/data/schools');
        if (schoolsRes.data && Array.isArray(schoolsRes.data)) {
          setSchoolOptions(schoolsRes.data.map(s => ({ value: s, label: s })));
        }
      } catch (error) {
        console.error("메타데이터 로딩 실패:", error);
      }
    };

    fetchData();
  }, []);

  return { skillOptions, majorOptions, jobOptions, schoolOptions };
};
