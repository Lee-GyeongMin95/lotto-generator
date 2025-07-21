import React, { useState } from 'react';
import './App.css';

// 번호에 따라 색상 클래스를 반환하는 헬퍼 함수
const getBallColorClass = (number) => {
  if (number >= 1 && number <= 10) return 'yellow-ball';
  if (number >= 11 && number <= 20) return 'blue-ball';
  if (number >= 21 && number <= 30) return 'red-ball';
  if (number >= 31 && number <= 40) return 'black-ball';
  if (number >= 41 && number <= 45) return 'green-ball';
  return 'purple-ball'; // 기본값
};

// 날짜 포맷팅 헬퍼 함수
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${year}/${month}/${day} (${['일', '월', '화', '수', '목', '금', '토'][date.getDay()]}) ${hours}:${minutes}:${seconds}`;
};

// 다음 토요일 날짜 계산 헬퍼 함수
const getNextSaturday = () => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7;
  const nextSaturday = new Date(today);
  nextSaturday.setDate(today.getDate() + daysUntilSaturday);
  return formatDate(nextSaturday).split(' ')[0] + ' (토)'; // 날짜와 (토)만 반환
};

// 로또 티켓 컴포넌트
const LottoTicket = ({ noteData, noteIndex, onDelete, isModal = false, onCloseModal, onMouseEnterPrediction, onMouseLeavePrediction, onPredictionClick }) => {
  const getPredictionChar = (index) => String.fromCharCode(65 + index); // A, B, C, D, E
  const totalAmount = noteData.length * 1000;

  return (
    <div className="note-ticket-container">
      <div className="note-ticket">
        <div className="note-ticket-header">
          <span className="lotto-title">LOTTO 9/9</span>
          <div className="qr-code-placeholder"></div>
        </div>
        <p className="round-info">노트{noteIndex + 1}장</p>
        <p className="date-info">발행일 : {noteData[0].issueDate}</p>
        <p className="date-info">추첨일 : {noteData[0].drawDate} HR :20987</p>
        <div className="barcode-placeholder-top"></div>
        <div className="prediction-list">
          {noteData.map((result, resultIndex) => (
            <p 
              key={resultIndex} 
              className="prediction-item"
              onMouseEnter={() => onMouseEnterPrediction && onMouseEnterPrediction(result.numbers)}
              onMouseLeave={() => onMouseLeavePrediction && onMouseLeavePrediction()}
              onClick={(e)=> {
                e.stopPropagation(); // 부모 요소로의 이벤트 전파를 막음
                if (onPredictionClick){
                  onPredictionClick(result.numbers);
                }
              }}
            >
              <span className="prediction-char">{getPredictionChar(resultIndex)}</span>
              <span className="prediction-type">{result.type === '자동' ? '자 동' : '수 동'}</span>
              {result.numbers.map(num => 
                <span key={num} className="prediction-number">{num.toString().padStart(2, '0')}</span>
              )}
            </p>
          ))}
        </div>
        <p className="amount-info">금액 <span className="amount-value">W {totalAmount.toLocaleString()}</span></p>
        <div className="barcode-placeholder-bottom"></div>
        {!isModal && <button className="delete-note-btn" onClick={(e) => { e.stopPropagation(); onDelete(); }}>X</button>}
        {isModal && <button className="close-modal-btn" onClick={onCloseModal}>X</button>}
      </div>
      <div className="pink-sidebar">www.urbanbrush.net</div>
    </div>
  );
};

// 2D 애니메이션 컴포넌트 (장식용)
const LottoAnimation = () => {
  const ballCount = 45;
  return (
    <div className="lotto-machine-2d-sphere">
      {[...Array(ballCount)].map((_, i) => (
        <div
          key={i}
          className={`bouncing-ball ball-color-${i % 5}`}
          style={{
            '--i': Math.random(),
            '--j': Math.random(),
            '--k': Math.random(),
            'animationDuration': `${2 + Math.random() * 2}s`,
            'animationDelay': `${Math.random() * -4}s`
          }}
        />
      ))}
    </div>
  );
};

function App() {
  const [allNumbers] = useState(Array.from({ length: 45 }, (_, i) => i + 1));
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState([[]]);
  const [manualSelection, setManualSelection] = useState([]);
  const [setsToGenerate, setSetsToGenerate] = useState(1);
  const [isNotesExpanded, setIsNotesExpanded] = useState(false); // 노트 스택 확장 여부
  const [selectedNoteForModal, setSelectedNoteForModal] = useState(null); // 모달에 표시될 노트 데이터
  const [highlightedNumbers, setHighlightedNumbers] = useState([]); // 그리드 하이라이트 번호
  const [noteZIndexes, setNoteZIndexes] = useState(new Map()); // 노트 동적 z-index
  const [topZIndex, setTopZIndex] = useState(1000); // 마우스 오버 시 부여할 높은 z-index
  
  const isUIBlocked = isGenerating || selectedNoteForModal !== null;

  const addToHistory = (newEntries) => {
    console.log(history);
    setHistory(prev => {
      const newHistory = JSON.parse(JSON.stringify(prev));
      let lastNote = newHistory[newHistory.length - 1];
      // 현재 노트의 인덱스를 기반으로 다음 노트 번호를 결정
      const currentNoteIndex = newHistory.length - 1;
      const nextNoteNumber = newHistory[currentNoteIndex].length === 0 ? currentNoteIndex + 1 : currentNoteIndex + 1;

      for (const entry of newEntries) {
        if (lastNote.length >= 5) {
          newHistory.push([]);
          lastNote = newHistory[newHistory.length - 1];
        }
        lastNote.push({
          ...entry,
          issueDate: formatDate(new Date()),
          drawDate: getNextSaturday(),
          noteNumber: nextNoteNumber // 노트 번호 추가
        });
      }
      return newHistory;
    });
  };

  const handleAutoGenerate = () => {
    setIsGenerating(true);
    const newEntries = [];
    for (let i = 0; i < setsToGenerate; i++) {
      const numbers = new Set();
      while (numbers.size < 6) {
        numbers.add(Math.floor(Math.random() * 45) + 1);
      }
      newEntries.push({ type: '자동', numbers: Array.from(numbers).sort((a, b) => a - b) });
    }
    
    setTimeout(() => {
      addToHistory(newEntries);
      setIsGenerating(false);
    }, 1000);
  };

  const handleManualAdd = () => {
    if (manualSelection.length !== 6) return;
    addToHistory([{ type: '수동', numbers: [...manualSelection].sort((a, b) => a - b) }]);
    setManualSelection([]);
  };

  const handleGridNumberClick = (number) => {
    setManualSelection(prev => {
      const newSelection = prev.includes(number) ? prev.filter(n => n !== number) : [...prev, number];
      return newSelection.length > 6 ? prev : newSelection;
    });
  };

  const handleNoteItemClick = (noteData) => {
    // (수정)// setManualSelection(noteData[0].numbers); // 노트 클릭 시 해당 번호로 수동 선택 그리드 업데이트
    setSelectedNoteForModal(noteData); // 모달 열기
  };
  // 예측 번호 줄 클릭 시 그리드를 업데이트하는 핸들러 추가
  const handlePredictionClick = (numbers) => {
    setManualSelection(numbers);
  };
    // 마우스 오버 시 호출될 함수
  const handleMouseEnter = (index) => {
    setNoteZIndexes(prev => {
      const newMap = new Map(prev);
      newMap.set(index, topZIndex + 1); // 현재 최고 z-index보다 1 높은 값 부여
      return newMap;
    });
    setTopZIndex(prev => prev + 1); // 다음 오버를 위해 최고 z-index 업데이트
  };

  // 마우스가 떠날 때 호출될 함수
  const handleMouseLeave = (index, initialZIndex) => {
    setNoteZIndexes(prev => {
      const newMap = new Map(prev);
      newMap.set(index, initialZIndex); // 원래 z-index로 복원
      return newMap;
    });
  };

  const deleteNote = (noteIndex) => {
    setHistory(prev => {
        const newHistory = prev.filter((_, i) => i !== noteIndex);
        return newHistory.length === 0 ? [[]] : newHistory;
    });
    setSelectedNoteForModal(null); // 모달 닫기
  };

  const closeNoteModal = () => {
    setSelectedNoteForModal(null);
  };

  return (
    <div className="App">
      <header className="App-header"><h1>로또 번호 생성기</h1></header>
      
      <LottoAnimation />

      <div className="controls-container">
        <div className="generation-toggle">
          <span>자동 생성 개수:</span>
          {[1, 2, 3, 4, 5].map(num => 
            <button 
              key={num} 
              className={`toggle-btn ${setsToGenerate === num ? 'active' : ''}`} 
              onClick={() => setSetsToGenerate(num)} 
              disabled={isUIBlocked}>
              {num}
            </button>
          )}
        </div>
        <button className="generate-btn" onClick={handleAutoGenerate} disabled={isUIBlocked}>
          {isGenerating ? '생성중...' : '자동 생성'}
        </button>
        <button className="manual-add-btn" onClick={handleManualAdd} disabled={manualSelection.length !== 6 || isUIBlocked}>수동 추가</button>
      </div>

      <main className="main-content">
        <div className="manual-selection-area">
          <h3>번호 직접 선택 (6개)</h3>
          <div className="number-grid">
            {allNumbers.map(number => (
              <div
                key={number}
                className={`number-ball ${manualSelection.includes(number) ? `manual-selected ${getBallColorClass(number)}` : ''} ${highlightedNumbers.includes(number) ? 'highlighted' : ''}`}
                onClick={() => handleGridNumberClick(number)}>
                {number}
              </div>
            ))}
          </div>
        </div>

        {history[0].length > 0 && (
          <div 
            className={`notes-area ${history.length >= 1 ? 'expandable' : ''} ${isNotesExpanded ? 'expanded' : ''}`}
            // onMouseEnter={() => history.length >= 3 && setIsNotesExpanded(true)}
            // onMouseLeave={() => history.length >= 3 && setIsNotesExpanded(false)}
          >
            <h3>예측 번호 노트</h3>
            <div className="notes-wrapper">
              {history.map((note, noteIndex) =>{
                // 현재 노트의 z-index를 상태에서 가져오거나, 없으면 기본 noteIndex 사용
                const currentZIndex = noteZIndexes.has(noteIndex) ? noteZIndexes.get(noteIndex) : noteIndex;
               return (
                <div 
                  key={noteIndex} 
                  className="note"
                  style={isNotesExpanded ? {
                    zIndex: currentZIndex  // 동적으로 변하는 z-index
                  } : {
                    top: `${noteIndex * 25}px`,
                    left: `${noteIndex * 20}px`, 
                    zIndex: currentZIndex  // 동적으로 변하는 z-index
                  }}
                  onMouseEnter={() => handleMouseEnter(noteIndex, noteIndex)} // 마우스 진입 시
                  onMouseLeave={() => handleMouseLeave(noteIndex, noteIndex)} // 마우스 이탈 시
                  onClick={() => handleNoteItemClick(note)} // 노트 클릭 시 모달 열기
                >
                  <LottoTicket 
                    noteData={note} 
                    noteIndex={noteIndex} 
                    onDelete={() => deleteNote(noteIndex)} 
                    onMouseEnterPrediction={setHighlightedNumbers}
                    onMouseLeavePrediction={() => setHighlightedNumbers([])}
                    onPredictionClick={handlePredictionClick} // 추가 
                  />
                </div>
                )}
              )
            }
            </div>
          </div>
        )}
      </main>

      {selectedNoteForModal && (
        <div className="note-modal-overlay" onClick={closeNoteModal}>
          <div className="note-modal-content" onClick={(e) => e.stopPropagation()}>
            <LottoTicket 
              noteData={selectedNoteForModal} 
              noteIndex={history.indexOf(selectedNoteForModal)} 
              isModal={true} 
              onCloseModal={closeNoteModal}
              onPredictionClick={handlePredictionClick} //추가
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;