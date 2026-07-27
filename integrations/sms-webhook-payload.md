# 문자 알림 웹훅 연동 규격 — v6.6

`SMS_WEBHOOK_URL`을 설정하면 관심고객 접수 시 아래 형태의 JSON이 POST로 전송됩니다.

```json
{
  "leadId": "YD-20260727-ABC123",
  "submittedAt": "2026-07-27T06:10:00.000Z",
  "name": "홍길동",
  "phone": "010-1234-5678",
  "source": "meta",
  "campaign": "summer-launch",
  "content": "creative-a",
  "placement": "hero",
  "pageUrl": "https://example.vercel.app/",
  "referrer": "https://www.facebook.com/",
  "consentAt": "2026-07-27T06:10:01.000Z",
  "_webhookSecret": "Vercel WEBHOOK_SECRET 값"
}
```

## 권장 담당자 문자 내용

```text
[영종 디에트르 신규문의]
접수번호: {{leadId}}
고객명: {{name}}
연락처: {{phone}}
유입: {{source}} / {{campaign}}
신청위치: {{placement}}
```

## 연결 가능한 방식

- SOLAPI API를 호출하는 자체 서버 또는 자동화 웹훅
- Make
- Zapier
- Pabbly Connect
- n8n
- 사내 CRM 웹훅

문자 서비스에서 발신번호 사전 등록이 필요한 경우가 많습니다.
액세스 키와 비밀 키는 브라우저 코드나 `NEXT_PUBLIC_` 환경변수에 넣지 말고,
반드시 서버 또는 자동화 서비스의 비밀값으로 저장하세요.
