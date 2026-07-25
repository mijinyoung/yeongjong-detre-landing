# 문자 웹훅으로 전달되는 데이터

`SMS_WEBHOOK_URL`에는 아래 형태의 JSON이 POST됩니다.

```json
{
  "name": "홍길동",
  "phone": "010-1234-5678",
  "source": "meta",
  "campaign": "lamer-lead-01",
  "content": "ocean-view-a",
  "submittedAt": "2026-07-25T03:00:00.000Z",
  "pageUrl": "https://...",
  "referrer": "https://..."
}
```

Make·Zapier·Pabbly 또는 사용 중인 문자 발송 업체에서 이 웹훅을 받은 뒤 담당자 휴대폰으로 아래 내용을 전송하도록 설정합니다.

```
[영종 디에트르 관심고객]
이름: {{name}}
연락처: {{phone}}
유입: {{source}}
캠페인: {{campaign}}
등록: {{submittedAt}}
```
