/**
 * 빌드 버전 정보 관리
 * build.js 스크립트에 의해 자동으로 업데이트됩니다.
 */
const BUILD_INFO = {
    version: '1.26.2.6',
    date: '2026.02.02'
};

// 페이지 로드 시 푸터 정보 업데이트
document.addEventListener('DOMContentLoaded', () => {
    const footer = document.querySelector('footer');
    if (footer) {
        // 첫 번째 p 태그 (빌드 정보) 찾기
        const buildP = footer.querySelector('p:first-child');
        if (buildP) {
            buildP.textContent = `Build: ${BUILD_INFO.date} | Ver ${BUILD_INFO.version}`;
        }
    }
    console.log(`Current Build: ${BUILD_INFO.version} (${BUILD_INFO.date})`);
});
