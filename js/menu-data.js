/**
 * 메가커피 메뉴 데이터 (2026.02.02 최종 정밀 검수 버전)
 * - ICE/HOT 메뉴 통합 (단일 메뉴명 사용, UI에서 옵션 선택)
 * - 전 카테고리 누락 메뉴 대거 보완
 * - 중복 제거 및 카테고리 재정비
 */

const MENU_DATA = [
    // 1. 커피 (Coffee) - HOT/ICE 가능
    { name: "아메리카노", category: "커피" },
    { name: "메가리카노", category: "커피" },
    { name: "헤이즐넛아메리카노", category: "커피" },
    { name: "바닐라아메리카노", category: "커피" },
    { name: "꿀아메리카노", category: "커피" },
    { name: "카페라떼", category: "커피" },
    { name: "카푸치노", category: "커피" },
    { name: "바닐라라떼", category: "커피" },
    { name: "헤이즐넛라떼", category: "커피" },
    { name: "연유라떼", category: "커피" },
    { name: "큐브라떼", category: "커피" },
    { name: "티라미수라떼", category: "커피" },
    { name: "카페모카", category: "커피" },
    { name: "카라멜마끼아또", category: "커피" },
    { name: "콜드브루(오리지널)", category: "커피" },
    { name: "콜드브루라떼", category: "커피" },
    { name: "콜드브루디카페인", category: "커피" },
    { name: "콜드브루디카페인라떼", category: "커피" },

    // 2. 디카페인 (Decaf) - HOT/ICE 가능
    // (모든 커피 메뉴의 디카페인 버전)
    { name: "디카페인 아메리카노", category: "디카페인" },
    { name: "디카페인 메가리카노", category: "디카페인" },
    { name: "디카페인 카페라떼", category: "디카페인" },
    { name: "디카페인 바닐라라떼", category: "디카페인" },
    { name: "디카페인 헤이즐넛라떼", category: "디카페인" },
    { name: "디카페인 연유라떼", category: "디카페인" },
    { name: "디카페인 카라멜마끼아또", category: "디카페인" },
    { name: "디카페인 카페모카", category: "디카페인" },
    { name: "디카페인 티라미수라떼", category: "디카페인" },
    { name: "디카페인 카푸치노", category: "디카페인" },
    { name: "디카페인 꿀아메리카노", category: "디카페인" },

    // 3. 음료 (Beverage) - 라떼, 우유 등 (HOT/ICE 가능)
    { name: "곡물라떼", category: "음료" },
    { name: "고구마라떼", category: "음료" },
    { name: "녹차라떼", category: "음료" },
    { name: "딸기라떼", category: "음료" }, // 보통 ICE only지만 통합 관리
    { name: "로얄밀크티라떼", category: "음료" },
    { name: "토피넛라떼", category: "음료" },
    { name: "흑당라떼(펄없음)", category: "음료" },
    { name: "흑당버블라떼", category: "음료" },
    { name: "흑당밀크티라떼(펄없음)", category: "음료" },
    { name: "흑당버블밀크티라떼", category: "음료" },
    { name: "메가초코", category: "음료" },
    { name: "오레오초코", category: "음료" },
    { name: "핫/아이스초코", category: "음료" }, // 통합 명칭 '초코라떼' 사용 권장하나 인지도 위해 메가초코 등 유지

    // 4. 티 (Tea) - 티백 및 과일차 (HOT/ICE 가능)
    { name: "사과유자차", category: "티" }, // ★ 누락 수정
    { name: "허니자몽블랙티", category: "티" },
    { name: "유자차", category: "티" },
    { name: "레몬차", category: "티" },
    { name: "자몽차", category: "티" },
    { name: "복숭아아이스티", category: "티" }, // 이름은 아이스티지만 따뜻하게 요청하는 경우도 있어 통합
    { name: "녹차(티백)", category: "티" },
    { name: "얼그레이(티백)", category: "티" },
    { name: "캐모마일(티백)", category: "티" },
    { name: "페퍼민트(티백)", category: "티" },

    // 5. 에이드 & 주스 (Ade & Juice) - 보통 ICE Only
    { name: "메가에이드(레몬+자몽+라임)", category: "에이드&주스" },
    { name: "매직에이드(핑크)", category: "에이드&주스" },
    { name: "매직에이드(블루)", category: "에이드&주스" },
    { name: "체리콕", category: "에이드&주스" },
    { name: "자몽에이드", category: "에이드&주스" },
    { name: "레몬에이드", category: "에이드&주스" },
    { name: "블루레몬에이드", category: "에이드&주스" },
    { name: "청포도에이드", category: "에이드&주스" },
    { name: "라임에이드", category: "에이드&주스" },
    { name: "딸기주스", category: "에이드&주스" },
    { name: "딸기바나나주스", category: "에이드&주스" },
    { name: "오렌지주스", category: "에이드&주스" },
    { name: "샤인머스캣그린주스", category: "에이드&주스" },
    { name: "레드오렌지자몽주스", category: "에이드&주스" },
    { name: "수박주스(시즌)", category: "에이드&주스" },

    // 6. 스무디 & 프라페 (Smoothie & Frappe) - ICE Only
    { name: "플레인요거트스무디", category: "스무디&프라페" },
    { name: "딸기요거트스무디", category: "스무디&프라페" },
    { name: "망고요거트스무디", category: "스무디&프라페" },
    { name: "블루베리요거트스무디", category: "스무디&프라페" },
    { name: "쿠키프라페", category: "스무디&프라페" },
    { name: "민트프라페", category: "스무디&프라페" },
    { name: "녹차프라페", category: "스무디&프라페" },
    { name: "리얼초코프라페", category: "스무디&프라페" },
    { name: "커피프라페", category: "스무디&프라페" },
    { name: "유니콘프라페", category: "스무디&프라페" },
    { name: "스트로베리치즈홀릭", category: "스무디&프라페" },
    { name: "퐁크러쉬(플레인)", category: "스무디&프라페" },
    { name: "퐁크러쉬(딸기)", category: "스무디&프라페" },
    { name: "퐁크러쉬(바나나)", category: "스무디&프라페" },
    { name: "퐁크러쉬(초코)", category: "스무디&프라페" },
    { name: "스모어블랙쿠키프라페", category: "스무디&프라페" }
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
