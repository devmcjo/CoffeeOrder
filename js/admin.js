/**
 * 이름 관리 페이지 JavaScript
 * Firebase Realtime Database와 연동하여 이름 리스트 관리
 */

// ========================================
// 초기화
// ========================================

/**
 * 페이지 로드 시 실행
 */
window.addEventListener('DOMContentLoaded', () => {
    console.log('이름 관리 페이지 로드 완료');

    // Firebase 초기화
    if (!initializeFirebase()) {
        alert('Firebase 연결에 실패했습니다. 페이지를 새로고침해주세요.');
        return;
    }

    // 초기 데이터 설정 (14명 기본 이름)
    initializeDefaultNames();

    // 이벤트 리스너 등록
    registerEventListeners();

    // 이름 리스트 실시간 업데이트 리스너
    listenToNames();
});

// ========================================
// Firebase 데이터 관리
// ========================================

/**
 * 기본 이름 14명을 Firebase에 초기 설정
 * 이미 데이터가 있으면 건너뜁니다
 */
function initializeDefaultNames() {
    const namesRef = getRef('names');

    namesRef.once('value', (snapshot) => {
        const currentNames = snapshot.val();

        // 이미 데이터가 있으면 건너뜀
        if (currentNames && currentNames.length > 0) {
            console.log('기존 이름 데이터가 있습니다.');
            return;
        }

        // 기본 14명 이름 배열
        const defaultNames = [
            '김리언', '김종민', '김종완', '김주형',
            '백근명', '백근토', '송혜성', '심승미',
            '유지연', '정주은', '조명철', '조윤철',
            '조은혜', '조혜인'
        ];

        // Firebase에 저장
        namesRef.set(defaultNames).then(() => {
            console.log('기본 이름 14명이 등록되었습니다.');
        }).catch(error => {
            console.error('기본 이름 등록 실패:', error);
        });
    });
}

/**
 * 이름 리스트 실시간 업데이트 리스너
 */
function listenToNames() {
    const namesRef = getRef('names');

    namesRef.on('value', (snapshot) => {
        const names = snapshot.val() || [];
        renderNamesList(names);
    });
}

/**
 * 이름 리스트를 화면에 렌더링
 * @param {Array<string>} names - 이름 배열
 */
function renderNamesList(names) {
    const container = document.getElementById('namesList');
    const countSpan = document.getElementById('nameCount');

    container.innerHTML = '';
    countSpan.textContent = `(${names.length}명)`;

    if (names.length === 0) {
        container.innerHTML = '<div class="empty-message">등록된 이름이 없습니다</div>';
        return;
    }

    // 오름차순 정렬
    const sortedNames = [...names].sort((a, b) => a.localeCompare(b, 'ko'));

    sortedNames.forEach(name => {
        const div = document.createElement('div');
        div.className = 'name-item';

        const span = document.createElement('span');
        span.className = 'name-item-text';
        span.textContent = name;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '×';
        deleteBtn.addEventListener('click', () => deleteName(name));

        div.appendChild(span);
        div.appendChild(deleteBtn);
        container.appendChild(div);
    });
}

// ========================================
// 이벤트 리스너
// ========================================

/**
 * 이벤트 리스너 등록
 */
function registerEventListeners() {
    // 이름 추가 버튼
    document.getElementById('addNameBtn').addEventListener('click', addName);

    // Enter 키로 이름 추가
    document.getElementById('newNameInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addName();
        }
    });

    // 주문 페이지로 돌아가기 버튼
    document.getElementById('backToOrderBtn').addEventListener('click', () => {
        window.location.href = 'index.html';
    });
}

// ========================================
// 이름 관리 함수
// ========================================

/**
 * 새 이름 추가
 */
function addName() {
    const input = document.getElementById('newNameInput');
    const newName = input.value.trim();

    // 유효성 검사
    if (!newName || newName === '') {
        alert('이름을 입력해주세요!');
        return;
    }

    if (newName.length > 20) {
        alert('이름은 20자 이하로 입력해주세요!');
        return;
    }

    // Firebase에서 현재 이름 리스트 가져오기
    const namesRef = getRef('names');

    namesRef.once('value', (snapshot) => {
        const currentNames = snapshot.val() || [];

        // 중복 확인
        if (currentNames.includes(newName)) {
            alert('이미 등록된 이름입니다!');
            return;
        }

        // 새 이름 추가
        const updatedNames = [...currentNames, newName];

        // Firebase에 저장
        namesRef.set(updatedNames).then(() => {
            alert(`✅ "${newName}"이(가) 추가되었습니다!`);
            input.value = '';
            input.focus();
        }).catch(error => {
            alert('이름 추가 중 오류가 발생했습니다.');
            console.error(error);
        });
    });
}

/**
 * 이름 삭제
 * @param {string} nameToDelete - 삭제할 이름
 */
function deleteName(nameToDelete) {
    if (!confirm(`"${nameToDelete}"을(를) 삭제하시겠습니까?`)) {
        return;
    }

    const namesRef = getRef('names');

    namesRef.once('value', (snapshot) => {
        const currentNames = snapshot.val() || [];

        // 삭제할 이름 제외
        const updatedNames = currentNames.filter(name => name !== nameToDelete);

        // Firebase에 저장
        namesRef.set(updatedNames).then(() => {
            console.log(`"${nameToDelete}"이(가) 삭제되었습니다.`);
        }).catch(error => {
            alert('삭제 중 오류가 발생했습니다.');
            console.error(error);
        });
    });
}

// ========================================
// 유틸리티 함수
// ========================================

/**
 * 페이지 언로드 시 정리 작업
 */
window.addEventListener('beforeunload', () => {
    // Firebase 리스너 정리
    const namesRef = getRef('names');
    if (namesRef) namesRef.off();
});
