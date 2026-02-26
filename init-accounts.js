/**
 * Firebase 초기 계정 설정 스크립트
 * 최초 관리자(admin/1234)와 매니저(manager/1234) 계정을 생성합니다.
 *
 * 사용법:
 * 1. 브라우저에서 콘솔(F12)을 열고 이 스크립트를 붙여넣기
 * 2. 또는 HTML 파일에 이 스크립트를 포함하여 실행
 */

// Firebase 초기화 후 실행
async function initializeAccounts() {
    if (typeof initializeFirebase === 'function') {
        initializeFirebase();
    }

    const database = firebase.database();
    const accountsRef = database.ref('accounts');

    try {
        // 현재 계정 정보 확인
        const snapshot = await accountsRef.once('value');
        const existingAccounts = snapshot.val();

        if (existingAccounts) {
            console.log('계정 정보가 이미 존재합니다:', existingAccounts);
            const overwrite = confirm('계정 정보가 이미 존재합니다. 초기화하시겠습니까?');
            if (!overwrite) {
                console.log('초기화가 취소되었습니다.');
                return;
            }
        }

        // 초기 계정 데이터
        const initialData = {
            admin: {
                id: 'admin',
                password: '1234'
            },
            managers: {
                // 초기 매니저 계정
                manager1: {
                    id: 'manager',
                    password: '1234'
                }
            }
        };

        // 계정 생성
        await accountsRef.set(initialData);

        console.log('✅ 초기 계정 설정 완료!');
        console.log('관리자: admin / 1234');
        console.log('매니저: manager / 1234');
        alert('초기 계정 설정이 완료되었습니다!\n\n관리자: admin / 1234\n매니저: manager / 1234');
    } catch (error) {
        console.error('❌ 계정 설정 실패:', error);
        alert('계정 설정에 실패했습니다. 콘솔을 확인해주세요.');
    }
}

// 스크립트 로드 시 자동 실행 (Firebase 초기화 후)
if (typeof firebase !== 'undefined') {
    initializeAccounts();
} else {
    console.error('Firebase SDK가 로드되지 않았습니다. firebase-config.js를 먼저 로드해주세요.');
}
