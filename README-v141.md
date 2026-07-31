# 영종 디에트르 랜딩페이지 v14.1

Google Sheets 연동 테스트가 실패할 때 원인을 구분하기 어려웠던 문제를 해결한 운영 수정 버전입니다.

## 변경사항

- Google Sheets와 실제 상담 저장의 응답 대기시간을 7초에서 15초로 늘렸습니다.
- Apps Script가 처음 실행되는 상황에서도 불필요한 시간 초과가 줄어듭니다.
- Google Sheets 인증값 불일치를 점검 화면에서 바로 안내합니다.
- 웹 앱 주소·접근 권한·빈 응답·응답 지연을 서로 다른 메시지로 표시합니다.
- Google Apps Script가 로그인 HTML을 반환해도 성공으로 잘못 판단하지 않습니다.
- 오류 메시지에는 비밀번호와 인증값의 실제 내용이 표시되지 않습니다.

## 배포

v14가 이미 적용되어 있다면 기존 프로젝트에 덮어쓰고 Vercel만 재배포하면 됩니다.

이번 수정은 Google Sheets 열이나 저장 형식을 변경하지 않으므로 Google Apps Script를 다시 배포할 필요는 없습니다. 기존 v14 Apps Script를 그대로 사용하세요.

재배포 후 `/system-check`에서 Google Sheets 테스트를 실행하면 다음 중 하나가 정확히 표시됩니다.

- 테스트 전송 완료
- Google Sheets 인증값 불일치
- 웹 앱 주소 또는 배포 권한 확인 필요
- 응답 시간 초과

## 검증

- 현장 설정 검사
- TypeScript 검사
- ESLint 검사
- Next.js 프로덕션 빌드

## 버전

- package version: `14.1.0`
- project version: `14.1.0`
- Apps Script source version: `14.1.0`
