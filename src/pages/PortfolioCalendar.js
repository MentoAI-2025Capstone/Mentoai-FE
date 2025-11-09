import React, { useState, useEffect } from 'react';
import './Page.css';

const semesters = [
  '1학년 1학기', '1학년 2학기', '1학년 여름방학', '1학년 겨울방학',
  '2학년 1학기', '2학년 2학기', '2학년 여름방학', '2학년 겨울방학',
  '3학년 1학기', '3학년 2학기', '3학년 여름방학', '3학년 겨울방학',
  '4학년 1학기', '4학년 2학기', '4학년 여름방학', '4학년 겨울방학'
];

function PortfolioCalendar() {
  const [selectedSemester, setSelectedSemester] = useState('3학년 2학기');
  // 학기별 활동 내용을 저장하는 State
  const [savedActivities, setSavedActivities] = useState({
    '3학년 2학기': 'AI 데이터 분석 공모전 (데이터톤) 참가\n- 팀 프로젝트 리더 역할 수행\n- Python, Pandas, Scikit-learn 활용\n- 최종 3위 입상'
  });
  // 현재 텍스트 에디터에 입력된 내용을 관리하는 State
  const [currentText, setCurrentText] = useState('');
  // "저장되었습니다!" 메시지 표시를 관리하는 State
  const [showToast, setShowToast] = useState(false);

  // 선택된 학기가 바뀔 때마다, 저장된 활동 내용을 불러옴
  useEffect(() => {
    setCurrentText(savedActivities[selectedSemester] || '');
  }, [selectedSemester, savedActivities]);

  // 저장 버튼 클릭 시 호출될 함수
  const handleSave = () => {
    setSavedActivities(prev => ({
      ...prev,
      [selectedSemester]: currentText
    }));
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 2000); // 2초 후에 메시지 숨김
  };

  return (
    <div className="page-container">
      {showToast && <div className="toast-message">저장되었습니다!</div>}
      <h2>📝 포트폴리오 기록</h2>
      <p>학기별로 수행한 주요 활동과 성과를 기록하고 관리하세요.</p>

      <div className="semester-grid">
        {semesters.map(semester => (
          <div
            key={semester}
            className={`semester-box ${selectedSemester === semester ? 'selected' : ''}`}
            onClick={() => setSelectedSemester(semester)}
          >
            {semester}
          </div>
        ))}
      </div>

      <div className="activity-editor-card">
        <h3>{selectedSemester} 활동 내용</h3>
        <textarea
          value={currentText}
          onChange={(e) => setCurrentText(e.target.value)}
          placeholder="이곳에 활동 내용을 입력하세요..."
        />
        <div className="editor-actions">
            <div className="file-upload">
                <button>파일 첨부</button>
                <span>선택된 파일 없음</span>
            </div>
            <button className="save-button" onClick={handleSave}>
                저장하기
            </button>
        </div>
      </div>
    </div>
  );
}

export default PortfolioCalendar;