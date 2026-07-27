# v7.2 상담 운영 상태 기록

이번 버전은 상담 접수 후 문자 발송 결과를 Google Sheets에서 바로 확인할 수 있도록 개선합니다.

## 반영 내용

- 관심고객 탭에 `문자상태`, `문자처리시각`, `문자상세` 열 자동 추가
- 기존 시트가 있어도 누락된 열 자동 생성
- 접수 저장 시 문자상태를 `대기` 또는 `미설정`으로 기록
- SOLAPI 발송 성공 시 `성공`으로 갱신
- 발송 실패 시 `실패`와 오류 요약 기록
- 문자 실패가 발생해도 고객 접수와 Google Sheets 저장은 유지
- 운영 점검 안내 문구 개선
- `/api/health` 버전 7.2.0

## 중요: Apps Script 재배포

프로젝트의 최신 파일:

```text
integrations/google-apps-script.gs
```

내용을 Google Apps Script에 다시 붙여넣고:

```text
배포 → 배포 관리 → 연필 아이콘 → 새 버전 → 배포
```

를 진행해야 문자상태 열 갱신 기능이 적용됩니다.

## 적용

```bash
npm install
npm run dev
git add .
git commit -m "Release v7.2 lead delivery status tracking"
git push
```
