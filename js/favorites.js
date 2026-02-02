/**
 * 즐겨찾기 관리 JavaScript
 */

// 전역 변수
let currentCategory = '전체';
let currentFavorites = []; // 현재 로드된 즐겨찾기 목록 (문자열 배열)
let tempFavorites = new Set(); // 수정 중인 즐겨찾기 목록 (Set for easy add/remove)

// ========================================
// 초기화
// ========================================

window.addEventListener('DOMContentLoaded', () => {
    if (!initializeFirebase()) {
        alert('Firebase 연결 실패');
        return;
    }

    // 1. UI 먼저 초기화 (사용자가 기다리지 않게 함)
    initializeUI();

    // 2. Firebase 데이터 비동기 로드 및 UI 업데이트
    loadFavoritesData().then(() => {
        // 데이터 로드 완료 확인
        console.log('Firebase 데이터 로드 완료:', Array.from(tempFavorites));

        // 데이터 로드 완료 후 현재 화면 업데이트 (체크 표시 및 재정렬)
        renderMenuList(currentCategory);
        console.log('UI 업데이트 완료');
    }).catch(err => {
        console.error('즐겨찾기 데이터 로딩 실패:', err);
        // 실패해도 메뉴 선택은 가능하도록 유지
    });

    // 버튼 이벤트
    document.getElementById('saveBtn').addEventListener('click', saveAndExit);
    document.getElementById('cancelBtn').addEventListener('click', () => window.location.href = 'index.html');
});

/**
 * Firebase에서 즐겨찾기 데이터 로드
 * 3초 내에 응답 없으면 빈 배열로 진행
 */
function loadFavoritesData() {
    return new Promise((resolve) => {
        const favoritesRef = getRef('favorites');

        // 타임아웃 설정 (3초)
        const timeout = setTimeout(() => {
            console.warn('Firebase 응답 시간 초과, 빈 데이터로 시작합니다.');
            resolve();
        }, 3000);

        favoritesRef.once('value', (snapshot) => {
            clearTimeout(timeout); // 타임아웃 해제
            currentFavorites = snapshot.val() || [];

            // Set으로 변환하여 관리 (중복 방지 및 빠른 조회)
            tempFavorites = new Set(currentFavorites);
            console.log('로드된 즐겨찾기:', currentFavorites);
            resolve();
        }, (error) => {
            clearTimeout(timeout);
            console.error('Firebase 읽기 오류:', error);
            resolve(); // 에러 나도 진행
        });
    });
}

// ========================================
// UI 렌더링
// ========================================

function initializeUI() {
    renderCategoryButtons();
    renderMenuList(currentCategory);
}

function renderCategoryButtons() {
    const container = document.getElementById('categoryButtons');
    container.innerHTML = '';

    CATEGORIES.forEach(category => {
        const button = document.createElement('button');
        button.className = 'category-btn';
        button.textContent = category;

        if (category === '전체') button.classList.add('active');

        button.addEventListener('click', () => {
            document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentCategory = category;
            renderMenuList(category);
        });

        container.appendChild(button);
    });
}

function renderMenuList(category) {
    const container = document.getElementById('menuList');
    const menuCount = document.getElementById('menuCount');
    container.innerHTML = '';

    // 1. 카테고리 필터링
    let filteredMenu = MENU_DATA;
    if (category !== '전체') {
        filteredMenu = MENU_DATA.filter(item => item.category === category);
    }

    // 2. 정렬 로직 수정: "이미 체크된 항목"을 최상단으로
    // 원본 데이터를 건드리지 않기 위해 복사본 생성하여 정렬
    const sortedMenu = [...filteredMenu].sort((a, b) => {
        const aFav = tempFavorites.has(a.name);
        const bFav = tempFavorites.has(b.name);

        // 즐겨찾기 여부로 먼저 정렬 (즐겨찾기가 먼저)
        if (aFav && !bFav) return -1;
        if (!aFav && bFav) return 1;

        // 그 외에는 이름순 정렬
        return a.name.localeCompare(b.name, 'ko');
    });

    menuCount.textContent = `(${sortedMenu.length}개)`;

    // 3. 렌더링
    sortedMenu.forEach((item, index) => {
        const isFavorite = tempFavorites.has(item.name);

        const div = document.createElement('div');
        div.className = `menu-item ${isFavorite ? 'is-favorite' : ''}`;

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.className = 'favorite-checkbox';
        input.id = `fav-${category}-${index}`; // ID 유니크하게 변경
        input.checked = isFavorite; // 상태 반영

        // 체크박스 변경 이벤트
        input.addEventListener('change', (e) => {
            console.log('체크 변경:', item.name, e.target.checked);
            if (e.target.checked) {
                tempFavorites.add(item.name);
                div.classList.add('is-favorite');
            } else {
                tempFavorites.delete(item.name);
                div.classList.remove('is-favorite');
            }
        });

        const label = document.createElement('label');
        label.htmlFor = `fav-${category}-${index}`;
        label.className = 'menu-label';
        label.textContent = item.name;
        if (isFavorite) {
            label.innerHTML = `⭐ ${item.name}`; // 별 아이콘 추가
        }

        div.appendChild(input);
        div.appendChild(label);
        container.appendChild(div);
    });
}

// ========================================
// 저장 및 종료
// ========================================

function saveAndExit() {
    const favoritesRef = getRef('favorites');
    const newFavoritesList = Array.from(tempFavorites); // Set -> Array

    favoritesRef.set(newFavoritesList).then(() => {
        alert('즐겨찾기가 저장되었습니다.');
        window.location.href = 'index.html';
    }).catch(err => {
        console.error(err);
        alert('저장 중 오류가 발생했습니다.');
    });
}
