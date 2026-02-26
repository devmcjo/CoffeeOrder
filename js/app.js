/**
 * 메가커피 주문 애플리케이션 메인 JavaScript
 * Firebase Realtime Database와 연동하여 실시간 주문 관리
 */

// ========================================
// 전역 변수
// ========================================

let currentCategory = '전체'; // 현재 선택된 카테고리
let isMultiOrderMode = false; // 복수 주문 모드 여부
let userFavorites = []; // 사용자 설정 즐겨찾기 목록
let cartViewMode = 'byPerson'; // 장바구니 보기 모드: 'byPerson' | 'byMenu'

// ========================================
// 초기화 함수
// ========================================

/**
 * 페이지 로드 시 실행되는 초기화 함수
 */
window.addEventListener('DOMContentLoaded', () => {
    console.log('페이지 로드 완료');

    // Firebase 초기화
    if (!initializeFirebase()) {
        alert('Firebase 연결에 실패했습니다. 페이지를 새로고침해주세요.');
        return;
    }

    // UI 초기화
    initializeUI();

    // 이벤트 리스너 등록
    registerEventListeners();

    // 이름 리스트 로드
    loadNames();

    // 즐겨찾기 로드
    loadUserFavorites();

    // 장바구니 실시간 업데이트 리스너 등록
    listenToCart();

    // 자정 클리어 타이머 시작
    startMidnightClearTimer();

    // 초기 UI 상태 체크 (뒤로가기 대응)
    updateNameInputVisibility();

    // 초기 메뉴 비활성화 (이름 미선택 상태)
    updateMenuState();
});

/**
 * 뒤로가기(bfcache) 대응을 위한 전역 리스너
 */
window.addEventListener('pageshow', (event) => {
    // 페이지가 캐시로부터 복구된 경우에도 UI 상태를 다시 체크
    updateNameInputVisibility();
    updateMenuState();
});

// ========================================
// UI 초기화
// ========================================

/**
 * UI 요소들을 초기화하는 함수
 * 카테고리 버튼과 메뉴 리스트를 렌더링합니다
 */
function initializeUI() {
    // 카테고리 버튼 생성
    renderCategoryButtons();

    // 메뉴 리스트 렌더링
    renderMenuList(currentCategory);
}

/**
 * 카테고리 버튼들을 생성하고 렌더링
 */
function renderCategoryButtons() {
    const container = document.getElementById('categoryButtons');
    container.innerHTML = '';

    CATEGORIES.forEach(category => {
        const button = document.createElement('button');
        button.className = 'category-btn';
        button.textContent = category;
        button.dataset.category = category;

        // 전체 카테고리는 기본 선택
        if (category === '전체') {
            button.classList.add('active');
        }

        // 클릭 이벤트
        button.addEventListener('click', () => {
            // 모든 버튼 비활성화
            document.querySelectorAll('.category-btn').forEach(btn => {
                btn.classList.remove('active');
            });

            // 현재 버튼 활성화
            button.classList.add('active');
            currentCategory = category;

            // 메뉴 리스트 재렌더링
            renderMenuList(category);
        });

        container.appendChild(button);
    });
}

/**
 * 메뉴 리스트를 렌더링
 * @param {string} category - 표시할 카테고리 ('전체'면 모든 메뉴 표시)
 */
/**
 * 메뉴 리스트를 렌더링
 * @param {string} category - 표시할 카테고리 ('전체'면 모든 메뉴 표시)
 * @param {string} keyword - 검색어 (옵션)
 */
