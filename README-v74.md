# v7.4 광고 최적화·UI 마감

## 광고 추적

- GA4와 Google Ads가 하나의 Google Tag를 공유
- Google Ads 상담 완료 전환 지원
- Meta Lead 이벤트와 서버 CAPI의 `event_id` 중복 제거 유지
- 같은 브라우저 세션에서 동일 Lead 이벤트 재전송 방지
- UTM Source·Medium·Campaign·Content·Term 저장
- `gclid`, `fbclid`, 최초 유입 페이지·리퍼러 저장
- 스크롤 깊이, 주요 섹션 노출, 내부 메뉴 클릭, 체류시간 이벤트 추가
- `/system-check`에 Google Ads 설정 상태 추가

## UI 마감

- 주요 CTA hover·focus 상태 통일
- 모바일 하단 CTA 안전영역 대응
- 모바일 Hero 하단 여백 개선
- 모션 최소화 설정 대응 강화

## 선택 환경변수

```text
NEXT_PUBLIC_GOOGLE_ADS_ID=AW-...
NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL=...
```

Google Ads를 아직 사용하지 않는다면 비워두어도 기존 상담 기능에는 영향이 없습니다.

## 적용

```bash
npm install
npm run dev
git add .
git commit -m "Release v7.4 advertising optimization and UI polish"
git push
```
