# v6.5 Meta 전환 측정 강화

이번 버전은 Meta 광고의 Lead 전환을 브라우저 Pixel과 서버 Conversions API로 함께 전송할 수 있도록 준비합니다.

## 반영 내용

- 상담 접수마다 브라우저·서버 공통 `event_id` 생성
- Meta Pixel Lead 이벤트와 Conversions API 이벤트 중복 제거 준비
- 방문 분석에 동의한 고객의 접수만 서버 전환으로 전송
- `_fbp`, `_fbc`, IP, 브라우저 정보 등 매칭 품질용 값 전달
- 이름·휴대폰은 SHA-256 해시 처리 후 Meta로 전송
- Meta CAPI가 설정되지 않아도 기존 상담 접수는 정상 작동
- 테스트 모드 서버 로그에서 이름·전체 전화번호 제거
- `/api/health`에서 Meta CAPI 설정 여부 확인

## Vercel 환경변수

```text
META_PIXEL_ID=
META_CAPI_ACCESS_TOKEN=
META_GRAPH_API_VERSION=v24.0
META_TEST_EVENT_CODE=
```

`META_TEST_EVENT_CODE`는 Meta Events Manager 테스트 단계에서만 사용하고 운영 전에는 제거하세요.

## 적용

```bash
npm install
npm run dev
git add .
git commit -m "Release v6.5 Meta conversions API readiness"
git push
```