function renderMenuList(category, keyword = '') {
    const container = document.getElementById('menuList');
    const menuCount = document.getElementById('menuCount');
    container.innerHTML = '';

    // 카테고리별 필터링
    let filteredMenu = MENU_DATA;
    if (category !== '전체') {
        filteredMenu = MENU_DATA.filter(item => item.category === category);
    }

    // 검색어 필터링
    if (keyword) {
        const lowerKeyword = keyword.toLowerCase();
        const isChosungOnly = /^[ㄱ-ㅎ\s]+$/.test(keyword);

        filteredMenu = filteredMenu.filter(item => {
            const name = item.name.toLowerCase();

            // 1. 일반 텍스트 포함 검색 (기본)
            if (name.includes(lowerKeyword)) return true;

            // 2. 초성 검색 (입력값이 초성으로만 구성된 경우 또는 항상 체크)
            const nameChosung = getChosung(item.name);
            if (nameChosung.includes(lowerKeyword)) return true;

            return false;
        });
    }

    // 정렬: 즐겨찾기(전체 공유) > 일반 메뉴 (이름순)
    filteredMenu.sort((a, b) => {
        const aFav = userFavorites.includes(a.name);
        const bFav = userFavorites.includes(b.name);

        // 1. 즐겨찾기 우선 상단 배치
        if (aFav && !bFav) return -1;
        if (!aFav && bFav) return 1;

        // 2. 이름순 정렬
        return a.name.localeCompare(b.name, 'ko');
    });

    // 메뉴 개수 표시
    menuCount.textContent = `(${filteredMenu.length}개)`;

    // 메뉴 항목 생성
    filteredMenu.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'menu-item-wrapper';

        const inputType = isMultiOrderMode ? 'checkbox' : 'radio';
        const inputName = isMultiOrderMode ? '' : 'menu';

        const input = document.createElement('input');
        input.type = inputType;
        input.id = `menu-${index}`;
        input.value = item.name;
        input.dataset.index = index;
        if (inputName) input.name = inputName;

        const label = document.createElement('label');
        label.htmlFor = `menu-${index}`;
        label.textContent = item.name;
        label.className = 'menu-label';

        // 즐겨찾기 메뉴 강조 (공유된 즐겨찾기)
        if (userFavorites.includes(item.name)) {
            label.classList.add('user-favorite');
            // 즐겨찾기 아이콘 추가
            label.innerHTML = `⭐ ${item.name}`;
            div.classList.add('favorite-item-wrapper'); // 스타일링을 위한 클래스 추가
        }

        // ICE/HOT 선택 버튼 그룹
        const tempButtons = document.createElement('div');
        tempButtons.className = 'temp-buttons';
        tempButtons.style.display = 'none'; // 기본적으로 숨김
        tempButtons.id = `temp-${index}`;

        // ICE Only 조건: 
        // 1. 카테고리가 '에이드&주스', '스무디&프라페'인 경우
        // 2. 카테고리가 '티'이면서 이름에 '아이스티'가 포함된 경우
        const isIceOnly = ['에이드&주스', '스무디&프라페'].includes(item.category) ||
            (item.category === '티' && item.name.includes('아이스티'));

        const iceBtn = document.createElement('button');
        iceBtn.type = 'button';
        iceBtn.className = 'temp-btn temp-ice active'; // 기본 ICE
        iceBtn.textContent = '🧊 ICE';
        iceBtn.dataset.temp = 'ICE';
        iceBtn.dataset.index = index;

        const hotBtn = document.createElement('button');
        hotBtn.type = 'button';
        hotBtn.className = 'temp-btn temp-hot';
        hotBtn.textContent = '🔥 HOT';
        hotBtn.dataset.temp = 'HOT';
        hotBtn.dataset.index = index;

        // ICE Only 처리
        if (isIceOnly) {
            hotBtn.disabled = true;
            hotBtn.style.opacity = '0.5';
            hotBtn.style.cursor = 'not-allowed';
            hotBtn.title = '아이스 전용 메뉴입니다.';
            // 강제 active 제거 및 ICE 활성화는 아래 이벤트에서 보장
        }

        // 온도 버튼 클릭 이벤트
        iceBtn.addEventListener('click', () => {
            iceBtn.classList.add('active');
            hotBtn.classList.remove('active');
        });

        hotBtn.addEventListener('click', () => {
            if (isIceOnly) return; // 클릭 방지
            hotBtn.classList.add('active');
            iceBtn.classList.remove('active');
        });

        tempButtons.appendChild(iceBtn);
        tempButtons.appendChild(hotBtn);

        // 메뉴 선택 시 온도 버튼 표시/숨김
        input.addEventListener('change', () => {
            if (input.checked) {
                // 단일 선택 모드(라디오)인 경우, 다른 모든 온도 버튼 숨기기
                if (!isMultiOrderMode) {
                    document.querySelectorAll('.temp-buttons').forEach(tb => {
                        if (tb.id !== `temp-${index}`) {
                            tb.style.display = 'none';
                            // 다른 버튼들 기본값으로 리셋
                            const tempIce = tb.querySelector('.temp-ice');
                            const tempHot = tb.querySelector('.temp-hot');
                            if (tempIce) tempIce.classList.add('active');
                            if (tempHot) tempHot.classList.remove('active');
                        }
                    });
                }

                // ICE Only라면 ICE 자동 선택 및 HOT 비활성 시각화 유지
                if (isIceOnly) {
                    iceBtn.classList.add('active');
                    hotBtn.classList.remove('active');
                }

                tempButtons.style.display = 'flex';
            } else {
                tempButtons.style.display = 'none';
                // 기본값으로 ICE 선택 (상태 초기화)
                iceBtn.classList.add('active');
                hotBtn.classList.remove('active');
            }
        });

        const menuItem = document.createElement('div');
        menuItem.className = 'menu-item';
        menuItem.appendChild(input);
        menuItem.appendChild(label);

        div.appendChild(menuItem);
        div.appendChild(tempButtons);
        container.appendChild(div);
    });
}


