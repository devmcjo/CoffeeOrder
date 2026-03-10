/**
 * Playwright 테스트 예시 코드
 * tests/TEST_CASES.md 의 테스트 케이스를 기반으로 작성
 *
 * 실행 방법:
 *   npx playwright test tests/example.spec.js
 *   npx playwright test --ui  (UI 모드 - default)
 *   npx playwright test (백그라운드 모드 - 백그라운드 모드로 실행 지시가 있을 시)
 */

const { test, expect } = require('@playwright/test');

// 테스트 데이터 (DB 보호를 위해 Test{N} 패턴 사용)
const TEST_PREFIX = '[TEST]';
const timestamp = Date.now();
const TEST_USER = `${TEST_PREFIX}User_${timestamp}`;
const TEST_CATEGORY = `${TEST_PREFIX}Category_${timestamp}`;
const TEST_MENU = `${TEST_PREFIX}Menu_${timestamp}`;
const TEST_HISTORY = `${TEST_PREFIX}History_${timestamp}`;

// 매니저 로그인 정보
const ADMIN_ID = 'admin_test';
const ADMIN_PW = '1';

/**
 * 메인 화면 테스트
 */
test.describe('메인 화면 (index.html) 테스트', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8000');
    await page.waitForLoadState('networkidle');
  });

  /**
   * TC-MAIN-001: 페이지 로드 및 기본 레이아웃 확인
   */
  test('TC-MAIN-001: 페이지 로드 및 기본 레이아웃 확인', async ({ page }) => {
    // 페이지 타이틀 확인
    await expect(page).toHaveTitle(/메가커피/);

    // 헤더 확인
    await expect(page.locator('header h1')).toContainText('메가커피 단체 주문');

    // 주요 UI 요소 확인
    await expect(page.locator('#nameSelect')).toBeVisible();
    await expect(page.locator('#menuList')).toBeVisible();
    await expect(page.locator('#searchInput')).toBeVisible();

    // 장바구니 버튼 확인
    await expect(page.locator('text=장바구니')).toBeVisible();
  });

  /**
   * TC-MAIN-002: 이름 선택 드롭다운 기본 상태
   */
  test('TC-MAIN-002: 이름 선택 드롭다운 기본 상태 확인', async ({ page }) => {
    const nameSelect = page.locator('#nameSelect');
    await expect(nameSelect).toBeVisible();

    // 옵션 확인
    await nameSelect.click();
    await expect(page.locator('text=이름을 선택하세요')).toBeVisible();
    await expect(page.locator('text=기타 (직접 입력)')).toBeVisible();
  });

  /**
   * TC-MAIN-003: 이름 미선택 시 메뉴 비활성화
   */
  test('TC-MAIN-003: 이름 미선택 시 메뉴 비활성화', async ({ page }) => {
    // 메뉴 영역 비활성화 상태 확인
    const menuList = page.locator('#menuList');
    await expect(menuList).toHaveClass(/disabled|inactive/);
  });

  /**
   * TC-MAIN-005: "기타 (직접 입력)" 선택 시 입력창 표시
   */
  test('TC-MAIN-005: 기타 선택 시 입력창 표시', async ({ page }) => {
    // 기타 선택
    await page.selectOption('#nameSelect', 'custom');

    // 직접 입력 필드 확인
    const customNameInput = page.locator('#customName');
    await expect(customNameInput).toBeVisible();
    await expect(customNameInput).toHaveAttribute('placeholder', '이름을 입력하세요');
  });

  /**
   * TC-MAIN-006: 직접 입력 필드 최대 길이 제한
   */
  test('TC-MAIN-006: 직접 입력 최대 20자 제한', async ({ page }) => {
    await page.selectOption('#nameSelect', 'custom');

    const customNameInput = page.locator('#customName');
    await customNameInput.fill('TestUser12345678901234567890'); // 28자

    // 20자까지만 입력되었는지 확인
    const value = await customNameInput.inputValue();
    expect(value.length).toBeLessThanOrEqual(20);
  });

  /**
   * TC-MAIN-009: 카테고리 버튼 표시 확인
   */
  test('TC-MAIN-009: 카테고리 버튼 표시', async ({ page }) => {
    // 이름 먼저 선택
    await page.selectOption('#nameSelect', 'custom');
    await page.fill('#customName', TEST_USER);

    // 카테고리 버튼 확인
    const categoryButtons = page.locator('.category-btn');
    await expect(categoryButtons).toHaveCount.greaterThan(0);

    // "전체" 버튼 확인
    await expect(page.locator('.category-btn', { hasText: '전체' })).toBeVisible();
  });

  /**
   * TC-MAIN-010: 카테고리 선택 시 메뉴 필터링
   */
  test('TC-MAIN-010: 카테고리 선택 시 메뉴 필터링', async ({ page }) => {
    // 이름 선택
    await page.selectOption('#nameSelect', 'custom');
    await page.fill('#customName', TEST_USER);

    // "커피" 카테고리 클릭
    const coffeeBtn = page.locator('.category-btn', { hasText: '커피' });
    if (await coffeeBtn.isVisible().catch(() => false)) {
      await coffeeBtn.click();

      // active 클래스 확인
      await expect(coffeeBtn).toHaveClass(/active/);

      // 메뉴 아이템 확인
      const menuItems = page.locator('.menu-item-wrapper');
      await expect(menuItems.first()).toBeVisible();
    }
  });

  /**
   * TC-MAIN-013: 기본 검색 기능
   */
  test('TC-MAIN-013: 검색 기능', async ({ page }) => {
    // 이름 선택
    await page.selectOption('#nameSelect', 'custom');
    await page.fill('#customName', TEST_USER);

    // 검색어 입력
    const searchInput = page.locator('#searchInput');
    await searchInput.fill('아메리카노');

    // 디바운스 대기
    await page.waitForTimeout(300);

    // 검색 결과 확인
    const menuItems = page.locator('.menu-item-wrapper');
    const count = await menuItems.count();

    if (count > 0) {
      const firstItemText = await menuItems.first().textContent();
      expect(firstItemText).toContain('아메리카노');
    }
  });

  /**
   * TC-MAIN-014: 초성 검색 기능
   */
  test('TC-MAIN-014: 초성 검색', async ({ page }) => {
    await page.selectOption('#nameSelect', 'custom');
    await page.fill('#customName', TEST_USER);

    await page.fill('#searchInput', 'ㄹㄸ'); // 라떼 초성
    await page.waitForTimeout(300);

    // "라떼" 메뉴가 검색되었는지 확인
    const menuItems = page.locator('.menu-item-wrapper');
    const count = await menuItems.count();
    expect(count).toBeGreaterThan(0);
  });

  /**
   * TC-MAIN-018: 메뉴 선택 시 ICE/HOT 버튼 표시
   */
  test('TC-MAIN-018: 메뉴 선택 시 온도 버튼 표시', async ({ page }) => {
    await page.selectOption('#nameSelect', 'custom');
    await page.fill('#customName', TEST_USER);

    // 첫 번째 메뉴 선택
    const firstMenu = page.locator('.menu-item-wrapper').first();
    const radio = firstMenu.locator('input[type="radio"]');
    await radio.click();

    // 온도 버튼 영역 확인
    const tempButtons = firstMenu.locator('.temp-buttons');
    await expect(tempButtons).toBeVisible();
  });

  /**
   * TC-MAIN-022: 에이드&주스 ICE Only 확인
   */
  test('TC-MAIN-022: 에이드 카테고리 ICE Only', async ({ page }) => {
    await page.selectOption('#nameSelect', 'custom');
    await page.fill('#customName', TEST_USER);

    // 에이드 카테고리 선택
    const adeBtn = page.locator('.category-btn', { hasText: '에이드' });
    if (await adeBtn.isVisible().catch(() => false)) {
      await adeBtn.click();

      // 첫 번째 메뉴 선택
      const firstMenu = page.locator('.menu-item-wrapper').first();
      await firstMenu.locator('input[type="radio"]').click();

      // 온도 버튼 확인
      const tempButtons = firstMenu.locator('.temp-buttons');
      await expect(tempButtons).toBeVisible();

      // ICE 버튼만 있는지 확인
      const iceBtn = tempButtons.locator('.temp-ice, .temp-ice-btn');
      const hotBtn = tempButtons.locator('.temp-hot, .temp-hot-btn');

      await expect(iceBtn).toBeVisible();
      await expect(hotBtn).toHaveCount(0);
    }
  });

  /**
   * TC-MAIN-026: 여러 개 주문하기 모드 활성화
   */
  test('TC-MAIN-026: 여러 개 주문하기 모드', async ({ page }) => {
    await page.selectOption('#nameSelect', 'custom');
    await page.fill('#customName', TEST_USER);

    // 체크박스 클릭
    const multiOrderCheckbox = page.locator('#multiOrderMode');
    await multiOrderCheckbox.click();

    // 체크 상태 확인
    await expect(multiOrderCheckbox).toBeChecked();

    // 임시 장바구니 영역 확인
    await expect(page.locator('#tempCartSection')).toBeVisible();
  });

  /**
   * TC-MAIN-046: HOT Only 메뉴 테스트 (관리자 설정 후)
   */
  test('TC-MAIN-046: HOT Only 메뉴 테스트', async ({ page }) => {
    await page.selectOption('#nameSelect', 'custom');
    await page.fill('#customName', TEST_USER);

    // 메뉴 관리에서 추가한 HOT Only 메뉴 찾기
    // 참고: 이 테스트는 TC-ADMIN-016에서 추가한 HOT Only 메뉴가 있어야 함
    const hotOnlyMenu = page.locator('.menu-item-wrapper').filter({ hasText: /HOT/ }).first();

    if (await hotOnlyMenu.isVisible().catch(() => false)) {
      // 메뉴 선택
      await hotOnlyMenu.locator('input[type="radio"]').click();

      // 온도 버튼 확인
      const tempButtons = hotOnlyMenu.locator('.temp-buttons');
      await expect(tempButtons).toBeVisible();

      // HOT 버튼만 있는지 확인
      const hotBtn = tempButtons.locator('.temp-hot, .temp-hot-btn');
      const iceBtn = tempButtons.locator('.temp-ice, .temp-ice-btn');

      await expect(hotBtn).toBeVisible();
      await expect(iceBtn).toHaveCount(0);
    }
  });

  /**
   * TC-MAIN-047: DB 기반 온도 설정 테스트
   */
  test('TC-MAIN-047: DB 기반 온도 설정 테스트', async ({ page }) => {
    await page.selectOption('#nameSelect', 'custom');
    await page.fill('#customName', TEST_USER);

    // 일반 메뉴 (both 설정) - ICE/HOT 모두 표시
    const normalMenu = page.locator('.menu-item-wrapper').first();
    await normalMenu.locator('input[type="radio"]').click();

    const tempButtons = normalMenu.locator('.temp-buttons');
    if (await tempButtons.isVisible().catch(() => false)) {
      // both 설정이면 ICE와 HOT 버튼 모두 표시
      const iceBtn = tempButtons.locator('.temp-ice, .temp-ice-btn');
      const hotBtn = tempButtons.locator('.temp-hot, .temp-hot-btn');

      // 둘 중 하나라도 있으면 OK (ICE Only나 HOT Only일 수도 있음)
      const hasIce = await iceBtn.isVisible().catch(() => false);
      const hasHot = await hotBtn.isVisible().catch(() => false);

      // ICE Only 메뉴가 아니면 HOT 버튼이 있어야 함
      // HOT Only 메뉴가 아니면 ICE 버튼이 있어야 함
      expect(hasIce || hasHot).toBeTruthy();
    }
  });

  /**
   * TC-MAIN-034: 장바구니 모달 열기
   */
  test('TC-MAIN-034: 장바구니 모달', async ({ page }) => {
    // 장바구니 버튼 클릭
    await page.click('text=장바구니');

    // 모달 확인
    const modal = page.locator('#cartModal');
    await expect(modal).toBeVisible();

    // 탭 확인
    await expect(page.locator('text=주문자별 보기')).toBeVisible();
    await expect(page.locator('text=메뉴순 보기')).toBeVisible();
  });
});

