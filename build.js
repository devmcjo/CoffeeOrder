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

    // 3. 인자 분석
    const args = process.argv.slice(2);
    const isDeploy = args.includes('--deploy');
    const messageArg = args.find(arg => arg !== '--deploy') || 'feat : Update';

    // 커밋 타입 및 메시지 추출
    let prefix = 'feat';
    let commitSummary = messageArg;

    if (messageArg.includes(' : ')) {
        [prefix, commitSummary] = messageArg.split(' : ').map(s => s.trim());
    }

    const isDocs = prefix.toLowerCase() === 'docs';
    let newVersion = currentVersion;

    // 배포 모드이면서 docs가 아닌 경우에만 버전 업데이트 수행
    if (isDeploy && !isDocs) {
        // 새 버전 번호 계산 (1.YY.M.Count)
        let [major, verYear, verMonth, verCount] = currentVersion.split('.').map(Number);

        if (verYear === Number(shortYear) && verMonth === month) {
            verCount++;
        } else {
            verYear = Number(shortYear);
            verMonth = month;
            verCount = 1;
        }
        newVersion = `${major}.${verYear}.${verMonth}.${verCount}`;

        // 4. 파일 내용 업데이트
        content = content.replace(versionRegex, `version: '${newVersion}'`);
        content = content.replace(dateRegex, `date: '${todayStr}'`);
        fs.writeFileSync(versionFilePath, content, 'utf8');
        console.log(`✅ Build Success! (Version up to ${newVersion})`);
    } else {
        if (isDeploy && isDocs) {
            console.log(`📝 Docs Deploy - Version remains ${newVersion}`);
        } else {
            console.log(`📦 Commit Mode - Version remains ${newVersion}`);
        }
    }

    console.log(`📅 Date: ${todayStr}`);
    console.log(`🆙 Version: ${currentVersion} -> ${newVersion}`);

    // 5. Git 명령 실행
    console.log('🚀 Git Commit & Push 진행 중...');

    try {
        // 모든 변경 사항 스테이징
        execSync('git add .', { stdio: 'inherit' });

        // 커밋 메시지 구성
        // 배포 모드이며 docs가 아닐 때만 버전을 메시지에 포함
        let commitMessage = `${prefix} : ${commitSummary}`;
        if (isDeploy && !isDocs) {
            commitMessage += ` | Build: ${newVersion}`;
        }

        execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });

        // 푸시
        console.log('☁️ Pushing to remote...');
        try {
            execSync('git remote get-url origin', { stdio: 'ignore' });
            execSync('git push origin main', { stdio: 'inherit' });
            console.log('✅ Git Push 완료!');

            // 6. 배포 모드인 경우에만 Firebase Hosting 배포
            if (isDeploy) {
                console.log('🔥 Firebase Hosting 배포 시작...');
                try {
                    execSync('firebase.cmd deploy', { stdio: 'inherit' });
                    console.log('🎉 모든 작업이 완료되었습니다! (버전 업 + 커밋 + 푸시 + 배포)');
                } catch (deployError) {
                    console.error('❌ Firebase 배포 실패:', deployError.message);
                    console.log('👉 "firebase.cmd deploy" 명령어로 수동 배포를 시도해보세요.');
                }
            } else {
                console.log('✨ Commit & Push 완료! (배포는 건너뜁니다)');
            }

        } catch (e) {
            console.log('⚠️ 원격 저장소(origin) 설정 확인 필요 또는 Push 실패');
        }

    } catch (gitError) {
        console.error('❌ Git 작업 중 오류 발생:', gitError.message);
    }

} catch (error) {
    console.error('❌ Build Failed:', error.message);
    process.exit(1);
}
