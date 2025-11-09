import React, { useState, useEffect } from 'react';
import './Page.css';

// 초기 샘플 데이터
const initialCourses = [
  { name: 'AI 프로그래밍', credits: 3, grade: 'A+' },
  { name: '자료구조', credits: 3, grade: 'A0' },
  { name: '운영체제', credits: 3, grade: 'B+' },
  { name: '데이터베이스', credits: 3, grade: 'A+' },
];

// 성적을 점수로 변환하는 헬퍼 함수
const gradeToPoint = (grade) => {
  const gradeMap = { 'A+': 4.5, 'A0': 4.0, 'B+': 3.5, 'B0': 3.0, 'C+': 2.5, 'C0': 2.0, 'D+': 1.5, 'D0': 1.0, 'F': 0 };
  return gradeMap[grade] || 0;
};

function GraduationCalculator() {
  const [courses, setCourses] = useState(initialCourses);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({ name: '', credits: '', grade: 'A+' });
  const [stats, setStats] = useState({ totalCredits: 0, gpa: 0 });

  // courses 배열이 변경될 때마다 학점과 평점 재계산
  useEffect(() => {
    const totalCredits = courses.reduce((sum, course) => sum + Number(course.credits), 0);
    const totalPoints = courses.reduce((sum, course) => sum + (Number(course.credits) * gradeToPoint(course.grade)), 0);
    const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;
    setStats({ totalCredits, gpa });
  }, [courses]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCourse(prev => ({ ...prev, [name]: value }));
  };

  const handleAddCourse = (e) => {
    e.preventDefault();
    if (newCourse.name && newCourse.credits) {
      setCourses(prev => [...prev, { ...newCourse, credits: Number(newCourse.credits) }]);
      setNewCourse({ name: '', credits: '', grade: 'A+' });
      setIsModalOpen(false);
    }
  };

  return (
    <div className="page-container">
      <h2>🎓 졸업요건 계산기</h2>
      <p>이수 현황을 바탕으로 졸업까지 남은 요건을 자동으로 계산하고 시뮬레이션합니다.</p>
      
      <div className="calculator-layout">
        <div className="calculator-card">
          <div className="card-header">
            <h3>AI소프트웨어학과 25학번</h3>
            <span>1학년 1학기 이수</span>
          </div>
          <div className="gpa-info">
            <div>취득학점: <strong>{stats.totalCredits} / 130</strong></div>
            <div>평점평균: <strong>{stats.gpa}</strong></div>
          </div>
          <div className="credit-details">
            {/* ... progress bar sections ... */}
          </div>
        </div>
        <div className="calculator-card course-list-card">
          <div className="card-header">
            <h4>최근 수강 과목</h4>
            <button className="add-button" onClick={() => setIsModalOpen(true)}>+ 학점 추가</button>
          </div>
          <table>
            <thead>
              <tr>
                <th className="course-name">과목명</th>
                <th>학점</th>
                <th>성적</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course, index) => (
                <tr key={index}>
                  <td className="course-name">{course.name}</td>
                  <td>{course.credits}</td>
                  <td className="course-grade">{course.grade}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close-button" onClick={() => setIsModalOpen(false)}>×</button>
            <h3>새 학점 입력</h3>
            <form onSubmit={handleAddCourse}>
              <div className="form-group">
                <label>과목명</label>
                <input type="text" name="name" value={newCourse.name} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>학점</label>
                <input type="number" name="credits" value={newCourse.credits} onChange={handleInputChange} min="1" max="4" required />
              </div>
              <div className="form-group">
                <label>성적</label>
                <select name="grade" value={newCourse.grade} onChange={handleInputChange}>
                  {['A+', 'A0', 'B+', 'B0', 'C+', 'C0', 'D+', 'D0', 'F'].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <button type="submit" className="submit-button">저장하기</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default GraduationCalculator;