# 메가커피 단체 주문 시스템 - 테스트 가이드

> 이 문서는 메가커피 단체 주문 시스템의 테스트 방법을 설명합니다.

---

## 📁 파일 구조

```
tests/
├── README.md              # 이 파일 (테스트 가이드)
├── TEST_CASES.md          # 상세 테스트 케이스 문서
├── example.spec.js        # 테스트 예시 코드
└── results/               # 테스트 관련된 모든 산출물 보관 경로
    └── screenshot/        # 테스트 케이스 화면 경로
        ├── success/       # 테스트 케이스 성공 화면 경로
        └── fail/          # 테스트 케이스 성공 화면 경로
```

---

## 🚀 빠른 시작

### 1. 사전 준비

```bash
# 1. 로컬 서버 실행 (Python)
cd E:\Study\coffeeorder
python -m http.server 8000

# 또는 Node.js
npx http-server -p 8000
```

### 2. Playwright 설치 (처음 한 번만)

```bash
# Playwright 설치
npm init -y
npm install @playwright/test
npx playwright install
```

### 3. 테스트 실행

```bash
# 모든 테스트 실행
npx playwright test

# 특정 테스트 파일 실행
npx playwright test tests/example.spec.js

# UI 모드로 실행 (브라우저 볼 수 있음)
npx playwright test --ui

# 헤드리스 모드 (백그라운드)
npx playwright test --headless

# 디버그 모드
npx playwright test --debug
```

---

## 📝 테스트 케이스 목록

### 메인 화면 테스트 (TC-MAIN-XXX)

| 번호 | 테스트명 | 설명 | 우선순위 |
|------|---------|------|---------|
| TC-MAIN-001 ~ 005 | 페이지 로드 및 기본 UI | 헤더, 드롭다운, 메뉴 영역 확인 | 🔴 필수 |
| TC-MAIN-006 ~ 008 | 사용자 입력 | 기타 선택, 20자 제한 | 🔴 필수 |
| TC-MAIN-009 ~ 012 | 카테고리 필터링 | 버튼 표시, 선택 시 필터링 | 🔴 필수 |
| TC-MAIN-013 ~ 016 | 검색 기능 | 텍스트/초성 검색 | 🟠 중요 |
| TC-MAIN-017 ~ 021 | 단일 주문 모드 | 메뉴 선택, ICE/HOT | 🔴 필수 |
| TC-MAIN-022 ~ 025 | ICE Only 메뉴 | 에이드, 스묘디 등 ICE Only 확인 | 🔴 필수 |
| TC-MAIN-046 ~ 048 | HOT Only 메뉴 및 DB 기반 온도 설정 | HOT Only, DB 설정 테스트 | 🔴 필수 |
| TC-MAIN-026 ~ 033 | 여러 개 주문하기 | 멀티 모드, 임시 장바구니 | 🟠 중요 |
| TC-MAIN-034 ~ 040 | 장바구니 | 모달, 삭제, 20/100잔 제한 | 🔴 필수 |
| TC-MAIN-041 | 즐겨찾기 | ⭐ 표시, 상단 정렬 | 🟡 일반 |
| TC-MAIN-042 ~ 043 | 구매 이력 | 팝업 표시 | 🟡 일반 |
| TC-MAIN-044 ~ 045 | 엣지 케이스 | 새로고침, 오프라인 | 🟡 일반 |

### 관리자 페이지 테스트 (TC-ADMIN-XXX)

| 번호 | 테스트명 | 설명 | 우선순위 |
|------|---------|------|---------|
| TC-ADMIN-001 ~ 005 | 로그인 | 페이지 로드, 성공/실패 | 🔴 필수 |
| TC-ADMIN-006 ~ 010 | 이름 관리 | 추가/삭제, 중복 방지 | 🟠 중요 |
| TC-ADMIN-011 ~ 018 | 메뉴 관리(1) | 카테고리/메뉴 CRUD, 온도 설정, 수정 기능 | 🟠 중요 |
| TC-ADMIN-029 ~ 034 | 메뉴 관리(2) | 카테고리/메뉴 CRUD, 온도 설정, 수정 기능 | 🟠 중요 |
| TC-ADMIN-019 ~ 022 | 구매 이력 | 추가/삭제 | 🟡 일반 |
| TC-ADMIN-023 ~ 025 | 즐겨찾기 | 추가/삭제 | 🟡 일반 |
| TC-ADMIN-026 ~ 028 | 설정/로그아웃 | 페이지 접근, 로그아웃 | 🔴 필수 |

---

## ⚠️ 테스트 수행 시 주의사항

### DB 데이터 보호 (매우 중요!)