// ========================================
// 이벤트 리스너 등록
// ========================================

/**
 * 모든 UI 요소에 이벤트 리스너를 등록
 */
function registerEventListeners() {
    // 이름 선택 드롭다운
    document.getElementById('nameSelect').addEventListener('change', () => {
        updateNameInputVisibility();
        updateMenuState();
    });

    // 기타 입력 필드
    document.getElementById('customName').addEventListener('input', () => {
        updateMenuState();
    });

    // 복수 주문 모드 체크박스
    document.getElementById('multiOrderMode').addEventListener('change', (e) => {
        isMultiOrderMode = e.target.checked;
        renderMenuList(currentCategory);
    });

    // 주문 담기 버튼
    document.getElementById('addToCartBtn').addEventListener('click', addToCart);

    // 장바구니 보기 버튼
    document.getElementById('viewCartBtn').addEventListener('click', () => {
        document.getElementById('cartModal').classList.add('show');
    });

    // 이름 관리 버튼
    document.getElementById('manageNamesBtn').addEventListener('click', () => {
        window.location.href = 'admin.html';
    });

    // 즐겨찾기 관리 버튼
    document.getElementById('manageFavoritesBtn').addEventListener('click', () => {
        window.location.href = 'favorites.html';
    });

    // ----------------------------------------
    // ----------------------------------------
    // [검색 기능 추가]
    // ----------------------------------------
    // ----------------------------------------
    // [검색 기능] 상시 노출로 변경됨
    // ----------------------------------------
    const searchInput = document.getElementById('searchInput');

    // 검색 입력창이 있으면 이벤트 등록
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const keyword = e.target.value.trim();
            renderMenuList(currentCategory, keyword);
        });
    }

    // 장바구니 보기 모드 radio button
    document.querySelectorAll('input[name="cartViewMode"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                cartViewMode = e.target.value;
                // 현재 orders 데이터를 다시 불러와서 렌더링
                const ordersRef = getRef('orders');
                ordersRef.once('value', (snapshot) => {
                    const orders = snapshot.val() || {};
                    renderCart(orders);
                });
            }
        });
    });

    // 모달 닫기 버튼
    document.getElementById('closeCartBtn').addEventListener('click', () => {
        document.getElementById('cartModal').classList.remove('show');
    });

    // 장바구니 초기화 버튼
    document.getElementById('clearCartBtn').addEventListener('click', clearCart);

    // 모달 배경 클릭 시 닫기
    document.getElementById('cartModal').addEventListener('click', (e) => {
        if (e.target.id === 'cartModal') {
            document.getElementById('cartModal').classList.remove('show');
        }
    });
}

/**
 * 이름 선택 값에 따라 직접 입력창 노출 여부를 업데이트
 */
