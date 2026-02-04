# 메가커피 단체 주문 웹 애플리케이션

메가커피 단체 주문을 효율적으로 취합하기 위한 웹 애플리케이션입니다.

## 📌 기능

- ✅ **실시간 주문 공유**: 여러 사람이 같은 장바구니를 실시간으로 공유
- ✅ **이름 관리**: 주문자 이름 추가/삭제 (14명 기본 등록)
- ✅ **메뉴 필터링**: 카테고리별 메뉴 분류 (158개 메뉴)
- ✅ **단일/복수 주문**: 한 사람이 여러 잔 주문 가능
- ✅ **수량 제한**: 1인당 최대 20잔, 전체 최대 100잔
- ✅ **자동 초기화**: 매일 자정에 장바구니 자동 클리어
- ✅ **모바일 최적화**: 스마트폰에서 편리하게 사용
- ✅ **무료 호스팅**: Firebase 무료 플랜 사용
- ✅ **커밋 메시지 규칙**: `node build.js "Prefix : CommitLog"`
    - `style` : 디자인 변화 (코드 수정 O, 동작 영향 X)
    - `fix` : 버그 수정
    - `feat` : 기능 추가 및 개선
    - `docs` : 문서 추가 및 수정 (버전 업데이트 제외)

## 🚀 시작하기

### 1. Firebase 프로젝트 설정

`firebase_setup_guide.md` 파일을 참고하여 Firebase 프로젝트를 생성하고 설정하세요.

### 2. 로컬에서 실행하기

```powershell
# 프로젝트 디렉토리로 이동
cd C:\Users\mcJo\.gemini\antigravity\scratch\mega-coffee-order

# 간단한 HTTP 서버 실행 (Python 3)
python -m http.server 8000

# 또는 Node.js의 http-server 사용
npx http-server -p 8000
```

브라우저에서 `http://localhost:8000` 접속

### 3. 배포하기 (Firebase Hosting)

```powershell
# Firebase CLI 설치
npm install -g firebase-tools

# Firebase 로그인
firebase login

# Firebase 초기화
firebase init hosting

# 배포
firebase deploy
```

## 📂 파일 구조

```
mega-coffee-order/
├── index.html          # 주문 메인 페이지
├── admin.html         # 이름 관리 페이지
├── css/
│   └── style.css      # 스타일시트
├── js/
│   ├── menu-data.js   # 메가커피 메뉴 데이터 (158개)
│   ├── firebase-config.js  # Firebase 설정
│   ├── app.js         # 주문 페이지 로직
│   └── admin.js       # 이름 관리 페이지 로직
└── README.md          # 이 파일
```

## 🎯 사용 방법

### 주문하기

1. **이름 선택**: 드롭다운에서 이름 선택 (또는 "기타"로 직접 입력)
2. **주문 모드**: "여러 개 주문하기" 체크 시 여러 음료 선택 가능
3. **카테고리**: 원하는 카테고리 클릭 (전체/커피/티 등)
4. **음료 선택**: 목록에서 음료 선택
5. **주문 담기**: 버튼 클릭하여 장바구니에 추가
6. **장바구니 확인**: "장바구니 보기" 버튼으로 전체 주문 확인

### 이름 관리

1. **이름 관리** 버튼 클릭
2. **이름 추가**: 입력창에 이름 입력 후 "추가" 버튼
3. **이름 삭제**: 각 이름 옆 "×" 버튼 클릭
4. **돌아가기**: "주문 페이지로 돌아가기" 버튼

## 🔧 유지보수

### 메뉴 업데이트

`js/menu-data.js` 파일을 수정하여 메뉴를 추가/삭제/수정할 수 있습니다.

```javascript
// 메뉴 추가 예시
{ name: "신메뉴이름", category: "커피" }
```

### Firebase 설정 변경

`js/firebase-config.js` 파일에서 Firebase 설정 정보를 수정할 수 있습니다.

### 스타일 변경

`css/style.css` 파일을 수정하여 디자인을 변경할 수 있습니다.

## ⚙️ 설정

### 수량 제한 변경

`js/app.js` 파일에서 수량 제한을 변경할 수 있습니다:

```javascript
// 1인당 수량 제한 (현재: 20잔)
if (selectedDrinks.length > 20) { ... }

// 전체 수량 제한 (현재: 100잔)
if (newTotal > 100) { ... }
```

### 자정 클리어 시간 변경

`js/app.js`의 `startMidnightClearTimer` 함수에서 시간을 변경할 수 있습니다:

```javascript
// 현재: 00:00:00에 초기화
if (hours === 0 && minutes === 0 && seconds === 0) { ... }
```

## 🐛 문제 해결

### Firebase 연결 오류

- Firebase 설정 정보가 올바른지 확인
- 브라우저 콘솔(F12)에서 오류 메시지 확인
- Firebase 보안 규칙이 올바르게 설정되었는지 확인

### 데이터가 보이지 않음

- 인터넷 연결 상태 확인
- Firebase 프로젝트가 활성화되어 있는지 확인
- 페이지 새로고침 (Ctrl + F5)

## 📱 모바일 사용 팁

- Chrome, Safari, Edge 등 최신 브라우저 사용
- 홈 화면에 추가하면 앱처럼 사용 가능
- WiFi가 아닌 모바일 데이터로도 사용 가능

## 📞 문의

문제가 발생하거나 기능 추가를 원하시면 개발자에게 문의해주세요.

---

**개발 날짜**: 2026-02-02  
**버전**: 1.0.0  
**라이선스**: MIT