```
✅ 반드시 지켜야 할 규칙:

1. 테스트 데이터는 "Test{N}" 또는 "[TEST]{N}" 패턴 사용
   예: TestUser1, TestCategory1, TestMenu1

2. 테스트 완료 후 반드시 테스트 데이터 삭제
   - 개별 항목 삭제만 허용
   - 테이블 전체 삭제 쿼리 사용 금지

3. 기존 데이터는 절대 삭제 금지
   - 실제 사용자 이름
   - 실제 메뉴/카테고리
   - 기존 장바구니 데이터
   - 기존 구매 이력

4. 테스트 순서
   a. 테스트 이름 추가 → 테스트 → 삭제
   b. 테스트 카테고리 추가 → 테스트 메뉴 추가 → 테스트 → 메뉴 삭제 → 카테고리 삭제
```

---

## 🔧 테스트 코드 작성 가이드

### 기본 템플릿

```javascript
const { test, expect } = require('@playwright/test');

// 테스트 데이터 (DB 보호를 위해 Test{N} 패턴 사용)
const TEST_USER = `TestUser_${Date.now()}`;
const TEST_CATEGORY = `TestCategory_${Date.now()}`;
const TEST_MENU = `TestMenu_${Date.now()}`;

test('테스트 설명', async ({ page }) => {
  // 1. 페이지 접속
  await page.goto('http://localhost:8000');
  await page.waitForLoadState('networkidle');

  // 2. 테스트 단계 수행
  await page.selectOption('#nameSelect', 'custom');
  await page.fill('#customName', TEST_USER);

  // 3. 결과 검증
  await expect(page.locator('#menuList')).toBeVisible();
});
```

### 주요 Locator 정의

```javascript
// 메인 페이지
const locators = {
  nameSelect: '#nameSelect',
  customNameInput: '#customName',
  categoryButtons: '.category-btn',
  searchInput: '#searchInput',
  menuList: '#menuList',
  menuItems: '.menu-item-wrapper',
  multiOrderCheckbox: '#multiOrderMode',
  tempCartSection: '#tempCartSection',
  cartButton: 'text=장바구니',
  cartModal: '#cartModal',
  tempIceBtn: '.temp-ice, .temp-ice-btn',
  tempHotBtn: '.temp-hot, .temp-hot-btn'
};

// 관리자 페이지
const adminLocators = {
  loginId: '#adminId',
  loginPw: '#adminPw',
  newNameInput: '#newNameInput',
  newCategoryInput: '#newCategoryInput',
  newMenuInput: '#newMenuInput',
  categorySelect: '#categorySelect',
  temperatureSelect: '#temperatureSelect',  // 온도 설정 (both/ice_only/hot_only)
  categoryEditBtn: '.category-edit-btn',    // 카테고리 수정 버튼
  menuEditBtn: '.menu-edit-btn',            // 메뉴 수정 버튼
  saveBtn: 'text=저장',                     // 저장 버튼
  cancelBtn: 'text=취소'                    // 취소 버튼
};
```

---

## 🐛 디버깅 팁

### 1. 테스트 실패 시 스크린샷 찍기

```javascript
test('테스트', async ({ page }) => {
  try {
    // 테스트 코드
  } catch (error) {
    await page.screenshot({ path: 'error-screenshot.png' });
    throw error;
  }
});
```

### 2. 느리게 실행하기

```bash
# 각 액션 사이에 지연 추가
npx playwright test --debug
```

### 3. 브라우저 DevTools 열기

```javascript
// 테스트 중 DevTools 열기
await page.pause();
```

### 4. 로그 확인

```javascript
// 콘솔 로그 수집
page.on('console', msg => console.log(msg.text()));
```

---

## 📊 테스트 리포트 생성

```bash
# HTML 리포트 생성
npx playwright test --reporter=html

# 리포트 열기
npx playwright show-report
```

---

## 🔄 CI/CD 연동

### GitHub Actions 예시

```yaml
name: Playwright Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npx playwright install
      - run: python -m http.server 8000 &
      - run: npx playwright test
```

---

## 📞 테스트 실패 시 확인사항

1. **로컬 서버 실행 확인**
   ```bash
   curl http://localhost:8000
   ```

2. **Firebase 연결 확인**
   - 브라우저 개발자 도구 → Network 탭 확인
   - Firebase 요청 정상 응답 확인

3. **테스트 데이터 충돌**
   - 이전 테스트에서 삭제되지 않은 데이터 확인
   - Firebase Console에서 직접 확인

---

## 📚 참고 문서

- [Playwright 공식 문서](https://playwright.dev/)
- [TEST_CASES.md](./TEST_CASES.md) - 상세 테스트 케이스
- [example.spec.js](./example.spec.js) - 테스트 코드 예시

---

**작성일**: 2026-03-10
**버전**: 1.1 (온도 설정 enum 방식 업데이트)
