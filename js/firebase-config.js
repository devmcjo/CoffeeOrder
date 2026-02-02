/**
 * Firebase 설정 파일
 * Firebase Realtime Database 연결을 위한 설정 정보
 * 
 * 사용자의 Firebase 프로젝트와 연동됩니다.
 */

// Firebase SDK import (CDN 방식 사용 - HTML에서 로드)
// 이 파일은 HTML에서 Firebase SDK를 로드한 후에 실행되어야 합니다

/**
 * Firebase 설정 객체
 * 프로젝트별 고유한 설정 정보
 */
const firebaseConfig = {
    apiKey: "AIzaSyDJxPa17go4ttJy_bYeTewtVWtxL2wv5Lo",
    authDomain: "coffeeorder-94399.firebaseapp.com",
    databaseURL: "https://coffeeorder-94399-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "coffeeorder-94399",
    storageBucket: "coffeeorder-94399.firebasestorage.app",
    messagingSenderId: "201059319616",
    appId: "1:201059319616:web:900ca13f9fab454d4544a5",
    measurementId: "G-K3QJK48C4K"
};

// Firebase 앱 초기화
let app;
let database;

/**
 * Firebase 초기화 함수
 * HTML 파일에서 Firebase SDK가 로드된 후 호출됩니다
 */
function initializeFirebase() {
    try {
        // Firebase 앱 초기화
        app = firebase.initializeApp(firebaseConfig);

        // Realtime Database 인스턴스 가져오기
        database = firebase.database();

        console.log('Firebase 초기화 성공!');
        return true;
    } catch (error) {
        console.error('Firebase 초기화 실패:', error);
        return false;
    }
}

/**
 * 데이터베이스 참조 가져오기
 * @param {string} path - 데이터베이스 경로 (예: 'orders', 'names')
 * @returns {firebase.database.Reference} 데이터베이스 참조 객체
 */
function getRef(path) {
    return database.ref(path);
}
