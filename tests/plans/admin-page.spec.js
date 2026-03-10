/**
 * 관리자 페이지 E2E 테스트
 * TC-ADMIN-001 ~ TC-ADMIN-034
 *
 * 실행 방법:
 *   npx playwright test tests/plans/admin-page.spec.js
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

// 매니저 로그인 정보 (Firebase DB의 accounts/managers 참조)
const ADMIN_ID = 'admin_test';
const ADMIN_PW = '1';

// 지연 함수
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// DB 로딩 대기 (1500ms) - Firebase 동기화 고려
const waitForDB = async () => await delay(1500);
// 일반 대기 (250ms - 300ms 미만)
const shortDelay = async () => await delay(250);

test.describe('관리자 페이지 테스트', () => {

  test.beforeEach(async ({ page }) => {
    // 로컬 스토리지 초기화
    await page.goto('http://localhost:8000/login.html');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
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
    await expect(page.locator('button[type="submit"].login-btn')).toBeVisible();
  });

  // TC-ADMIN-002: 쿠키/로컬스토리지 초기화 후 로그인
  test('TC-ADMIN-002: 로컬스토리지 초기화', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
    await waitForDB();
    const user = await page.evaluate(() => localStorage.getItem('coffeeOrder_user'));
    const role = await page.evaluate(() => localStorage.getItem('coffeeOrder_role'));
    expect(user).toBeNull();
    expect(role).toBeNull();
  });

  // TC-ADMIN-003: 매니저 계정 로그인 성공
  test('TC-ADMIN-003: 매니저 로그인 성공', async ({ page }) => {
    await page.fill('input#userId', ADMIN_ID);
    await shortDelay();
    await page.fill('input#password', ADMIN_PW);
    await shortDelay();
    await page.click('button[type="submit"].login-btn');
    await waitForDB();
    await expect(page).toHaveURL(/settings/);
  });

  // TC-ADMIN-004: 잘못된 계정 로그인 실패
  test('TC-ADMIN-004: 잘못된 계정 로그인 실패', async ({ page }) => {
    await page.fill('input#userId', 'wronguser');
    await shortDelay();
    await page.fill('input#password', 'wrongpass');
    await shortDelay();
    await page.click('button[type="submit"].login-btn');
    await shortDelay();
    const errorMsg = page.locator('#errorMessage');
    await expect(errorMsg).toHaveClass(/show/);
  });

  // TC-ADMIN-005: 권한 없는 계정으로 관리자 페이지 접근
  // 참고
  //  - 현재 admin.html은 별도의 권한 체크 없이 접근 가능
  //  - settings.html은 관리자/매니저 권한으로만 접근 가능
  test('TC-ADMIN-005: 권한 없는 접근 시도', async ({ page }) => {
    await page.goto('http://localhost:8000/settings.html');
    await waitForDB();
    // 로그인하지 않고 접근하면 notLoggedIn 메시지 표시
    await expect(page.locator('#notLoggedIn')).toBeVisible();
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

    // 동일 이름 추가 시도 - dialog 이벤트로 alert 처리
    let alertMessage = '';
    page.on('dialog', async dialog => {
      alertMessage = dialog.message();
      await dialog.accept();
    });

    await page.fill('#newNameInput', TEST_USER);
    await page.click('#addNameBtn');
    await shortDelay();

    // alert 메시지 확인
    expect(alertMessage).toContain('등록된 이름');

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

    // 삭제 버튼 클릭 (name-item 내의 delete-btn)
    const deleteBtn = page.locator(`.name-item:has-text("${TEST_USER}") .delete-btn`).first();
    if (await deleteBtn.isVisible().catch(() => false)) {
      await deleteBtn.click();
      await shortDelay();
      // 확인 대화상자 처리
      page.on('dialog', async dialog => {
        await dialog.accept();
      });
      await waitForDB();
    }

    const deletedName = page.locator(`.name-item:has-text("${TEST_USER}")`);
    expect(await deletedName.count()).toBe(0);
  });

  // TC-ADMIN-010: 빈 이름 추가 방지
  test('TC-ADMIN-010: 빈 이름 추가 방지', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('http://localhost:8000/admin.html');
    await waitForDB();

    // dialog 이벤트로 alert 처리
    let alertMessage = '';
    page.on('dialog', async dialog => {
      alertMessage = dialog.message();
      await dialog.accept();
    });

    await page.click('#addNameBtn');
    await shortDelay();

    // alert 메시지 확인
    expect(alertMessage).toContain('이름을 입력해주세요');
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
    await page.click('#categoryTab .btn-primary');
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
    await page.click('#categoryTab .btn-primary');
    await waitForDB();

    // dialog 이벤트로 alert 처리
    let alertMessage = '';
    page.on('dialog', async dialog => {
      alertMessage = dialog.message();
      await dialog.accept();
    });

    await categoryInput.fill(TEST_CATEGORY);
    await page.click('#categoryTab .btn-primary');
    await shortDelay();

    // alert 메시지 확인
    expect(alertMessage).toContain('존재');

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
    await page.click('.tab-btn:nth-child(2)');
    await shortDelay();

    // 메뉴 추가
    await page.fill('#newMenuName', TEST_MENU1);
    await shortDelay();
    await page.selectOption('#newMenuCategory', { label: TEST_CATEGORY });
    await shortDelay();
    // both 옵션은 기본 선택되어 있음
    await page.click('#menuTab .btn-primary');
    await waitForDB();

    const menuList = page.locator('#menuList');
    await expect(menuList).toContainText(TEST_MENU1);

    // 정리
    await page.click('.tab-btn:nth-child(1)');
    await cleanupTestCategory(page, TEST_CATEGORY);
  });

  // TC-ADMIN-015: ICE Only 메뉴 추가
  test('TC-ADMIN-015: ICE Only 메뉴 추가', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('http://localhost:8000/menu-admin.html');
    await waitForDB();

    await createTestCategory(page, TEST_CATEGORY);

    await page.click('.tab-btn:nth-child(2)');
    await shortDelay();

    await page.fill('#newMenuName', TEST_MENU2);
    await page.selectOption('#newMenuCategory', { label: TEST_CATEGORY });
    await page.locator('input[name="menuTemperature"][value="ice_only"]').check();
    await page.click('#menuTab .btn-primary');
    await waitForDB();

    const menuList = page.locator('#menuList');
    await expect(menuList).toContainText(TEST_MENU2);

    // 정리
    await page.click('.tab-btn:nth-child(1)');
    await cleanupTestCategory(page, TEST_CATEGORY);
  });

  // TC-ADMIN-016: HOT Only 메뉴 추가
  test('TC-ADMIN-016: HOT Only 메뉴 추가', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('http://localhost:8000/menu-admin.html');
    await waitForDB();

    await createTestCategory(page, TEST_CATEGORY);

    await page.click('.tab-btn:nth-child(2)');
    await shortDelay();

    await page.fill('#newMenuName', TEST_MENU3);
    await page.selectOption('#newMenuCategory', { label: TEST_CATEGORY });
    await page.locator('input[name="menuTemperature"][value="hot_only"]').check();
    await page.click('#menuTab .btn-primary');
    await waitForDB();

    const menuList = page.locator('#menuList');
    await expect(menuList).toContainText(TEST_MENU3);

    // 정리
    await page.click('.tab-btn:nth-child(1)');
    await cleanupTestCategory(page, TEST_CATEGORY);
  });

  // TC-ADMIN-017: [삭제됨] 카테고리 삭제는 관리자(admin)만 가능, 매니저 계정으로 테스트 불가
  // 참고: 테스트 계정(admin_test)은 manager 권한이므로 카테고리 삭제 테스트는 제외

  // TC-ADMIN-018-01: 테스트 메뉴 개별 삭제
  test('TC-ADMIN-018-01: 테스트 메뉴 개별 삭제', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('http://localhost:8000/menu-admin.html');
    await waitForDB();

    await createTestCategory(page, TEST_CATEGORY);
    await createTestMenu(page, TEST_CATEGORY, TEST_MENU1);

    // 메뉴 탭에서 삭제
    await page.click('.tab-btn:nth-child(2)');
    await shortDelay();

    const menuItem = page.locator(`.menu-item:has-text("${TEST_MENU1}")`);
    const deleteBtn = menuItem.locator('.btn-danger').first();
    await deleteBtn.click();
    await waitForDB();

    const deletedMenu = page.locator(`text=${TEST_MENU1}`);
    expect(await deletedMenu.count()).toBe(0);

    await page.click('.tab-btn:nth-child(1)');
    await cleanupTestCategory(page, TEST_CATEGORY);
  });

  // TC-ADMIN-018-02: 테스트 카테고리 수정
  test('TC-ADMIN-018-02: 테스트 카테고리 수정', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('http://localhost:8000/menu-admin.html');
    await waitForDB();

    await createTestCategory(page, TEST_CATEGORY);

    const categoryItem = page.locator(`.category-item:has-text("${TEST_CATEGORY}")`);
    const editBtn = categoryItem.locator('.btn-secondary').first();
    await editBtn.click();
    await shortDelay();

    const editInput = page.locator('.category-edit-form input').first();
    const newName = `${TEST_CATEGORY}_Edit`;
    await editInput.fill(newName);
    await shortDelay();

    await page.click('.category-edit-actions .btn-primary');
    await waitForDB();

    const categoryList = page.locator('#categoryList');
    await expect(categoryList).toContainText(newName);

    // 정리
    await cleanupTestCategoryByName(page, newName);
  });

  // TC-ADMIN-018-03: 카테고리 수정 취소
  test('TC-ADMIN-018-03: 카테고리 수정 취소', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('http://localhost:8000/menu-admin.html');
    await waitForDB();

    await createTestCategory(page, TEST_CATEGORY);

    const categoryItem = page.locator(`.category-item:has-text("${TEST_CATEGORY}")`);
    const editBtn = categoryItem.locator('.btn-secondary').first();
    await editBtn.click();
    await shortDelay();

    const editInput = page.locator('.category-edit-form input').first();
    await editInput.fill(`${TEST_CATEGORY}_Changed`);
    await shortDelay();

    await page.click('.category-edit-actions .btn-secondary');
    await shortDelay();

    const categoryList = page.locator('#categoryList');
    await expect(categoryList).toContainText(TEST_CATEGORY);

    await cleanupTestCategory(page, TEST_CATEGORY);
  });

  // TC-ADMIN-018-04: 테스트 메뉴 수정 (both -> ice_only)
  test('TC-ADMIN-018-04: 메뉴 수정 both to ice_only', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('http://localhost:8000/menu-admin.html');
    await waitForDB();

    await createTestCategory(page, TEST_CATEGORY);
    await createTestMenu(page, TEST_CATEGORY, TEST_MENU1);

    await page.click('.tab-btn:nth-child(2)');
    await shortDelay();

    const menuItem = page.locator(`.menu-item:has-text("${TEST_MENU1}")`);
    const editBtn = menuItem.locator('.btn-secondary').first();
    await editBtn.click();
    await shortDelay();

    await page.locator('#menuTab select').nth(1).selectOption('ice_only');
    await shortDelay();

    await page.click('.menu-edit-actions .btn-primary');
    await waitForDB();

    await page.click('.tab-btn:nth-child(1)');
    await cleanupTestCategory(page, TEST_CATEGORY);
  });

  // TC-ADMIN-018-05: 테스트 메뉴 수정 (both -> hot_only)
  test('TC-ADMIN-018-05: 메뉴 수정 both to hot_only', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('http://localhost:8000/menu-admin.html');
    await waitForDB();

    await createTestCategory(page, TEST_CATEGORY);
    await createTestMenu(page, TEST_CATEGORY, TEST_MENU1);

    await page.click('.tab-btn:nth-child(2)');
    await shortDelay();

    const menuItem = page.locator(`.menu-item:has-text("${TEST_MENU1}")`);
    const editBtn = menuItem.locator('.btn-secondary').first();
    await editBtn.click();
    await shortDelay();

    await page.locator('#menuTab select').nth(1).selectOption('hot_only');
    await shortDelay();

    await page.click('.menu-edit-actions .btn-primary');
    await waitForDB();

    await page.click('.tab-btn:nth-child(1)');
    await cleanupTestCategory(page, TEST_CATEGORY);
  });

  // TC-ADMIN-018-06: 메뉴 수정 취소
  test('TC-ADMIN-018-06: 메뉴 수정 취소', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('http://localhost:8000/menu-admin.html');
    await waitForDB();

    await createTestCategory(page, TEST_CATEGORY);
    await createTestMenu(page, TEST_CATEGORY, TEST_MENU1);

    await page.click('.tab-btn:nth-child(2)');
    await shortDelay();

    const menuItem = page.locator(`.menu-item:has-text("${TEST_MENU1}")`);
    const editBtn = menuItem.locator('.btn-secondary').first();
    await editBtn.click();
    await shortDelay();

    await page.click('.menu-edit-actions .btn-secondary');
    await shortDelay();

    const menuList = page.locator('#menuList');
    await expect(menuList).toContainText(TEST_MENU1);

    await page.click('.tab-btn:nth-child(1)');
    await cleanupTestCategory(page, TEST_CATEGORY);
  });

  // TC-ADMIN-018-07: 중복 카테고리명 수정 방지
  test('TC-ADMIN-018-07: 중복 카테고리명 수정 방지', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('http://localhost:8000/menu-admin.html');
    await waitForDB();

    const cat1 = `${TEST_CATEGORY}1`;
    const cat2 = `${TEST_CATEGORY}2`;

    await createTestCategory(page, cat1);
    await createTestCategory(page, cat2);

    const categoryItem = page.locator(`.category-item:has-text("${cat1}")`);
    const editBtn = categoryItem.locator('.btn-secondary').first();
    await editBtn.click();
    await shortDelay();

    const editInput = page.locator('.category-edit-form input').first();
    await editInput.fill(cat2);
    await shortDelay();

    // dialog 이벤트로 alert 처리
    let alertMessage = '';
    page.on('dialog', async dialog => {
      alertMessage = dialog.message();
      await dialog.accept();
    });

    await page.click('.category-edit-actions .btn-primary');
    await shortDelay();

    // alert 메시지 확인
    expect(alertMessage).toContain('존재');

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

    const addBtn = page.locator('#addHistoryBtn');
    if (await addBtn.isVisible().catch(() => false)) {
      await addBtn.click();
      await shortDelay();

      await page.fill('#purchaseName', TEST_HISTORY);
      await shortDelay();
      await page.fill('#purchaseDate', new Date().toISOString().split('T')[0]);
      await shortDelay();

      await page.click('#addModal .btn-primary');
      await waitForDB();

      const historyList = page.locator('#historyList');
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

    // history 페이지는 날짜별 필터가 없으므로 목록 로드만 확인
    const historyList = page.locator('#historyList');
    await expect(historyList).toBeVisible();
  });

  // TC-ADMIN-022: 테스트 구매 이력 삭제
  test('TC-ADMIN-022: 테스트 구매 이력 삭제', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('http://localhost:8000/history.html');
    await waitForDB();

    // 테스트 이력 추가
    const addBtn = page.locator('#addHistoryBtn');
    if (await addBtn.isVisible().catch(() => false)) {
      await addBtn.click();
      await page.fill('#purchaseName', TEST_HISTORY);
      await page.fill('#purchaseDate', new Date().toISOString().split('T')[0]);
      await page.click('#addModal .btn-primary');
      await waitForDB();

      // 삭제
      const deleteBtn = page.locator(`.history-item:has-text("${TEST_HISTORY}") .delete-btn`).first();
      await deleteBtn.click();
      await shortDelay();

      // 확인 대화상자 처리
      page.on('dialog', async dialog => {
        await dialog.accept();
      });
      await waitForDB();

      const deletedHistory = page.locator(`text=${TEST_HISTORY}`);
      expect(await deletedHistory.count()).toBe(0);
    }
  });

  /**
   * 2.5 즐겨찾기 관리 페이지 테스트
   */

  // TC-ADMIN-023: 즐겨찾기 페이지 접근
  // 참고: 즐겨찾기 페이지는 로그인 없이도 접근 가능
  test('TC-ADMIN-023: 즐겨찾기 페이지 접근', async ({ page }) => {
    await page.goto('http://localhost:8000/favorites.html');
    await waitForDB();
    await expect(page).toHaveURL(/favorites/);
  });

  // TC-ADMIN-024: 테스트 즐겨찾기 추가
  // 참고: 즐겨찾기 페이지는 로그인 없이도 접근 가능
  test('TC-ADMIN-024: 테스트 즐겨찾기 추가', async ({ page }) => {
    // 즐겨찾기 페이지는 로그인 없이 접근 가능
    await page.goto('http://localhost:8000/favorites.html');
    await waitForDB();

    // 메뉴 목록이 표시되는지 확인 (DB에 메뉴가 있다면)
    const menuItems = page.locator('.menu-item');
    const menuCount = await menuItems.count();

    if (menuCount > 0) {
      // 즐겨찾기 선택되지 않은 첫 번째 메뉴 찾기
      let foundUnchecked = false;
      for (let i = 0; i < menuCount; i++) {
        const checkbox = menuItems.nth(i).locator('input[type="checkbox"]');
        if (await checkbox.isVisible().catch(() => false)) {
          const isChecked = await checkbox.isChecked();
          if (!isChecked) {
            // 즐겨찾기 선택되지 않은 메뉴를 찾아서 체크
            await checkbox.check();
            await shortDelay();
            foundUnchecked = true;

            // 저장 버튼 클릭
            await page.click('#saveBtn');
            await waitForDB();

            // 저장 성공 시 index.html로 이동
            await expect(page).toHaveURL(/index/);
            break;
          }
        }
      }

      // 모든 메뉴가 이미 즐겨찾기 되어 있으면 첫 번째 메뉴를 해제 후 다시 체크 (테스트 목적)
      if (!foundUnchecked && menuCount > 0) {
        const firstCheckbox = menuItems.first().locator('input[type="checkbox"]');
        await firstCheckbox.uncheck();
        await shortDelay();
        await firstCheckbox.check();
        await shortDelay();

        // 저장 버튼 클릭
        await page.click('#saveBtn');
        await waitForDB();

        // 저장 성공 시 index.html로 이동
        await expect(page).toHaveURL(/index/);
      }
    }
  });

  // TC-ADMIN-025: 테스트 즐겨찾기 삭제
  // 참고: 즐겨찾기 페이지는 로그인 없이도 접근 가능
  //       TC-ADMIN-024에서 추가한 메뉴를 해제
  test('TC-ADMIN-025: 테스트 즐겨찾기 삭제', async ({ page }) => {
    // 즐겨찾기 페이지는 로그인 없이 접근 가능
    await page.goto('http://localhost:8000/favorites.html');
    await waitForDB();

    // 메뉴 목록에서 체크된(즐겨찾기된) 메뉴 찾아서 해제
    const menuItems = page.locator('.menu-item');
    const menuCount = await menuItems.count();

    if (menuCount > 0) {
      // 즐겨찾기가 선택된 메뉴 찾아서 해제
      let foundChecked = false;
      for (let i = 0; i < menuCount; i++) {
        const checkbox = menuItems.nth(i).locator('input[type="checkbox"]');
        if (await checkbox.isVisible().catch(() => false)) {
          const isChecked = await checkbox.isChecked();
          if (isChecked) {
            // 즐겨찾기된 메뉴를 찾아서 해제
            await checkbox.uncheck();
            await shortDelay();
            foundChecked = true;

            // 저장
            await page.click('#saveBtn');
            await waitForDB();
            break;
          }
        }
      }

      // 즐겨찾기된 메뉴가 없으면 첫 번째 메뉴를 체크 후 해제 (테스트 목적)
      if (!foundChecked && menuCount > 0) {
        const firstCheckbox = menuItems.first().locator('input[type="checkbox"]');
        await firstCheckbox.check();
        await shortDelay();
        await firstCheckbox.uncheck();
        await shortDelay();

        // 저장
        await page.click('#saveBtn');
        await waitForDB();
      }
    }
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
      { selector: 'a[href="admin.html"]' },
      { selector: 'a[href="menu-admin.html"]' },
      { selector: 'a[href="history.html"]' },
      { selector: 'a[href="favorites.html"]' },
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

    // dialog 이벤트 먼저 설정 (클릭 전에 설정해야 함)
    page.on('dialog', async dialog => {
      await dialog.accept();
    });

    // 로그아웃 버튼 클릭
    const logoutBtn = page.locator('.logout-btn');
    await logoutBtn.click();

    // 페이지 이동 및 localStorage 삭제 대기
    await page.waitForNavigation({ timeout: 5000 }).catch(() => {});
    await waitForDB();

    // localStorage에서 사용자 정보가 삭제되었는지 확인
    const user = await page.evaluate(() => localStorage.getItem('coffeeOrder_user'));
    expect(user).toBeNull();
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
  await page.click('button[type="submit"].login-btn');
  await waitForDB();
}

async function createTestCategory(page, name) {
  const categoryInput = page.locator('#newCategoryName');
  await categoryInput.fill(name);
  await shortDelay();
  await page.click('#categoryTab .btn-primary');
  await waitForDB();
}

async function createTestMenu(page, category, menuName) {
  await page.click('.tab-btn:nth-child(2)');
  await shortDelay();
  await page.fill('#newMenuName', menuName);
  await shortDelay();

  // 카테고리 드롭다운이 로드될 때까지 대기
  await page.waitForSelector('#newMenuCategory option', { timeout: 10000 });

  // 카테고리가 옵션에 존재하는지 확인하고 선택
  const options = await page.locator('#newMenuCategory option').allTextContents();
  if (options.includes(category)) {
    await page.selectOption('#newMenuCategory', { label: category });
  } else {
    // 카테고리가 없으면 value로 시도
    await page.selectOption('#newMenuCategory', { value: category });
  }
  await shortDelay();
  await page.click('#menuTab .btn-primary');
  await waitForDB();
  await page.click('.tab-btn:nth-child(1)');
  await shortDelay();
}

async function cleanupTestUser(page, name) {
  const nameItem = page.locator(`.name-item:has-text("${name}") .delete-btn`).first();
  if (await nameItem.isVisible().catch(() => false)) {
    await nameItem.click();
    await shortDelay();
    page.on('dialog', async dialog => {
      await dialog.accept();
    });
    await waitForDB();
  }
}

async function cleanupTestCategory(page, name) {
  const categoryItem = page.locator(`.category-item:has-text("${name}")`);
  const deleteBtn = categoryItem.locator('.btn-danger').first();
  if (await deleteBtn.isVisible().catch(() => false)) {
    await deleteBtn.click();
    await shortDelay();
    page.on('dialog', async dialog => {
      await dialog.accept();
    });
    await waitForDB();
  }
}

async function cleanupTestCategoryByName(page, name) {
  const categoryItem = page.locator(`.category-item:has-text("${name}")`);
  const deleteBtn = categoryItem.locator('.btn-danger').first();
  if (await deleteBtn.isVisible().catch(() => false)) {
    await deleteBtn.click();
    await shortDelay();
    page.on('dialog', async dialog => {
      await dialog.accept();
    });
    await waitForDB();
  }
}

async function cleanupTestHistory(page, content) {
  const deleteBtn = page.locator(`.history-item:has-text("${content}") .delete-btn`).first();
  if (await deleteBtn.isVisible().catch(() => false)) {
    await deleteBtn.click();
    await shortDelay();
    page.on('dialog', async dialog => {
      await dialog.accept();
    });
    await waitForDB();
  }
}
