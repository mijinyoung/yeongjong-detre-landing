# v0.5 설정 — DB 저장·문자 알림 준비

## 이번 버전에서 달라진 점
- 관심고객 폼이 `/api/leads` 서버 API로 실제 전송됩니다.
- 이름·휴대폰·동의를 서버에서 다시 검증합니다.
- UTM 유입경로(`utm_source`, `utm_campaign`, `utm_content`)를 함께 수집합니다.
- Google Sheets 웹훅과 문자 웹훅을 동시에 호출할 수 있습니다.
- 봇 입력 방지용 숨김 필드가 추가되었습니다.

## 1. 로컬 적용
기존 프로젝트에 이 압축파일의 폴더를 덮어쓴 뒤:

```bash
npm install
npm run dev
```

환경변수가 없어도 화면 테스트는 가능합니다. 이 경우 제출 데이터는 VS Code 터미널에 `[LEAD:TEST_MODE]`로 표시됩니다.

## 2. 구글 스프레드시트 연결
1. 새 Google 스프레드시트를 생성합니다.
2. `확장 프로그램 > Apps Script`를 엽니다.
3. `integrations/google-apps-script.gs` 내용을 붙여넣습니다.
4. `배포 > 새 배포 > 웹 앱`을 선택합니다.
5. 실행 사용자는 본인, 액세스 사용자는 웹앱 호출이 가능한 범위로 정합니다.
6. 생성된 웹 앱 URL을 복사합니다.
7. 프로젝트 루트에 `.env.local`을 만들고 아래처럼 입력합니다.

```env
GOOGLE_SHEET_WEBHOOK_URL=https://script.google.com/macros/s/발급값/exec
SMS_WEBHOOK_URL=
WEBHOOK_SECRET=원하는-긴-문자열
```

## 3. 문자 알림 연결
문자 발송은 발신번호 등록과 업체 계정이 필요합니다. Make·Zapier·Pabbly 또는 문자 발송 업체에서 Webhook 시나리오를 만든 뒤 URL을 `SMS_WEBHOOK_URL`에 넣으세요.

전송 데이터 예시는 `integrations/sms-webhook-payload.md`에 있습니다.

## 4. Vercel 환경변수
Vercel 프로젝트 > Settings > Environment Variables에서 아래를 등록합니다.
- `GOOGLE_SHEET_WEBHOOK_URL`
- `SMS_WEBHOOK_URL`
- `WEBHOOK_SECRET`

환경변수 등록 후 다시 Deploy해야 적용됩니다.

## 5. 테스트 주소 예시
UTM 수집 확인:

```
http://localhost:3000/?utm_source=meta&utm_campaign=test-campaign&utm_content=image-a
```

폼 제출 후 스프레드시트에 유입경로가 함께 기록되는지 확인하세요.
