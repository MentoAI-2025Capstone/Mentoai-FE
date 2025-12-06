import React, { useState, useEffect } from 'react';
import './JobFilterModal.css';

const JOB_CATEGORIES = {
  '경영기획·지원': [
    '경영기획', '전략기획', '사업기획', '사업관리',
    '회계·재무·세무', '인사(HR)', '노무', '총무',
    '법무·감사', '행정·사무지원', '비서', '시설·보안·안전'
  ],
  '홍보·마케팅': [
    '마케팅 기획', '브랜드 마케팅', '콘텐츠 마케팅', '퍼포먼스 마케팅',
    '온라인/디지털 마케팅', '홍보(PR)', '광고기획(AE)', '시장조사·분석'
  ],
  '영업': [
    '국내영업', '해외영업', '법인영업', '기술영업',
    '영업관리·지원', '영업기획', 'IT/솔루션 영업'
  ],
  '생산·유통·품질': [
    '생산관리', '공정관리', '품질관리(QA/QC)', '품질보증',
    '물류·유통', '자재·재고관리', '구매·조달'
  ],
  '연구·개발(R&D)': [
    'R&D기획', '기구설계', '회로설계', '반도체설계', '광학설계',
    '로봇·제어', '소재·재료 연구', '화학·에너지 연구'
  ],
  'IT 서비스': [
    '서비스 기획(PM/PO)', '웹/앱 기획', '프로젝트 관리',
    'UI/UX 디자인', '웹디자인', 'GUI 디자인'
  ],
  '개발': [
    '웹 개발(Full Stack)', '프론트엔드 개발', '백엔드/서버 개발',
    '모바일 앱 개발', '게임 개발', '데이터 엔지니어',
    'AI/머신러닝', 'DevOps/인프라', '보안/정보보호',
    '소프트웨어 엔지니어', 'QA 엔지니어'
  ],
  '디자인': [
    '그래픽 디자인', '제품/산업 디자인', '패키지 디자인',
    'VMD/공간 디자인', '영상/모션 디자인'
  ],
  '금융·보험': [
    '금융공학', '자산관리', '투자심사', '리스크관리',
    '여신/수신', '보험계리/언더라이팅'
  ]
};

const JobFilterModal = ({ isOpen, onClose, onApply, initialSelected = [] }) => {
  const [selectedCategory, setSelectedCategory] = useState('경영기획·지원'); // Default selection
  const [checkedItems, setCheckedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Initialize checked items from props
  useEffect(() => {
    if (isOpen) {
      setCheckedItems(initialSelected);
    }
  }, [isOpen, initialSelected]);

  if (!isOpen) return null;

  const handleMainCategoryClick = (category) => {
    setSelectedCategory(category);
  };

  const handleCheckboxChange = (item) => {
    setCheckedItems(prev => {
      if (prev.includes(item)) {
        return prev.filter(i => i !== item);
      } else {
        return [...prev, item];
      }
    });
  };

  const handleReset = () => {
    setCheckedItems([]);
  };

  const handleApply = () => {
    onApply(checkedItems);
    onClose();
  };

  // Filter subitems based on search if needed, currently filtering main view
  const currentSubCategories = JOB_CATEGORIES[selectedCategory] || [];

  return (
    <div className="job-filter-overlay" onClick={onClose}>
      <div className="job-filter-content" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="job-filter-header">
          <h2>직무 필터</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {/* Search (Visual Only for now / Optional Logic) */}
        <div className="job-filter-search">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="직무를 입력해 주세요."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Body */}
        <div className="job-filter-body">
          {/* Left Sidebar */}
          <div className="filter-categories">
            {Object.keys(JOB_CATEGORIES).map(category => (
              <div
                key={category}
                className={`category-item ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => handleMainCategoryClick(category)}
              >
                {category}
              </div>
            ))}
          </div>

          {/* Right Content */}
          <div className="filter-subcategories">
            <h4 style={{ margin: '0 0 20px 0', fontSize: '1.1rem' }}>{selectedCategory}</h4>
            <div className="subcategory-grid">
              {currentSubCategories
                .filter(item => item.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(item => (
                  <label key={item} className="checkbox-label">
                    <input
                      type="checkbox"
                      className="checkbox-input"
                      checked={checkedItems.includes(item)}
                      onChange={() => handleCheckboxChange(item)}
                    />
                    {item}
                  </label>
                ))}
            </div>
            {currentSubCategories.length === 0 && (
              <div style={{ color: '#999', textAlign: 'center', marginTop: '50px' }}>
                표시할 세부 직무가 없습니다.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="job-filter-footer">
          <button className="reset-btn" onClick={handleReset}>
            <span>↺</span> 선택 초기화
          </button>
          <button className="apply-btn" onClick={handleApply}>
            추가 {checkedItems.length > 0 && `(${checkedItems.length})`}
          </button>
        </div>

      </div>
    </div>
  );
};

export default JobFilterModal;
