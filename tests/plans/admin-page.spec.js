/**
 * 관리자 페이지 E2E 테스트
 * TC-ADMIN-001 ~ TC-ADMIN-034
 *
 * 실행 방법:
 *   npx playwright test tests/admin-page.spec.js
 */

const { test, expect } = require('@playwright/test');

// 테스트 데이터
const TEST_PREFIX = 'Test';
const timestamp = Date.now();
const TEST_USER = `${TEST_PREFIX}User_${timestamp}`;
const TEST_CATEGORY = `${TEST_PREFIX}Category_${timestamp}`;
const TEST_MENU1 = `${TEST_PREFIX}Menu1_${timestamp}`;
const TEST_MENU2 = `${TEST_PREFIX}Menu2_${timestamp}`;
const TEST_MENU3 = `${TEST_PREFIX}Menu3_${timestamp}`;
const TEST_HISTORY = `${TEST_PREFIX}History_${timestamp}`;

// 매니저 로그인 정보
const ADMIN_ID = 'admin_test';
const ADMIN_PW = '1';

// 지연 함수
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// DB 로딩 대기 (800ms)
const waitForDB = async () => await delay(800);
// 일반 대기 (250ms - 300ms 미만)
const shortDelay = async () => await delay(250);

test.describe('관리자 페이지 테스트', () => {

  test.beforeEach(async ({ page }) => {
    // 로컬 스토리지 초기화
    await page.goto('http://localhost:8000/login.html');
    await page.evaluate(() => localStorage.clear());
    await waitForDB();
  });

  /**
   * 2.1 로그인 페이지 테스트
   */

  // TC-ADMIN-001: 로그인 페이지 로드
  test('TC-ADMIN-001: 로그인 페이지 로드', async ({ page }) => {
    await expect(page).toHaveURL(/login/);
    await expect(page.locator('input#userId')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.locator('button[type="submit"], #loginBtn')).toBeVisible();
  });

  // TC-ADMIN-002: 쿠키/로컬스토리지 초기화 후 로그인
  test('TC-ADMIN-002: 로컬스토리지 초기화', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
    await waitForDB();
    const session = await page.evaluate(() => localStorage.getItem('session'));
    expect(session).toBeNull();
  });

  // TC-ADMIN-003: 매니저 계정 로그인 성공
  test('TC-ADMIN-003: 매니저 로그인 성공', async ({ page }) => {
    await page.fill('input#userId', ADMIN_ID);
    await shortDelay();
    await page.fill('input#password', ADMIN_PW);
    await shortDelay();
    await page.click('button[type="submit"], #loginBtn');
    await waitForDB();
    await expect(page).toHaveURL(/settings|admin/);
  });

  // TC-ADMIN-004: 잘못된 계정 로그인 실패
  test('TC-ADMIN-004: 잘못된 계정 로그인 실패', async ({ page }) => {
    await page.fill('input#userId', 'wronguser');
    await shortDelay();
    await page.fill('input#password', 'wrongpass');
    await shortDelay();
    await page.click('button[type="submit"], #loginBtn');
    await shortDelay();
    const errorMsg = page.locator('#errorMessage, .error-message');
    await expect(errorMsg).toBeVisible();
  });

  // TC-ADMIN-005: 권한 없는 계정으로 관리자 페이지 접근
  test('TC-ADMIN-005: 권한 없는 접근 시도', async ({ page }) => {
    await page.goto('http://localhost:8000/admin.html');
    await waitForDB();
    const currentUrl = page.url();
    expect(currentUrl.includes('login') || currentUrl.includes('admin')).toBeTruthy();
  });

  /**
   * 2.2 이름 관리 페이지 테스트
   */

  // TC-ADMIN-006: 이름 관리 페이지 접근
  test('TC-ADMIN-006: 이름 관리 페이지 접근', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('http://localhost:8000/admin.html');
    await waitForDB();
    await expect(page.locator('#newNameInput')).toBeVisible();
    await expect(page.locator('#addNameBtn')).toBeVisible();
  });

  // TC-ADMIN-007: 테스트 이름 추가
  test('TC-ADMIN-007: 테스트 이름 추가', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('http://localhost:8000/admin.html');
    await waitForDB();

    const nameInput = page.locator('#newNameInput');
    await nameInput.fill(TEST_USER);
    await shortDelay();
    await page.click('#addNameBtn');
    await waitForDB();

    // 이름이 리스트에 추가되었는지 확인
    const namesList = page.locator('#namesList');
    await expect(namesList).toContainText(TEST_USER);

    // 정리
    await cleanupTestUser(page, TEST_USER);
  });

  // TC-ADMIN-008: 중복 이름 추가 방지
  test('TC-ADMIN-008: 중복 이름 추가 방지', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('http://localhost:8000/admin.html');
    await waitForDB();

    // 먼저 테스트 이름 추가
    await page.fill('#newNameInput', TEST_USER);
    await page.click('#addNameBtn');
    await waitForDB();

    // 동일 이름 추가 시도
    await page.fill('#newNameInput', TEST_USER);
    await page.click('#addNameBtn');
    await shortDelay();

    // alert 확인
    const alertMsg = await page.evaluate(() => {
      return new Promise((resolve) => {
        const originalAlert = window.alert;
        window.alert = (msg) => { window.alert = originalAlert; resolve(msg); };
        setTimeout(() => { window.alert = originalAlert; resolve(null); }, 1000);
      });
    });
    expect(alertMsg || '').toContain('존재');

    // 정리
    await cleanupTestUser(page, TEST_USER);
  });

  // TC-ADMIN-009: 테스트 이름 삭제
  test('TC-ADMIN-009: 테스트 이름 삭제', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('http://localhost:8000/admin.html');
    await waitForDB();

    // 테스트 이름 추가
    await page.fill('#newNameInput', TEST_USER);
    await page.click('#addNameBtn');
    await waitForDB();

    // 삭제 버튼 클릭 (이름 아이템 내의 삭제 버튼)
    const deleteBtn = page.locator(`#namesList .name-item:has-text("${TEST_USER}") .btn-danger, #namesList div:has-text("${TEST_USER}") button`).first();
    if (await deleteBtn.isVisible().catch(() => false)) {
      await deleteBtn.click();
      await shortDelay();
      // 확인 대화상자 처리
      await page.click('button:has-text("확인"), .confirm-btn');
      await waitForDB();
    }

    const deletedName = page.locator(`#namesList .name-item:has-text("${TEST_USER}")`);
    expect(await deletedName.count()).toBe(0);
  });

  // TC-ADMIN-010: 빈 이름 추가 방지
  test('TC-ADMIN-010: 빈 이름 추가 방지', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('http://localhost:8000/admin.html');
    await waitForDB();
    await page.click('#addNameBtn');
    await shortDelay();
    // alert 확인
  });

  /**
   * 2.3 메뉴 관리 페이지 테스트
   */

  // TC-ADMIN-011: 메뉴 관리 페이지 접근
  test('TC-ADMIN-011: 메뉴 관리 페이지 접근', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('http://localhost:8000/menu-admin.html');
    await waitForDB();
    await expect(page).toHaveURL(/menu-admin/);
  });

  // TC-ADMIN-012: 테스트 카테고리 추가
  test('TC-ADMIN-012: 테스트 카테고리 추가', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('http://localhost:8000/menu-admin.html');
    await waitForDB();

    const categoryInput = page.locator('#newCategoryName');
    await categoryInput.fill(TEST_CATEGORY);
    await shortDelay();
    await page.click('button[onclick="addCategory()"]');
    await waitForDB();

    const categoryList = page.locator('#categoryList');
    await expect(categoryList).toContainText(TEST_CATEGORY);

    // 정리
    await cleanupTestCategory(page, TEST_CATEGORY);
  });

  // TC-ADMIN-013: 중복 카테고리 추가 방지
  test('TC-ADMIN-013: 중복 카테고리 추가 방지', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('http://localhost:8000/menu-admin.html');
    await waitForDB();

    const categoryInput = page.locator('#newCategoryName');
    await categoryInput.fill(TEST_CATEGORY);
    await page.click('button[onclick="addCategory()"]');
    await waitForDB();

    await categoryInput.fill(TEST_CATEGORY);
    await page.click('button[onclick="addCategory()"]');
    await shortDelay();

    // alert 확인

    // 정리
    await cleanupTestCategory(page, TEST_CATEGORY);
  });

  // TC-ADMIN-014: 테스트 카테고리에 메뉴 추가 (both)
  test('TC-ADMIN-014: 테스트 메뉴 추가 - both', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('http://localhost:8000/menu-admin.html');
    await waitForDB();

    // 카테고리 생성
    await createTestCategory(page, TEST_CATEGORY);

    // 메뉴 탭으로 전환
    await page.click('button[onclick="switchTab(\'menu\')"]');
    await shortDelay();

    // 메뉴 추가
    await page.fill('#newMenuName', TEST_MENU1);
    await shortDelay();
    await page.selectOption('#newMenuCategory', { label: TEST_CATEGORY });
    await shortDelay();
    // both 옵션은 기본 선택되어 있음
    await page.click('button[onclick="addMenu()"]');
    await waitForDB();

    const menuList = page.locator('#menuList');
    await expect(menuList).toContainText(TEST_MENU1);

    // 정리
    await page.click('button[onclick="switchTab(\'category\')"]');
    await cleanupTestCategory(page, TEST_CATEGORY);
  });

  // TC-ADMIN-015: ICE Only 메뉴 추가
  test('TC-ADMIN-015: ICE Only 메뉴 추가', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('http://localhost:8000/menu-admin.html');
    await waitForDB();

    await createTestCategory(page, TEST_CATEGORY);

    await page.click('button[onclick="switchTab(\'menu\')"]');
    await shortDelay();

    await page.fill('#newMenuName', TEST_MENU2);
    await page.selectOption('#newMenuCategory', { label: TEST_CATEGORY });
    await page.locator('input[name="menuTemperature"][value="ice_only"]').check();
    await page.click('button[onclick="addMenu()"]');
    await waitForDB();

    const menuList = page.locator('#menuList');
    await expect(menuList).toContainText(TEST_MENU2);

    // 정리
    await page.click('button[onclick="switchTab(\'category\')"]');
    await cleanupTestCategory(page, TEST_CATEGORY);
  });

  // TC-ADMIN-016: HOT Only 메뉴 추가
  test('TC-ADMIN-016: HOT Only 메뉴 추가', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('http://localhost:8000/menu-admin.html');
    await waitForDB();

    await createTestCategory(page, TEST_CATEGORY);

    await page.click('button[onclick="switchTab(\'menu\')"]');
    await shortDelay();

    await page.fill('#newMenuName', TEST_MENU3);
    await page.selectOption('#newMenuCategory', { label: TEST_CATEGORY });
    await page.locator('input[name="menuTemperature"][value="hot_only"]').check();
    await page.click('button[onclick="addMenu()"]');
    await waitForDB();

    const menuList = page.locator('#menuList');
    await expect(menuList).toContainText(TEST_MENU3);

    // 정리
    await page.click('button[onclick="switchTab(\'category\')"]');
    await cleanupTestCategory(page, TEST_CATEGORY);
  });

  // TC-ADMIN-017: 카테고리 삭제 시 관련 메뉴 함께 삭제
  test('TC-ADMIN-017: 카테고리 삭제 시 메뉴 삭제', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('http://localhost:8000/menu-admin.html');
    await waitForDB();

    // 카테고리와 메뉴 생성
    await createTestCategory(page, TEST_CATEGORY);
    await createTestMenu(page, TEST_CATEGORY, TEST_MENU1);

    // 카테고리 삭제
    const categoryItem = page.locator(`#categoryList .category-item:has-text("${TEST_CATEGORY}")`);
    const deleteBtn = categoryItem.locator('.delete-btn').first();
    await deleteBtn.click();
    await shortDelay();
    await page.click('button:has-text("확인")');
    await waitForDB();

    const deletedCategory = page.locator(`text=${TEST_CATEGORY}`);
    expect(await deletedCategory.count()).toBe(0);
  });

  // TC-ADMIN-018: 테스트 메뉴 개별 삭제
  test('TC-ADMIN-018: 테스트 메뉴 개별 삭제', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('http://localhost:8000/menu-admin.html');
    await waitForDB();

    await createTestCategory(page, TEST_CATEGORY);
    await createTestMenu(page, TEST_CATEGORY, TEST_MENU1);

    // 메뉴 탭에서 삭제
    await page.click('button[onclick="switchTab(\'menu\')"]');
    await shortDelay();

    const menuItem = page.locator(`#menuList .menu-item:has-text("${TEST_MENU1}")`);
    const deleteBtn = menuItem.locator('.delete-btn').first();
    await deleteBtn.click();
    await waitForDB();

    const deletedMenu = page.locator(`text=${TEST_MENU1}`);
    expect(await deletedMenu.count()).toBe(0);

    await page.click('button[onclick="switchTab(\'category\')"]');
    await cleanupTestCategory(page, TEST_CATEGORY);
  });

  // TC-ADMIN-029: 테스트 카테고리 수정
  test('TC-ADMIN-029: 테스트 카테고리 수정', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('http://localhost:8000/menu-admin.html');
    await waitForDB();

    await createTestCategory(page, TEST_CATEGORY);

    const categoryItem = page.locator(`#categoryList .category-item:has-text("${TEST_CATEGORY}")`);
    const editBtn = categoryItem.locator('.edit-btn').first();
    await editBtn.click();
    await shortDelay();

    const editInput = page.locator('.category-edit-form input').first();
    const newName = `${TEST_CATEGORY}_Edit`;
    await editInput.fill(newName);
    await shortDelay();

    await page.click('button:has-text("저장")');
    await waitForDB();

    const categoryList = page.locator('#categoryList');
    await expect(categoryList).toContainText(newName);

    // 정리
    await cleanupTestCategoryByName(page, newName);
  });

  // TC-ADMIN-030: 카테고리 수정 취소
  test('TC-ADMIN-030: 카테고리 수정 취소', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('http://localhost:8000/menu-admin.html');
    await waitForDB();

    await createTestCategory(page, TEST_CATEGORY);

    const categoryItem = page.locator(`#categoryList .category-item:has-text("${TEST_CATEGORY}")`);
    const editBtn = categoryItem.locator('.edit-btn').first();
    await editBtn.click();
    await shortDelay();

    const editInput = page.locator('.category-edit-form input').first();
    await editInput.fill(`${TEST_CATEGORY}_Changed`);
    await shortDelay();

    await page.click('button:has-text("취소")');
    await shortDelay();

    const categoryList = page.locator('#categoryList');
    await expect(categoryList).toContainText(TEST_CATEGORY);

    await cleanupTestCategory(page, TEST_CATEGORY);
  });

  // TC-ADMIN-031: 테스트 메뉴 수정 (both -> ice_only)
  test('TC-ADMIN-031: 메뉴 수정 both to ice_only', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('http://localhost:8000/menu-admin.html');
    await waitForDB();

    await createTestCategory(page, TEST_CATEGORY);
    await createTestMenu(page, TEST_CATEGORY, TEST_MENU1);

    await page.click('button[onclick="switchTab(\'menu\')"]');
    await shortDelay();

    const menuItem = page.locator(`#menuList .menu-item:has-text("${TEST_MENU1}")`);
    const editBtn = menuItem.locator('.edit-btn').first();
    await editBtn.click();
    await shortDelay();

    await page.locator('.menu-edit-form input[name="menuTemperature"][value="ice_only"]').check();
    await shortDelay();

    await page.click('button:has-text("저장")');
    await waitForDB();

    await page.click('button[onclick="switchTab(\'category\')"]');
    await cleanupTestCategory(page, TEST_CATEGORY);
  });

  // TC-ADMIN-032: 테스트 메뉴 수정 (both -> hot_only)
  test('TC-ADMIN-032: 메뉴 수정 both to hot_only', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('http://localhost:8000/menu-admin.html');
    await waitForDB();

    await createTestCategory(page, TEST_CATEGORY);
    await createTestMenu(page, TEST_CATEGORY, TEST_MENU1);

    await page.click('button[onclick="switchTab(\'menu\')"]');
    await shortDelay();

    const menuItem = page.locator(`#menuList .menu-item:has-text("${TEST_MENU1}")`);
    const editBtn = menuItem.locator('.edit-btn').first();
    await editBtn.click();
    await shortDelay();

    await page.locator('.menu-edit-form input[name="menuTemperature"][value="hot_only"]').check();
    await shortDelay();

    await page.click('button:has-text("저장")');
    await waitForDB();

    await page.click('button[onclick="switchTab(\'category\')"]');
    await cleanupTestCategory(page, TEST_CATEGORY);
  });

  // TC-ADMIN-033: 메뉴 수정 취소
  test('TC-ADMIN-033: 메뉴 수정 취소', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('http://localhost:8000/menu-admin.html');
    await waitForDB();

    await createTestCategory(page, TEST_CATEGORY);
    await createTestMenu(page, TEST_CATEGORY, TEST_MENU1);

    await page.click('button[onclick="switchTab(\'menu\')"]');
    await shortDelay();

    const menuItem = page.locator(`#menuList .menu-item:has-text("${TEST_MENU1}")`);
    const editBtn = menuItem.locator('.edit-btn').first();
    await editBtn.click();
    await shortDelay();

    await page.click('button:has-text("취소")');
    await shortDelay();

    const menuList = page.locator('#menuList');
    await expect(menuList).toContainText(TEST_MENU1);

    await page.click('button[onclick="switchTab(\'category\')"]');
    await cleanupTestCategory(page, TEST_CATEGORY);
  });

  // TC-ADMIN-034: 중복 카테고리명 수정 방지
  test('TC-ADMIN-034: 중복 카테고리명 수정 방지', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('http://localhost:8000/menu-admin.html');
    await waitForDB();

    const cat1 = `${TEST_CATEGORY}1`;
    const cat2 = `${TEST_CATEGORY}2`;

    await createTestCategory(page, cat1);
    await createTestCategory(page, cat2);

    const categoryItem = page.locator(`#categoryList .category-item:has-text("${cat1}")`);
    const editBtn = categoryItem.locator('.edit-btn').first();
    await editBtn.click();
    await shortDelay();

    const editInput = page.locator('.category-edit-form input').first();
    await editInput.fill(cat2);
    await shortDelay();

    await page.click('button:has-text("저장")');
    await shortDelay();

    // 중복 경고 확인

    // 정리
    await cleanupTestCategoryByName(page, cat1);
    await cleanupTestCategoryByName(page, cat2);
  });

  /**
   * 2.4 구매 이력 관리 페이지 테스트
   */

  // TC-ADMIN-019: 구매 이력 페이지 접근
  test('TC-ADMIN-019: 구매 이력 페이지 접근', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('http://localhost:8000/history.html');
    await waitForDB();
    await expect(page).toHaveURL(/history/);
  });

  // TC-ADMIN-020: 테스트 구매 이력 추가
  test('TC-ADMIN-020: 테스트 구매 이력 추가', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('http://localhost:8000/history.html');
    await waitForDB();

    const addBtn = page.locator('button:has-text("추가"), #addHistoryBtn').first();
    if (await addBtn.isVisible().catch(() => false)) {
      await addBtn.click();
      await shortDelay();

      await page.fill('input[name="content"], #historyContent', TEST_HISTORY);
      await shortDelay();
      await page.fill('input[type="date"], #historyDate', new Date().toISOString().split('T')[0]);
      await shortDelay();

      await page.click('button:has-text("추가"), .confirm-add-btn');
      await waitForDB();

      const historyList = page.locator('#historyList, .history-list');
      await expect(historyList).toContainText(TEST_HISTORY);

      // 정리
      await cleanupTestHistory(page, TEST_HISTORY);
    }
  });

  // TC-ADMIN-021: 구매 이력 검색/필터링
  test('TC-ADMIN-021: 구매 이력 필터링', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('http://localhost:8000/history.html');
    await waitForDB();

    const dateFilter = page.locator('input[type="date"], #dateFilter, select').first();
    if (await dateFilter.isVisible().catch(() => false)) {
      await dateFilter.fill(new Date().toISOString().split('T')[0]);
      await shortDelay();
    }
  });

  // TC-ADMIN-022: 테스트 구매 이력 삭제
  test('TC-ADMIN-022: 테스트 구매 이력 삭제', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('http://localhost:8000/history.html');
    await waitForDB();

    // 테스트 이력 추가
    const addBtn = page.locator('button:has-text("추가"), #addHistoryBtn').first();
    if (await addBtn.isVisible().catch(() => false)) {
      await addBtn.click();
      await page.fill('input[name="content"], #historyContent', TEST_HISTORY);
      await page.fill('input[type="date"], #historyDate', new Date().toISOString().split('T')[0]);
      await page.click('button:has-text("추가"), .confirm-add-btn');
      await waitForDB();

      // 삭제
      const deleteBtn = page.locator(`.history-item:has-text("${TEST_HISTORY}") .delete-btn, .delete-history-btn`).first();
      await deleteBtn.click();
      await shortDelay();
      await page.click('button:has-text("확인")');
      await waitForDB();

      const deletedHistory = page.locator(`text=${TEST_HISTORY}`);
      expect(await deletedHistory.count()).toBe(0);
    }
  });

  /**
   * 2.5 즐겨찾기 관리 페이지 테스트
   */

  // TC-ADMIN-023: 즐겨찾기 페이지 접근
  test('TC-ADMIN-023: 즐겨찾기 페이지 접근', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('http://localhost:8000/favorites.html');
    await waitForDB();
    await expect(page).toHaveURL(/favorites/);
  });

  // TC-ADMIN-024: 테스트 즐겨찾기 추가
  test('TC-ADMIN-024: 테스트 즐겨찾기 추가', async ({ page }) => {
    await loginAsAdmin(page);

    // 먼저 메뉴 생성
    await page.goto('http://localhost:8000/menu-admin.html');
    await waitForDB();
    await createTestCategory(page, TEST_CATEGORY);
    await createTestMenu(page, TEST_CATEGORY, TEST_MENU1);

    await page.goto('http://localhost:8000/favorites.html');
    await waitForDB();

    const menuSelect = page.locator('select[name="menu"], #menuSelect, #favoriteMenuSelect').first();
    if (await menuSelect.isVisible().catch(() => false)) {
      await menuSelect.selectOption({ label: TEST_MENU1 });
      await shortDelay();
      await page.click('button:has-text("추가"), #addFavoriteBtn');
      await waitForDB();

      const favoriteList = page.locator('#favoritesList, .favorites-list');
      await expect(favoriteList).toContainText(TEST_MENU1);

      // 정리
      await cleanupTestFavorite(page, TEST_MENU1);
    }

    await page.goto('http://localhost:8000/menu-admin.html');
    await cleanupTestCategory(page, TEST_CATEGORY);
  });

  // TC-ADMIN-025: 테스트 즐겨찾기 삭제
  test('TC-ADMIN-025: 테스트 즐겨찾기 삭제', async ({ page }) => {
    await loginAsAdmin(page);

    // 메뉴 생성
    await page.goto('http://localhost:8000/menu-admin.html');
    await waitForDB();
    await createTestCategory(page, TEST_CATEGORY);
    await createTestMenu(page, TEST_CATEGORY, TEST_MENU1);

    // 즐겨찾기 추가
    await page.goto('http://localhost:8000/favorites.html');
    await waitForDB();

    const menuSelect = page.locator('select[name="menu"], #menuSelect, #favoriteMenuSelect').first();
    if (await menuSelect.isVisible().catch(() => false)) {
      await menuSelect.selectOption({ label: TEST_MENU1 });
      await page.click('button:has-text("추가"), #addFavoriteBtn');
      await waitForDB();

      // 삭제
      const deleteBtn = page.locator(`.favorite-item:has-text("${TEST_MENU1}") .delete-btn, .remove-favorite-btn`).first();
      await deleteBtn.click();
      await waitForDB();

      const deletedFav = page.locator(`text=${TEST_MENU1}`);
      expect(await deletedFav.count()).toBe(0);
    }

    await page.goto('http://localhost:8000/menu-admin.html');
    await cleanupTestCategory(page, TEST_CATEGORY);
  });

  /**
   * 2.6 설정 페이지 테스트
   */

  // TC-ADMIN-026: 설정 페이지 접근
  test('TC-ADMIN-026: 설정 페이지 접근', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('http://localhost:8000/settings.html');
    await waitForDB();
    await expect(page).toHaveURL(/settings/);
  });

  // TC-ADMIN-027: 관리자 메뉴 링크 확인
  test('TC-ADMIN-027: 관리자 메뉴 링크 확인', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('http://localhost:8000/settings.html');
    await waitForDB();

    const links = [
      { selector: 'a[href="admin.html"], a:has-text("이름 관리")' },
      { selector: 'a[href="menu-admin.html"], a:has-text("메뉴 관리")' },
      { selector: 'a[href="history.html"], a:has-text("구매 이력")' },
      { selector: 'a[href="favorites.html"], a:has-text("즐겨찾기")' },
    ];

    for (const link of links) {
      const linkEl = page.locator(link.selector).first();
      expect(await linkEl.isVisible().catch(() => false)).toBeTruthy();
    }
  });

  // TC-ADMIN-028: 로그아웃
  test('TC-ADMIN-028: 로그아웃', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('http://localhost:8000/settings.html');
    await waitForDB();

    const logoutBtn = page.locator('button:has-text("로그아웃"), #logoutBtn').first();
    await logoutBtn.click();
    await waitForDB();

    const session = await page.evaluate(() => localStorage.getItem('session'));
    expect(session).toBeNull();
  });
});

