# 영종 디에트르 라 메르 v4.2

## 이번 버전

- 입지 섹션의 `약 5분`을 한 덩어리 텍스트로 렌더링해 숫자 기준선 문제 제거
- Google Analytics 4 선택 연동
- Meta Pixel과 GA4에 공통 이벤트 전송
- 전화 클릭 이벤트 수집
- 스크롤 깊이 25/50/75/90% 이벤트 수집
- 빠른 관심고객 폼의 Lead 전환 이벤트 통합

## 환경변수

Vercel의 Environment Variables에 필요한 값만 추가합니다.

```text
NEXT_PUBLIC_META_PIXEL_ID=
NEXT_PUBLIC_GA_ID=
GOOGLE_SHEETS_WEBHOOK_URL=
SMS_WEBHOOK_URL=
```

환경변수를 추가한 뒤에는 Vercel에서 Redeploy가 필요합니다.
