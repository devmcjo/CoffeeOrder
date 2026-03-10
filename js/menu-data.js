/**
 * 메가커피 메뉴 데이터 (2026.03.10 업데이트 - temperature 필드 추가)
 * - ICE/HOT 메뉴 통합 (단일 메뉴접 사용, UI에서 옵션 선택)
 * - temperature 필드 추가: "both" | "ice_only" | "hot_only"
 * - ICE Only: 에이드&주스, 스무디&프라페, 특정 메뉴(메가리칸 등)
 * - HOT Only: 현재 없음 (향후 확장용)
 *
 * [중요] 이 파일은 평소에는 사용되지 않습니다! (2026.02.26 DB화)
 *
 * 평상시에는 Firebase Realtime Database에서 메뉴 데이터를 불러옵니다.
 * 이 파일의 데이터는 다음과 같은 경우에만 폰백(Fallback)으로 사용됩니다:
 *   1. Firebase DB에 연결할 수 없는 경우
 *   2. Firebase DB의 menu/categories 또는 menu/items 경로에 데이터가 없는 경우
 *
 * 메뉴 관리는 menu-admin.html 페이지에서 Firebase DB를 통해 이루어집니다.
 * 이 파일을 직접 수정할 필요 없으며, DB 데이터가 우선적으로 적용됩니다.
 *
 * 관련 로직: js/app.js > getTemperatureLimit() 함수 참조
 */