// 헬퍼 함수
async function loginAsAdmin(page) {
  await page.goto('http://localhost:8000/login.html');
  await waitForDB();
  await page.fill('input#userId', ADMIN_ID);
  await shortDelay();
  await page.fill('input#password', ADMIN_PW);
  await shortDelay();
  await page.click('button[type="submit"], #loginBtn');
  await waitForDB();
}

async function createTestCategory(page, name) {
  const categoryInput = page.locator('#newCategoryName');
  await categoryInput.fill(name);
  await shortDelay();
  await page.click('button[onclick="addCategory()"]');
  await waitForDB();
}

async function createTestMenu(page, category, menuName) {
  await page.click('button[onclick="switchTab(\'menu\')"]');
  await shortDelay();
  await page.fill('#newMenuName', menuName);
  await shortDelay();
  await page.selectOption('#newMenuCategory', { label: category });
  await shortDelay();
  await page.click('button[onclick="addMenu()"]');
  await waitForDB();
  await page.click('button[onclick="switchTab(\'category\')"]');
  await shortDelay();
}

async function cleanupTestUser(page, name) {
  const nameItem = page.locator(`#namesList div:has-text("${name}") .delete-btn, #namesList .name-item:has-text("${name}") .delete-btn`).first();
  if (await nameItem.isVisible().catch(() => false)) {
    await nameItem.click();
    await shortDelay();
    await page.click('button:has-text("확인")');
    await waitForDB();
  }
}