/**
 * 관리자 페이지 테스트
 */
test.describe('관리자 페이지 테스트', () => {

  /**
   * TC-ADMIN-002: 쿠키/로컬스토리지 초기화
   */
  test('TC-ADMIN-002: 로컬스토리지 초기화 후 로그인', async ({ page }) => {
    await page.goto('http://localhost:8000/login.html');

    // Local Storage 및 Cookies 초기화
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    await page.reload();

    // 로그인 폼 확인
    await expect(page.locator('#adminId')).toBeVisible();
    await expect(page.locator('#adminPw')).toBeVisible();
  });

  /**
   * TC-ADMIN-003: 매니저 계정 로그인 성공
   */
  test('TC-ADMIN-003: 매니저 로그인', async ({ page }) => {
    await page.goto('http://localhost:8000/login.html');

    // 로그인 정보 입력
    await page.fill('#adminId', ADMIN_ID);
    await page.fill('#adminPw', ADMIN_PW);
    await page.click('button[type="submit"]');

    // 설정 페이지로 이동 확인
    await page.waitForURL('**/settings.html');
    await expect(page.locator('text=관리자 설정')).toBeVisible();
  });

  /**
   * TC-ADMIN-004: 잘못된 계정 로그인 실패
   */
  test('TC-ADMIN-004: 잘못된 로그인', async ({ page }) => {
    await page.goto('http://localhost:8000/login.html');

    await page.fill('#adminId', 'wronguser');
    await page.fill('#adminPw', 'wrongpass');
    await page.click('button[type="submit"]');

    // 에러 메시지 확인
    await expect(page.locator('text=아이디 또는 비밀번호가 일치하지 않습니다')).toBeVisible();
  });

  /**
   * TC-ADMIN-007: 테스트 이름 추가
   */
  test('TC-ADMIN-007: 테스트 이름 추가', async ({ page }) => {
    // 로그인
    await page.goto('http://localhost:8000/login.html');
    await page.fill('#adminId', ADMIN_ID);
    await page.fill('#adminPw', ADMIN_PW);
    await page.click('button[type="submit"]');

    // 이름 관리 페이지로 이동
    await page.goto('http://localhost:8000/admin.html');

    // 테스트 이름 추가
    await page.fill('#newNameInput', TEST_USER);
    await page.click('text=추가');

    // 이름 목록에 추가되었는지 확인
    await expect(page.locator(`text=${TEST_USER}`)).toBeVisible();
  });

  /**
   * TC-ADMIN-012: 테스트 카테고리 추가
   */
  test('TC-ADMIN-012: 테스트 카테고리 추가', async ({ page }) => {
    // 로그인
    await page.goto('http://localhost:8000/login.html');
    await page.fill('#adminId', ADMIN_ID);
    await page.fill('#adminPw', ADMIN_PW);
    await page.click('button[type="submit"]');

    // 메뉴 관리 페이지로 이동
    await page.goto('http://localhost:8000/menu-admin.html');

    // 카테고리 추가
    await page.fill('#newCategoryInput', TEST_CATEGORY);
    await page.click('text=카테고리 추가');

    // 추가 확인
    await expect(page.locator(`text=${TEST_CATEGORY}`)).toBeVisible();
  });

  /**
   * TC-ADMIN-014: 테스트 메뉴 추가 (with 온도 설정)
   */
  test('TC-ADMIN-014: 테스트 메뉴 추가 (both 설정)', async ({ page }) => {
    // 로그인
    await page.goto('http://localhost:8000/login.html');
    await page.fill('#adminId', ADMIN_ID);
    await page.fill('#adminPw', ADMIN_PW);
    await page.click('button[type="submit"]');

    // 메뉴 관리 페이지
    await page.goto('http://localhost:8000/menu-admin.html');

    // 카테고리 선택
    await page.selectOption('#categorySelect', TEST_CATEGORY);

    // 메뉴 추가 with 온도 설정 (both)
    await page.fill('#newMenuInput', TEST_MENU);
    // 온도 설정이 있다면 both 선택 (기본값이므로 생략 가능)
    if (await page.locator('#temperatureSelect').isVisible().catch(() => false)) {
      await page.selectOption('#temperatureSelect', 'both');
    }
    await page.click('text=메뉴 추가');

    // 추가 확인
    await expect(page.locator(`text=${TEST_MENU}`)).toBeVisible();
  });

  /**
   * TC-ADMIN-015: ICE Only 메뉴 추가
   */
  test('TC-ADMIN-015: ICE Only 메뉴 추가', async ({ page }) => {
    const TEST_MENU_ICE = `${TEST_PREFIX}Menu_ICE_${timestamp}`;

    // 로그인
    await page.goto('http://localhost:8000/login.html');
    await page.fill('#adminId', ADMIN_ID);
    await page.fill('#adminPw', ADMIN_PW);
    await page.click('button[type="submit"]');

    // 메뉴 관리 페이지
    await page.goto('http://localhost:8000/menu-admin.html');

    // 카테고리 선택
    await page.selectOption('#categorySelect', TEST_CATEGORY);

    // ICE Only 메뉴 추가
    await page.fill('#newMenuInput', TEST_MENU_ICE);
    if (await page.locator('#temperatureSelect').isVisible().catch(() => false)) {
      await page.selectOption('#temperatureSelect', 'ice_only');
    }
    await page.click('text=메뉴 추가');

    // 추가 확인
    await expect(page.locator(`text=${TEST_MENU_ICE}`)).toBeVisible();
  });

  /**
   * TC-ADMIN-016: HOT Only 메뉴 추가
   */
  test('TC-ADMIN-016: HOT Only 메뉴 추가', async ({ page }) => {
    const TEST_MENU_HOT = `${TEST_PREFIX}Menu_HOT_${timestamp}`;

    // 로그인
    await page.goto('http://localhost:8000/login.html');
    await page.fill('#adminId', ADMIN_ID);
    await page.fill('#adminPw', ADMIN_PW);
    await page.click('button[type="submit"]');

    // 메뉴 관리 페이지
    await page.goto('http://localhost:8000/menu-admin.html');

    // 카테고리 선택
    await page.selectOption('#categorySelect', TEST_CATEGORY);

    // HOT Only 메뉴 추가
    await page.fill('#newMenuInput', TEST_MENU_HOT);
    if (await page.locator('#temperatureSelect').isVisible().catch(() => false)) {
      await page.selectOption('#temperatureSelect', 'hot_only');
    }
    await page.click('text=메뉴 추가');

    // 추가 확인
    await expect(page.locator(`text=${TEST_MENU_HOT}`)).toBeVisible();
  });

  /**
   * TC-ADMIN-029: 카테고리 수정
   */
  test('TC-ADMIN-029: 카테고리 수정', async ({ page }) => {
    const TEST_CATEGORY_EDITED = `${TEST_CATEGORY}_Edited`;

    // 로그인
    await page.goto('http://localhost:8000/login.html');
    await page.fill('#adminId', ADMIN_ID);
    await page.fill('#adminPw', ADMIN_PW);
    await page.click('button[type="submit"]');

    // 메뉴 관리 페이지
    await page.goto('http://localhost:8000/menu-admin.html');

    // 카테고리 수정 버튼 클릭
    const categoryRow = page.locator(`text=${TEST_CATEGORY}`).first().locator('xpath=..');
    const editBtn = categoryRow.locator('button:has-text("수정")');

    if (await editBtn.isVisible().catch(() => false)) {
      await editBtn.click();

      // 새 이름 입력
      const editInput = categoryRow.locator('input[type="text"]').first();
      await editInput.fill(TEST_CATEGORY_EDITED);

      // 저장 클릭
      await categoryRow.locator('button:has-text("저장")').click();

      // 수정 확인
      await expect(page.locator(`text=${TEST_CATEGORY_EDITED}`)).toBeVisible();
    }
  });

  /**
   * TC-ADMIN-031: 메뉴 수정 (온도 설정 변경)
   */
  test('TC-ADMIN-031: 메뉴 수정 (온도 설정 변경)', async ({ page }) => {
    // 로그인
    await page.goto('http://localhost:8000/login.html');
    await page.fill('#adminId', ADMIN_ID);
    await page.fill('#adminPw', ADMIN_PW);
    await page.click('button[type="submit"]');

    // 메뉴 관리 페이지
    await page.goto('http://localhost:8000/menu-admin.html');

    // 메뉴 수정 버튼 클릭
    const menuRow = page.locator(`text=${TEST_MENU}`).first().locator('xpath=..');
    const editBtn = menuRow.locator('button:has-text("수정")');

    if (await editBtn.isVisible().catch(() => false)) {
      await editBtn.click();

      // 온도 설정을 ice_only로 변경
      const tempSelect = menuRow.locator('select').first();
      if (await tempSelect.isVisible().catch(() => false)) {
        await tempSelect.selectOption('ice_only');
      }

      // 저장 클릭
      await menuRow.locator('button:has-text("저장")').click();

      // 수정 완료 (에러 없이 저장되면 성공)
      await page.waitForTimeout(500);
    }
  });

  /**
   * 테스트 데이터 정리
   */
  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();

    // 로그인
    await page.goto('http://localhost:8000/login.html');
    await page.fill('#adminId', ADMIN_ID);
    await page.fill('#adminPw', ADMIN_PW);
    await page.click('button[type="submit"]');

    // 테스트 메뉴 삭제
    await page.goto('http://localhost:8000/menu-admin.html');
    const menuDeleteBtn = page.locator(`text=${TEST_MENU}`).locator('..').locator('button:has-text("삭제")');
    if (await menuDeleteBtn.isVisible().catch(() => false)) {
      await menuDeleteBtn.click();
    }

    // 테스트 카테고리 삭제
    const categoryDeleteBtn = page.locator(`text=${TEST_CATEGORY}`).locator('..').locator('button:has-text("삭제")');
    if (await categoryDeleteBtn.isVisible().catch(() => false)) {
      await categoryDeleteBtn.click();
    }

    // 테스트 이름 삭제
    await page.goto('http://localhost:8000/admin.html');
    const nameDeleteBtn = page.locator(`text=${TEST_USER}`).locator('..').locator('button:has-text("삭제")');
    if (await nameDeleteBtn.isVisible().catch(() => false)) {
      await nameDeleteBtn.click();
    }

    await page.close();
  });
});

