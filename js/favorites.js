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

    // 초기 로딩
    loadFavoritesData().then(() => {
        initializeUI();
    });

    // 버튼 이벤트
    document.getElementById('saveBtn').addEventListener('click', saveAndExit);
    document.getElementById('cancelBtn').addEventListener('click', () => window.location.href = 'index.html');
});

/**
 * Firebase에서 즐겨찾기 데이터 로드 (한 번만 로드)
 */
function loadFavoritesData() {
    return new Promise((resolve) => {
        const favoritesRef = getRef('favorites');
        favoritesRef.once('value', (snapshot) => {
            currentFavorites = snapshot.val() || [];
            // Set으로 변환하여 관리 (중복 방지 및 빠른 조회)
            tempFavorites = new Set(currentFavorites);
            resolve();
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
        input.id = `fav-${index}`;
        input.checked = isFavorite; // 상태 반영

        // 체크박스 변경 이벤트
        input.addEventListener('change', (e) => {
            if (e.target.checked) {
                tempFavorites.add(item.name);
                div.classList.add('is-favorite');
            } else {
                tempFavorites.delete(item.name);
                div.classList.remove('is-favorite');
            }
        });

        const label = document.createElement('label');
        label.htmlFor = `fav-${index}`;
        label.className = 'menu-label';
        label.textContent = item.name;
        // 라벨 클릭 시 체크박스 토글은 기본 동작이므로 별도 처리 불필요

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