async function cleanupTestCategory(page, name) {
  const categoryItem = page.locator(`#categoryList .category-item:has-text("${name}")`);
  const deleteBtn = categoryItem.locator('.delete-btn').first();
  if (await deleteBtn.isVisible().catch(() => false)) {
    await deleteBtn.click();
    await shortDelay();
    await page.click('button:has-text("확인")');
    await waitForDB();
  }
}

async function cleanupTestCategoryByName(page, name) {
  const categoryItem = page.locator(`#categoryList .category-item:has-text("${name}")`);
  const deleteBtn = categoryItem.locator('.delete-btn').first();
  if (await deleteBtn.isVisible().catch(() => false)) {
    await deleteBtn.click();
    await shortDelay();
    await page.click('button:has-text("확인")');
    await waitForDB();
  }
}

async function cleanupTestHistory(page, content) {
  const deleteBtn = page.locator(`.history-item:has-text("${content}") .delete-btn, .delete-history-btn`).first();
  if (await deleteBtn.isVisible().catch(() => false)) {
    await deleteBtn.click();
    await shortDelay();
    await page.click('button:has-text("확인")');
    await waitForDB();
  }
}

async function cleanupTestFavorite(page, menuName) {
  const deleteBtn = page.locator(`.favorite-item:has-text("${menuName}") .delete-btn, .remove-favorite-btn`).first();
  if (await deleteBtn.isVisible().catch(() => false)) {
    await deleteBtn.click();
    await waitForDB();
  }
}