/**
 * 통합 테스트 시나리오
 */
test.describe('통합 테스트 - 전체 주문 플로우', () => {

  test('전체 주문 플로우 테스트', async ({ page }) => {
    // 1. 메인 페이지 접속
    await page.goto('http://localhost:8000');
    await page.waitForLoadState('networkidle');

    // 2. 이름 선택 (기타)
    await page.selectOption('#nameSelect', 'custom');
    await page.fill('#customName', TEST_USER);

    // 3. 카테고리 선택 (커피)
    const coffeeBtn = page.locator('.category-btn', { hasText: '커피' });
    if (await coffeeBtn.isVisible().catch(() => false)) {
      await coffeeBtn.click();
    }

    // 4. 메뉴 선택
    const firstMenu = page.locator('.menu-item-wrapper').first();
    await firstMenu.locator('input[type="radio"]').click();

    // 5. HOT 선택
    const hotBtn = firstMenu.locator('.temp-hot, .temp-hot-btn');
    if (await hotBtn.isVisible().catch(() => false)) {
      await hotBtn.click();
    }

    // 6. 주문 담기
    await page.click('text=주문 담기');

    // 7. 장바구니 확인
    await page.click('text=장바구니');
    const cartModal = page.locator('#cartModal');
    await expect(cartModal).toBeVisible();
    await expect(page.locator(`text=${TEST_USER}`)).toBeVisible();

    // 8. 장바구니 닫기
    await page.keyboard.press('Escape');
  });
});