function updateNameInputVisibility() {
    const nameSelect = document.getElementById('nameSelect');
    const customInput = document.getElementById('customName');

    if (!nameSelect || !customInput) return;

    if (nameSelect.value === 'custom') {
        customInput.style.display = 'block';
    } else {
        customInput.style.display = 'none';
        if (nameSelect.value === '') {
            customInput.value = '';
        }
    }
}

/**
 * 이름 선택 상태에 따라 메뉴 활성화/비활성화
 */
function updateMenuState() {
    const nameSelect = document.getElementById('nameSelect');
    const customNameInput = document.getElementById('customName');
    const menuList = document.getElementById('menuList');
    const categoryButtons = document.querySelectorAll('.category-btn');
    const multiOrderMode = document.getElementById('multiOrderMode');

    let hasValidName = false;

    if (nameSelect.value && nameSelect.value !== '') {
        if (nameSelect.value === 'custom') {
            hasValidName = customNameInput.value.trim() !== '';
        } else {
            hasValidName = true;
        }
    }

    // 메뉴 리스트 비활성화/활성화
    if (hasValidName) {
        menuList.classList.remove('disabled');
        categoryButtons.forEach(btn => btn.disabled = false);
        multiOrderMode.disabled = false;
    } else {
        menuList.classList.add('disabled');
        categoryButtons.forEach(btn => btn.disabled = true);
        multiOrderMode.disabled = true;
    }
}

// ========================================
// Firebase 데이터 관리
// ========================================

/**
 * Firebase에서 이름 리스트를 로드하여 드롭다운에 표시
 */
function loadNames() {
    const namesRef = getRef('names');

    namesRef.on('value', (snapshot) => {
        const names = snapshot.val() || [];
        const select = document.getElementById('nameSelect');

        // 기존 옵션 제거 (첫 번째와 마지막 제외)
        const firstOption = select.options[0];
        // 'custom' 옵션을 찾아서 보존
        let customOption = null;
        for (let i = 0; i < select.options.length; i++) {
            if (select.options[i].value === 'custom') {
                customOption = select.options[i];
                break;
            }
        }

        select.innerHTML = '';
        select.appendChild(firstOption);

        // 이름 추가 (오름차순 정렬)
        names.sort((a, b) => a.localeCompare(b, 'ko'));
        names.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            select.appendChild(option);
        });

        // 기타 옵션 추가 (없으면 새로 생성)
        if (customOption) {
            select.appendChild(customOption);
        } else {
            const option = document.createElement('option');
            option.value = 'custom';
            option.textContent = '기타 (직접 입력)';
            select.appendChild(option);
        }
    });
}

/**
 * Firebase에서 즐겨찾기 목록 로드
 */
function loadUserFavorites() {
    const favoritesRef = getRef('favorites');

    favoritesRef.on('value', (snapshot) => {
        userFavorites = snapshot.val() || [];
        // 즐겨찾기 데이터가 변경되면 메뉴 리스트 다시 렌더링
        renderMenuList(currentCategory);
    });
}

/**
 * 장바구니 실시간 업데이트를 리스닝
 */
function listenToCart() {
    const ordersRef = getRef('orders');

    ordersRef.on('value', (snapshot) => {
        const orders = snapshot.val() || {};
        renderCart(orders);
    });
}

/**
 * 장바구니를 렌더링
 * @param {Object} orders - 주문 데이터 객체
 */
