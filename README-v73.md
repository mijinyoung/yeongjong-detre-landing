# v7.3 Stable

## 핵심 변경
- Google Sheets의 표·드롭다운·스마트칩·열 유형을 자동 변경하지 않음
- 기존 시트 서식과 데이터 유지
- 누락된 헤더만 오른쪽 끝에 추가
- 헤더 이름 기준으로 올바른 열에 저장
- 접수번호 기준으로 문자상태만 갱신
- `/api/health` 버전 7.3.0

## Apps Script 적용
`integrations/google-apps-script.gs` 전체를 Apps Script에 붙여넣고
`WEBHOOK_SECRET`을 기존 실제 값으로 다시 입력한 뒤 기존 웹앱을 새 버전으로 배포하세요.

## 프로젝트 적용
```bash
npm install
npm run dev
git add .
git commit -m "Release v7.3 stable Google Sheets integration"
git push
```