const MENU_DATA = [
    // 1. 커피 (Coffee) - HOT/ICE 가능
    { name: "아메리칸", category: "커피", temperature: "both" },
    { name: "메가리칸", category: "커피", temperature: "ice_only" },
    { name: "헤이즐넛아메리칸", category: "커피", temperature: "both" },
    { name: "바닐라아메리칸", category: "커피", temperature: "both" },
    { name: "꿀아메리칸", category: "커피", temperature: "both" },
    { name: "카페라떼", category: "커피", temperature: "both" },
    { name: "카푸치노", category: "커피", temperature: "both" },
    { name: "바닐라라떼", category: "커피", temperature: "both" },
    { name: "헤이즐넛라떼", category: "커피", temperature: "both" },
    { name: "연유라떼", category: "커피", temperature: "both" },
    { name: "큐브라떼", category: "커피", temperature: "both" },
    { name: "티라미수라떼", category: "커피", temperature: "both" },
    { name: "카페모카", category: "커피", temperature: "both" },
    { name: "칼멜마끼아또", category: "커피", temperature: "both" },
    { name: "콜드브루(오리지널)", category: "커피", temperature: "both" },
    { name: "콜드브루라떼", category: "커피", temperature: "both" },
    { name: "콜드브루디카페인", category: "커피", temperature: "both" },
    { name: "콜드브루디카페인라떼", category: "커피", temperature: "both" },

    // 2. 디카페인 (Decaf) - HOT/ICE 가능
    // (모든 커피 메뉴의 디카페인 버전)
    { name: "디카페인 아메리칸", category: "디카페인", temperature: "both" },
    { name: "디카페인 메가리칸", category: "디카페인", temperature: "ice_only" },
    { name: "디카페인 카페라떼", category: "디카페인", temperature: "both" },
    { name: "디카페인 바닐라라떼", category: "디카페인", temperature: "both" },
    { name: "디카페인 헤이즐넛라떼", category: "디카페인", temperature: "both" },
    { name: "디카페인 연유라떼", category: "디카페인", temperature: "both" },
    { name: "디카페인 칼멜마끼아또", category: "디카페인", temperature: "both" },
    { name: "디카페인 카페모카", category: "디카페인", temperature: "both" },
    { name: "디카페인 티라미수라떼", category: "디카페인", temperature: "both" },
    { name: "디카페인 카푸치노", category: "디카페인", temperature: "both" },
    { name: "디카페인 꿀아메리칸", category: "디카페인", temperature: "both" },

    // 3. 음료 (Beverage) - 라떼, 우유 등 (HOT/ICE 가능)
    { name: "곡물라떼", category: "음료", temperature: "both" },
    { name: "고구마라떼", category: "음료", temperature: "both" },
    { name: "녹차라떼", category: "음료", temperature: "both" },
    { name: "딸기라떼", category: "음료", temperature: "ice_only" },
    { name: "로얄밀크티라떼", category: "음료", temperature: "both" },
    { name: "토피넛라떼", category: "음료", temperature: "both" },
    { name: "흑당라떼(펄없음)", category: "음료", temperature: "both" },
    { name: "흑당버블라떼", category: "음료", temperature: "both" },
    { name: "흑당밀크티라떼(펄없음)", category: "음료", temperature: "both" },
    { name: "흑당버블밀크티라떼", category: "음료", temperature: "both" },
    { name: "메가초코", category: "음료", temperature: "both" },
    { name: "오레오초코", category: "음료", temperature: "ice_only" },
    { name: "핫/아이스초코", category: "음료", temperature: "both" },

    // 4. 티 (Tea) - 티백 및 과일차 (HOT/ICE 가능)
    { name: "사과유자차", category: "티", temperature: "both" },
    { name: "허니자몽블랙티", category: "티", temperature: "both" },
    { name: "유자차", category: "티", temperature: "both" },
    { name: "레몬차", category: "티", temperature: "both" },
    { name: "자몽차", category: "티", temperature: "both" },
    { name: "복숭아아이스티", category: "티", temperature: "ice_only" },
    { name: "녹차(티백)", category: "티", temperature: "both" },
    { name: "얼그레이(티백)", category: "티", temperature: "both" },
    { name: "캐모마일(티백)", category: "티", temperature: "both" },
    { name: "페퍼민트(티백)", category: "티", temperature: "both" },

    // 5. 에이드 & 주스 (Ade & Juice) - ICE Only
    { name: "메가에이드(레몬+자몽+라임)", category: "에이드&주스", temperature: "ice_only" },
    { name: "매직에이드(핑크)", category: "에이드&주스", temperature: "ice_only" },
    { name: "매직에이드(블루)", category: "에이드&주스", temperature: "ice_only" },
    { name: "체리콕", category: "에이드&주스", temperature: "ice_only" },
    { name: "자몽에이드", category: "에이드&주스", temperature: "ice_only" },
    { name: "레몬에이드", category: "에이드&주스", temperature: "ice_only" },
    { name: "블루레몬에이드", category: "에이드&주스", temperature: "ice_only" },
    { name: "청포도에이드", category: "에이드&주스", temperature: "ice_only" },
    { name: "라임에이드", category: "에이드&주스", temperature: "ice_only" },
    { name: "딸기주스", category: "에이드&주스", temperature: "ice_only" },
    { name: "딸기바나나주스", category: "에이드&주스", temperature: "ice_only" },
    { name: "오렌지주스", category: "에이드&주스", temperature: "ice_only" },
    { name: "샤인머스캣그린주스", category: "에이드&주스", temperature: "ice_only" },
    { name: "레드오렌지자몽주스", category: "에이드&주스", temperature: "ice_only" },
    { name: "수박주스(시즌)", category: "에이드&주스", temperature: "ice_only" },

    // 6. 스무디 & 프라페 (Smoothie & Frappe) - ICE Only
    { name: "플레인요거트스무디", category: "스무디&프라페", temperature: "ice_only" },
    { name: "딸기요거트스무디", category: "스무디&프라페", temperature: "ice_only" },
    { name: "망고요거트스무디", category: "스무디&프라페", temperature: "ice_only" },
    { name: "블루베리요거트스무디", category: "스무디&프라페", temperature: "ice_only" },
    { name: "쿠키프라페", category: "스무디&프라페", temperature: "ice_only" },
    { name: "민트프라페", category: "스무디&프라페", temperature: "ice_only" },
    { name: "녹차프라페", category: "스무디&프라페", temperature: "ice_only" },
    { name: "리얼초코프라페", category: "스무디&프라페", temperature: "ice_only" },
    { name: "커피프라페", category: "스무디&프라페", temperature: "ice_only" },
    { name: "유니콘프라페", category: "스무디&프라페", temperature: "ice_only" },
    { name: "스트로베리치즈홀릭", category: "스무디&프라페", temperature: "ice_only" },
    { name: "퐁크러쉬(플레인)", category: "스무디&프라페", temperature: "ice_only" },
    { name: "퐁크러쉬(딸기)", category: "스무디&프라페", temperature: "ice_only" },
    { name: "퐁크러쉬(바나나)", category: "스무디&프라페", temperature: "ice_only" },
    { name: "퐁크러쉬(초코)", category: "스무디&프라페", temperature: "ice_only" },
    { name: "스모어블랙쿠키프라페", category: "스무디&프라페", temperature: "ice_only" },

    // 7. 할메가커피 - ICE Only
    { name: "할메가커피", category: "커피", temperature: "ice_only" },
    { name: "왕메가헛개리칸", category: "커피", temperature: "ice_only" },
    { name: "왕메가카페라떼", category: "커피", temperature: "ice_only" },
];

/**
 * 전체 카테고리 목록
 */
const CATEGORIES = [
    "전체",
    "커피",
    "디카페인",
    "음료",
    "티",
    "에이드&주스",
    "스무디&프라페"
];