function renderCart(orders) {
    const cartList = document.getElementById('cartList');
    const totalOrdersSpan = document.getElementById('totalOrders');
    const totalDrinksSpan = document.getElementById('totalDrinks');

    cartList.innerHTML = '';

    const orderArray = Object.entries(orders);

    if (orderArray.length === 0) {
        cartList.innerHTML = '<div class="empty-message">장바구니가 비어있습니다</div>';
        totalOrdersSpan.textContent = '0';
        totalDrinksSpan.textContent = '0';
        return;
    }

    let totalDrinks = 0;

    // 보기 모드에 따라 다른 렌더링 방식 적용
    if (cartViewMode === 'byMenu') {
        // 메뉴순 보기 안내 메시지
        const hintDiv = document.createElement('div');
        hintDiv.className = 'cart-view-hint';
        hintDiv.textContent = 'ℹ️ 삭제는 "주문자별 보기" 모드에서 가능합니다';
        cartList.appendChild(hintDiv);

        // 카테고리 순서 정의
        const categoryOrder = ['커피', '디카페인', '음료', '티', '에이드&주스', '스묘디&프라페'];

        // 메뉴 기준으로 데이터 그룹화 (카테고리 포함)
        const menuGroups = {};

        // 메뉴 기준으로 데이터 그룹화
        orderArray.forEach(([orderId, orderData]) => {
            totalDrinks += orderData.drinks.length;

            orderData.drinks.forEach(drink => {
                // drink 형식: "아메리칸 (ICE)"
                if (!menuGroups[drink]) {
                    // 메뉴 이름에서 카테고리 찾기
                    const menuName = drink.replace(/ \(ICE\)$| \(HOT\)$/, '');
                    const menuItem = MENU_DATA.find(item => item.name === menuName);
                    const category = menuItem ? menuItem.category : '기타';

                    menuGroups[drink] = {
                        names: [],
                        orderIds: [],
                        category: category,
                        menuName: menuName,
                        temp: drink.includes('(HOT)') ? 'HOT' : 'ICE'
                    };
                }
                // 같은 주문자가 여러 잔 주문한 경우 이름을 여러 번 추가
                menuGroups[drink].names.push(orderData.name);
                menuGroups[drink].orderIds.push(orderId);
            });
        });

        // 카테고리별로 그룹화
        const categoryGroups = {};
        categoryOrder.forEach(cat => categoryGroups[cat] = []);
        categoryGroups['기타'] = [];

        Object.entries(menuGroups).forEach(([drinkKey, data]) => {
            if (categoryGroups[data.category]) {
                categoryGroups[data.category].push({ drinkKey, ...data });
            } else {
                categoryGroups['기타'].push({ drinkKey, ...data });
            }
        });

        // 각 카테고리 렌더링
        categoryOrder.forEach(category => {
            const drinks = categoryGroups[category];
            if (drinks.length === 0) return; // 해당 카테고리에 음료가 없으면 표시하지 않음

            // 카테고리 헤더
            const categoryHeader = document.createElement('div');
            categoryHeader.className = 'cart-category-header';
            categoryHeader.textContent = category;
            cartList.appendChild(categoryHeader);

            // 카테고리 내 음료 정렬 (이름순)
            drinks.sort((a, b) => a.menuName.localeCompare(b.menuName, 'ko'));

            drinks.forEach(drinkData => {
                const drinkCount = drinkData.names.length;
                const tempEmoji = drinkData.temp === 'HOT' ? '🔥' : '🧊';

                const div = document.createElement('div');
                div.className = 'cart-item';

                const content = document.createElement('div');
                content.className = 'cart-item-content';

                const name = document.createElement('div');
                name.className = 'cart-item-name';

                // 메뉴 이름과 온도 이모지, 잔 수 표시 (ICE/HOT 글자 유지)
                const menuText = document.createElement('span');
                menuText.className = 'menu-title';
                menuText.innerHTML = `${tempEmoji} ${drinkData.menuName} (${drinkData.temp})`;
                name.appendChild(menuText);

                // 잔 수 뱃지 추가 (1잔 vs 2잔 이상 클래스 다르게)
                const countBadge = document.createElement('span');
                const badgeClass = drinkCount === 1 ? 'single' : 'multiple';
                countBadge.className = `drink-count-badge ${badgeClass}`;
                countBadge.textContent = `${drinkCount}잔`;
                name.appendChild(countBadge);

                const names = document.createElement('div');
                names.className = 'cart-item-drinks';

                // 주문자 이름들을 콤마로 구분하여 표시 (중복 포함)
                const uniqueNames = drinkData.names;
                const nameCount = {};
                uniqueNames.forEach(name => {
                    nameCount[name] = (nameCount[name] || 0) + 1;
                });

                // 이름 표시 (같은 이름이 여러 번이면 Nx 표시)
                const displayNames = Object.entries(nameCount).map(([name, count]) => {
                    return count > 1 ? `${name} x${count}` : name;
                });

                names.textContent = displayNames.join(', ');

                content.appendChild(name);
                content.appendChild(names);

                div.appendChild(content);
                cartList.appendChild(div);
            });
        });

        totalOrdersSpan.textContent = orderArray.length;
        totalDrinksSpan.textContent = totalDrinks;
    } else {
        // 주문자별 보기 (기존 방식)
        orderArray.forEach(([orderId, orderData]) => {
            totalDrinks += orderData.drinks.length;

            const div = document.createElement('div');
            div.className = 'cart-item';

            const content = document.createElement('div');
            content.className = 'cart-item-content';

            const name = document.createElement('div');
            name.className = 'cart-item-name';
            name.textContent = orderData.name;

            const drinks = document.createElement('div');
            drinks.className = 'cart-item-drinks';
            drinks.innerHTML = orderData.drinks.join('<br>');

            content.appendChild(name);
            content.appendChild(drinks);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = '×';
            deleteBtn.addEventListener('click', () => deleteOrder(orderId));

            div.appendChild(content);
            div.appendChild(deleteBtn);
            cartList.appendChild(div);
        });

        totalOrdersSpan.textContent = orderArray.length;
        totalDrinksSpan.textContent = totalDrinks;
    }
}

