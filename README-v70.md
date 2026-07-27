# v7.0 운영 통합 — SOLAPI 직접 문자 발송

## 반영 내용

- Google Sheets 저장 성공 후 담당자 문자 발송
- SOLAPI REST API 직접 연결
- API Key/Secret HMAC-SHA256 서버 인증
- 등록된 발신번호와 담당자 수신번호 사용
- 문자 길이에 따라 SMS/LMS 자동 감지
- `/system-check` 문자 테스트 버튼에서 SOLAPI 직접 테스트
- SOLAPI가 설정되면 `/api/health`의 문자 알림이 연결됨으로 표시
- 기존 `SMS_WEBHOOK_URL`이 있으면 기존 웹훅을 우선 사용
- 문자 또는 광고 분석 실패 시에도 Google Sheets에 저장된 상담 접수는 유지
- Google Sheets가 실패하면 담당자 문자는 발송하지 않음

## 필수 Vercel 환경변수

```text
SOLAPI_API_KEY=
SOLAPI_API_SECRET=
SOLAPI_SENDER_NUMBER=01012345678
SMS_RECIPIENT_NUMBER=01012345678
```

환경변수 저장 후 Vercel에서 재배포해야 합니다.

## 테스트

```text
https://yeongjong-detre-landing.vercel.app/system-check
```

점검용 비밀번호를 넣고 `문자 알림 테스트`를 누르세요.

## 적용

```bash
npm install
npm run dev
git add .
git commit -m "Release v7.0 SOLAPI direct SMS integration"
git push
```
