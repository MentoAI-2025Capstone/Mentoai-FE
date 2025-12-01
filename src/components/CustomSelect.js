import React, { useState, useRef, useEffect } from 'react';
import './CustomSelect.css'; // 이 CSS 파일도 새로 만듭니다.

import React, { useState, useRef, useEffect } from 'react';
import './CustomSelect.css'; // 이 CSS 파일도 새로 만듭니다.

/**
 * 커스텀 드롭다운 컴포넌트
 * @param {Array} options - { value: string, label: string } 형태의 객체 배열
 * @param {string} value - 현재 선택된 값
 * @param {function} onChange - 값 변경 시 호출될 함수 (새로운 value를 인자로 받음)
 */
function CustomSelect({ options, value, onChange, placeholder = "선택해주세요", isSearchable = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);
  const searchInputRef = useRef(null);

  // 드롭다운 열고 닫기
  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen && isSearchable) {
      setSearchTerm(''); // 열 때 검색어 초기화
      setTimeout(() => {
        if (searchInputRef.current) searchInputRef.current.focus();
      }, 100);
    }
  };

  // 옵션 선택 시
  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  // 컴포넌트 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  // 현재 값(value)에 해당하는 라벨(label)을 찾습니다.
  const selectedOption = options.find(opt => opt.value === value);
  const displayValue = selectedOption ? selectedOption.label : placeholder;

  // 검색어에 따른 필터링
  const filteredOptions = isSearchable
    ? options.filter(opt => opt.label.toLowerCase().includes(searchTerm.toLowerCase()))
    : options;

  return (
    <div className="custom-select-wrapper" ref={wrapperRef}>
      {/* 1. 현재 선택된 값을 보여주는 트리거 버튼 */}
      <div
        className={`custom-select-trigger ${isOpen ? 'open' : ''}`}
        onClick={handleToggle}
      >
        {displayValue}
        <div className="custom-arrow"></div>
      </div>

      {/* 2. 옵션 목록 (isOpen이 true일 때만 보임) */}
      {isOpen && (
        <div className="custom-options-container">
          {isSearchable && (
            <div className="custom-search-wrapper">
              <input
                ref={searchInputRef}
                type="text"
                className="custom-search-input"
                placeholder="검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()} // 클릭 시 닫힘 방지
              />
            </div>
          )}
          <ul className="custom-options-list">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
                <li
                  key={option.value}
                  className={`custom-option ${option.value === value ? 'selected' : ''}`}
                  onClick={() => handleSelect(option.value)}
                >
                  {option.label}
                </li>
              ))
            ) : (
              <li className="custom-option no-result">검색 결과가 없습니다.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default CustomSelect;