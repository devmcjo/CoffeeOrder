/**
 * 빌드 버전 업데이트 스크립트
 * 사용법: node build.js
 * 
 * 기능:
 * 1. js/version.js 파일을 읽음
 * 2. 현재 날짜를 기준으로 Build Date 갱신
 * 3. 버전 번호(1.YY.M.Count) 자동 관리
 *    - YY, M이 바뀌면 Count는 1로 초기화
 *    - 같으면 Count + 1
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const versionFilePath = path.join(__dirname, 'js', 'version.js');

try {
    // 1. 기존 파일 읽기
    let content = fs.readFileSync(versionFilePath, 'utf8');

    // 버전 정보 추출 정규식
    const versionRegex = /version:\s*'([^']+)'/;
    const dateRegex = /date:\s*'([^']+)'/;

    const currentVersionMatch = content.match(versionRegex);
    const currentDateMatch = content.match(dateRegex);

    if (!currentVersionMatch || !currentDateMatch) {
        throw new Error('버전 정보를 찾을 수 없습니다.');
    }

    const currentVersion = currentVersionMatch[1];
    // const lastDate = currentDateMatch[1]; // 이전 날짜는 기록용

    // 2. 날짜 정보 계산
    const now = new Date();
    const year = now.getFullYear();
    const shortYear = year.toString().slice(-2); // 26
    const month = now.getMonth() + 1; // 2
    const day = now.getDate();

    const todayStr = `${year}.${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}`;

    // 3. 새 버전 번호 계산 (1.YY.M.Count)
    let [major, verYear, verMonth, verCount] = currentVersion.split('.').map(Number);

    if (verYear === Number(shortYear) && verMonth === month) {
        // 같은 년/월이면 카운트 증가
        verCount++;
    } else {
        // 년/월이 바뀌면 카운트 리셋 (및 년월 갱신)
        verYear = Number(shortYear);
        verMonth = month;
        verCount = 1;
    }

    const newVersion = `${major}.${verYear}.${verMonth}.${verCount}`;

    // 4. 파일 내용 업데이트
    content = content.replace(versionRegex, `version: '${newVersion}'`);
    content = content.replace(dateRegex, `date: '${todayStr}'`);

    fs.writeFileSync(versionFilePath, content, 'utf8');

    console.log(`✅ Build Success!`);
    console.log(`📅 Date: ${todayStr}`);
    console.log(`🆙 Version: ${currentVersion} -> ${newVersion}`);

    // 5. Git 명령 실행
    console.log('🚀 Git Commit & Push 진행 중...');

    try {
        // 모든 변경 사항 스테이징
        execSync('git add .', { stdio: 'inherit' });

        // 커밋
        const commitMessage = `Build: ${newVersion} (${todayStr})`;
        execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });

        // 푸시 (origin이 설정되어 있다고 가정)
        // 주의: 원격 저장소가 설정되지 않았거나 권한이 없으면 실패할 수 있음
        console.log('☁️ Pushing to remote...');
        // execSync('git push origin main', { stdio: 'inherit' }); // 사용자 설정 전이므로 주석 처리 권장하나 요청사항이므로 시도
        // 리모트가 있는지 확인
        try {
            execSync('git remote get-url origin', { stdio: 'ignore' });
            execSync('git push origin main', { stdio: 'inherit' });
            console.log('✅ Git Push 완료!');
        } catch (e) {
            console.log('⚠️ 원격 저장소(origin)가 설정되지 않아 Push는 건너뜁니다.');
            console.log('👉 "git remote add origin <url>" 명령어로 원격 저장소를 연결해주세요.');
        }

    } catch (gitError) {
        console.error('❌ Git 작업 중 오류 발생:', gitError.message);
        // 빌드 자체는 성공했으므로 프로세스는 종료하지 않음
    }

} catch (error) {
    console.error('❌ Build Failed:', error.message);
    process.exit(1);
}