// ========================================
// 주문 관리 함수
// ========================================

/**
 * 주문을 장바구니에 추가
 */
function addToCart() {
    // 이름 검증
    const nameSelect = document.getElementById('nameSelect');
    const customNameInput = document.getElementById('customName');

    let name = nameSelect.value;
    if (name === 'custom') {
        name = customNameInput.value.trim();
    }

    if (!name || name === '') {
        alert('이름을 선택하거나 입력해주세요!');
        return;
    }

    // 선택된 음료 검증 및 온도 정보 수집
    const selectedDrinks = [];
    const inputs = isMultiOrderMode
        ? document.querySelectorAll('.menu-item-wrapper input[type="checkbox"]:checked')
        : document.querySelectorAll('.menu-item-wrapper input[type="radio"]:checked');

    inputs.forEach(input => {
        const index = input.dataset.index;
        const drinkName = input.value;

        // 온도 버튼에서 선택된 온도 가져오기
        const tempButtons = document.getElementById(`temp-${index}`);
        const activeTemp = tempButtons.querySelector('.temp-btn.active');
        const temp = activeTemp ? activeTemp.dataset.temp : 'ICE';

        // "음료명 (온도)" 형식으로 저장
        selectedDrinks.push(`${drinkName} (${temp})`);
    });

    if (selectedDrinks.length === 0) {
        alert('음료를 선택해주세요!');
        return;
    }

    // 1인당 수량 제한 (20잔)
    if (selectedDrinks.length > 20) {
        alert(`한 번에 최대 20잔까지만 주문할 수 있습니다!\n현재 선택: ${selectedDrinks.length}잔`);
        return;
    }

    // 전체 수량 제한 확인 (100잔)
    checkTotalLimit(selectedDrinks.length).then(canAdd => {
        if (!canAdd) {
            return;
        }

        // Firebase에 주문 추가
        const ordersRef = getRef('orders');
        const newOrderRef = ordersRef.push();

        newOrderRef.set({
            name: name,
            drinks: selectedDrinks,
            timestamp: Date.now()
        }).then(() => {
            alert(`✅ 주문이 추가되었습니다!\n\n이름: ${name}\n음료: ${selectedDrinks.length}잔`);

            // 선택 초기화
            inputs.forEach(input => {
                input.checked = false;
                // 온도 버튼도 숨김
                const index = input.dataset.index;
                const tempButtons = document.getElementById(`temp-${index}`);
                if (tempButtons) {
                    tempButtons.style.display = 'none';
                }
            });

            // 이름 선택 초기화 (custom이 아닌 경우)
            if (nameSelect.value !== 'custom') {
                nameSelect.selectedIndex = 0;
            }
        }).catch(error => {
            alert('주문 추가 중 오류가 발생했습니다. 다시 시도해주세요.');
            console.error(error);
        });
    });
}

/**
 * 전체 장바구니 수량 제한 확인
 * @param {number} newDrinksCount - 추가하려는 음료 개수
 * @returns {Promise<boolean>} 추가 가능 여부
 */
