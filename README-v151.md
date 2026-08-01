# 영종 디에트르 랜딩페이지 v15.1

Google Sheets의 접수 시간을 한국 운영자가 바로 읽을 수 있게 정리한 운영 편의성 개선 버전입니다.

## 핵심 변경

- `등록일시`를 UTC ISO 글자가 아닌 Google Sheets의 실제 날짜·시간 값으로 저장합니다.
- 시트 표시 형식을 `2026-07-31 18:12:18`로 통일합니다.
- 스프레드시트 시간대를 `Asia/Seoul`로 자동 맞춥니다.
- `개인정보동의시각`, `문자처리시각`도 같은 기준으로 저장합니다.
- 기존의 `2026-07-31T09:12:18.600Z` 형식 데이터는 첫 연동 테스트 때 한 번만 자동 변환합니다.
- 기존 시트의 수식과 다른 열 서식은 변경하지 않습니다.
- 관리자 화면에는 시트 표시 형식과 무관하게 정확한 시각이 전달됩니다.

## 적용 순서

1. v15.1 파일을 기존 프로젝트에 덮어쓴 뒤 GitHub Desktop에서 Commit·Push합니다.
2. `integrations/google-apps-script.gs` 전체를 기존 Google Apps Script에 덮어씁니다.
3. Apps Script에서 `배포 → 배포 관리 → 수정 → 버전: 새 버전 → 배포`를 선택합니다.
4. Vercel 배포가 `Ready`가 되면 `/system-check`에서 Google Sheets 테스트를 한 번 실행합니다.
5. 테스트 접수와 기존 접수의 `등록일시`가 한국시간으로 표시되는지 확인합니다.

기존 Apps Script 웹 앱 주소와 Vercel 환경변수는 바꾸지 않습니다.

## 시간 표시 예시

```text
변경 전: 2026-07-31T09:12:18.600Z
변경 후: 2026-07-31 18:12:18
```

두 값은 같은 시각이며, 변경 후 표시는 한국시간입니다.

## 검증 항목

- Google Apps Script 문법 검사
- 현장 설정·이미지·영상 검사
- TypeScript 검사
- ESLint 검사
- Next.js 프로덕션 빌드

## 버전

- package version: `15.1.0`
- project version: `15.1.0`
- Google Apps Script version: `15.1.0`
