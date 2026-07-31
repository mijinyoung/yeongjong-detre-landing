# 영종 디에트르 랜딩페이지 v15.0

Google Sheets 연결을 위해 Apps Script와 Vercel에 동일한 비밀번호를 각각 입력하던 구조를 제거한 근본 개선 버전입니다.

## 핵심 변경

- `GOOGLE_SHEET_WEBHOOK_URL`에 저장된 웹 앱 주소에서 서버 연결 키를 자동 생성합니다.
- Apps Script도 자신의 현재 웹 앱 주소에서 같은 연결 키를 자동 계산합니다.
- 별도의 Google Sheets 연결 비밀번호를 복사하거나 맞출 필요가 없습니다.
- 기존 `WEBHOOK_SECRET` 방식은 v14에서 v15로 순차 배포할 때를 위해 호환용으로 유지합니다.
- 상담 등록, 문자 상태 기록, 관리자 목록, 전화번호 확인, 상담 상태 저장 모두 같은 자동 연결 방식을 사용합니다.
- 웹 앱 주소는 브라우저 코드에 포함되지 않고 Vercel 서버 환경에만 보관됩니다.

## 한 번만 진행할 적용 순서

### 1. Google Apps Script 업데이트

`integrations/google-apps-script.gs` 전체 내용을 기존 Apps Script에 덮어씁니다.

```text
배포 → 배포 관리 → 수정 → 버전: 새 버전 → 배포
```

기존 웹 앱 URL은 그대로 유지합니다.

### 2. 홈페이지 v15 배포

v15 파일을 기존 프로젝트에 덮어쓴 뒤 GitHub Desktop에서 Commit과 Push를 진행합니다. Vercel 배포가 `Ready`가 될 때까지 기다립니다.

### 3. 연동 테스트

`/system-check`에서 Google Sheets 테스트를 실행합니다. 성공하면 기존 시트 오른쪽 끝에 `검색어` 열이 자동 추가되고 테스트 접수가 저장됩니다.

## Vercel 환경변수

필수:

```text
GOOGLE_SHEET_WEBHOOK_URL=https://script.google.com/macros/s/배포ID/exec
```

v15 적용 후 다음 값은 Google Sheets 연결에 필요하지 않습니다.

```text
GOOGLE_SHEET_WEBHOOK_SECRET
WEBHOOK_SECRET
```

기존 값은 그대로 두어도 작동하며, v15 테스트 성공 후 삭제할 수 있습니다. `SMS_WEBHOOK_SECRET`은 별도 문자 웹훅을 사용하는 경우 유지합니다.

## 보안 주의

웹 앱 URL 자체가 서버 연결 식별값으로 사용되므로 공개 문서, 광고 주소, 클라이언트 코드에 넣지 마세요. 현재 구조에서는 Vercel의 서버 전용 환경변수와 Apps Script 안에서만 사용됩니다.

## 기존 기능 유지

- 상담 중복 저장 방지
- Google Sheets 저장 우선 처리
- SOLAPI 및 문자 웹훅
- 관리자 로그인·세션·CSRF 보호
- 고객 전화번호 마스킹
- 상담 상태와 메모 저장
- UTM·검색어·광고 클릭 ID 저장
- Meta·Google 광고 전환 측정

## 검증

- 현장 설정 및 이미지·영상 검사
- Vercel·Apps Script 자동 연결 규칙 일치 검사
- TypeScript 검사
- ESLint 검사
- Next.js 프로덕션 빌드

## 버전

- package version: `15.0.0`
- project version: `15.0.0`
- Google Apps Script version: `15.0.0`