function checkTotalLimit(newDrinksCount) {
    return new Promise((resolve) => {
        const ordersRef = getRef('orders');

        ordersRef.once('value', (snapshot) => {
            const orders = snapshot.val() || {};
            let currentTotal = 0;

            Object.values(orders).forEach(order => {
                currentTotal += order.drinks.length;
            });

            const newTotal = currentTotal + newDrinksCount;

            if (newTotal > 100) {
                alert(`⚠️ 장바구니 최대 용량 초과!\n\n현재 장바구니: ${currentTotal}잔\n추가하려는 수량: ${newDrinksCount}잔\n합계: ${newTotal}잔\n\n최대 100잔까지만 담을 수 있습니다.`);
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
}

/**
 * 개별 주문 삭제
 * @param {string} orderId - 삭제할 주문 ID
 */
function deleteOrder(orderId) {
    if (!confirm('이 주문을 삭제하시겠습니까?')) {
        return;
    }

    const orderRef = getRef(`orders/${orderId}`);
    orderRef.remove().then(() => {
        console.log('주문이 삭제되었습니다.');
    }).catch(error => {
        alert('삭제 중 오류가 발생했습니다.');
        console.error(error);
    });
}

/**
 * 장바구니 전체 초기화
 */
function clearCart() {
    if (!confirm('⚠️ 장바구니를 전체 초기화하시겠습니까?\n\n모든 주문이 삭제되며, 이 작업은 되돌릴 수 없습니다.')) {
        return;
    }

    const ordersRef = getRef('orders');
    ordersRef.remove().then(() => {
        alert('✅ 장바구니가 초기화되었습니다.');
    }).catch(error => {
        alert('초기화 중 오류가 발생했습니다.');
        console.error(error);
    });
}

// ========================================
// 자정 자동 클리어
// ========================================

/**
 * 자정 이후 + 마지막 주문으로부터 1시간 경과 시 자동으로 장바구니를 초기화하는 타이머 시작
 */
function startMidnightClearTimer() {
    // 1분마다 체크 수행 (서버 부하 방지)
    setInterval(() => {
        const now = new Date();
        const hours = now.getHours();

        // 조건 1: 자정 이후인가? (0시 ~ 5시 사이)
        if (hours >= 0 && hours < 5) {
            const ordersRef = getRef('orders');

            ordersRef.once('value', (snapshot) => {
                const orders = snapshot.val();
                if (!orders) return; // 장바구니가 이미 비어있으면 종료

                // 모든 주문 중 가장 최신 타임스탬프 찾기
                let maxTimestamp = 0;
                Object.values(orders).forEach(order => {
                    if (order.timestamp > maxTimestamp) {
                        maxTimestamp = order.timestamp;
                    }
                });

                const oneHourMillis = 60 * 60 * 1000;
                const currentTime = Date.now();

                // 조건 2: 마지막 주문으로부터 1시간 이상 지났는가?
                if (currentTime > maxTimestamp + oneHourMillis) {
                    console.log('초기화 조건 만족 (자정 이후 & 1시간 유휴) - 장바구니 자동 초기화');
                    ordersRef.remove().catch(error => {
                        console.error('자동 초기화 실패:', error);
                    });
                }
            });
        }
    }, 60000); // 1분마다 체크
}

// ========================================
// 유틸리티 함수
// ========================================

/**
 * 한글 문자열에서 초성을 추출합니다.
 * @param {string} text - 초성을 추출할 대상 문자열
 * @returns {string} 추출된 초성 문자열
 */
function getChosung(text) {
    const chosungs = [
        'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ',
        'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
    ];
    let result = '';

    for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i) - 44032;
        if (code > -1 && code < 11172) {
            result += chosungs[Math.floor(code / 588)];
        } else {
            result += text.charAt(i);
        }
    }
    return result;
}

/**
 * 페이지 언로드 시 정리 작업 (선택사항)
 */
window.addEventListener('beforeunload', () => {
    // Firebase 리스너 정리
    const namesRef = getRef('names');
    const ordersRef = getRef('orders');

    if (namesRef) namesRef.off();
    if (ordersRef) ordersRef.off();
});
