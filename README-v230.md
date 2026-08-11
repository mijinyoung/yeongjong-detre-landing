# 영종 디에트르 랜딩페이지 v23.0

v23은 실제 광고 운영을 위한 Meta Conversions API(CAPI) 안정화 버전입니다. 현재 Meta 캠페인의 도착 주소는 `https://exio.kr`을 유지하며, 브라우저 Pixel과 서버 CAPI의 문의 완료 이벤트가 한 건의 전환으로 중복 제거되도록 구성했습니다.

## 핵심 변경사항

- Google Sheets 저장 성공을 접수 완료의 기준으로 유지
- Sheets 저장 이후 문자와 Meta CAPI를 서로 독립적으로 처리하여 부가 연동 장애가 접수 데이터에 영향을 주지 않도록 개선
- 브라우저 Meta Pixel `Lead`와 서버 CAPI `Lead`에 같은 `event_id`를 전달해 중복 전환 방지
- Meta CAPI 응답의 `events_received`가 1건 이상인지 확인하도록 성공 판정 강화
- 방문 분석 동의 상태에서만 광고 분석 이벤트가 전송되도록 기존 동의 흐름 유지
- `/system-check`에 Meta CAPI 환경설정 확인 기능 추가
- 시스템 점검에서는 실제 가짜 전환을 보내지 않고 Pixel ID와 액세스 토큰 설정 여부만 확인
- 프로젝트 버전 및 Google Apps Script 응답 버전을 `23.0.0`으로 통일

## Vercel 환경변수

아래 값을 Production 환경에 설정합니다.

```text
NEXT_PUBLIC_SITE_URL=https://exio.kr
NEXT_PUBLIC_TRACKING_MODE=gtm
NEXT_PUBLIC_GTM_ID=GTM-KZ96PTG3
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_META_PIXEL_ID=

META_PIXEL_ID=2055619545829898
META_CAPI_ACCESS_TOKEN=Meta에서 발급한 전환 API 액세스 토큰
META_GRAPH_API_VERSION=v24.0
META_TEST_EVENT_CODE=테스트할 때만 입력

SYSTEM_CHECK_TOKEN=기존 시스템 점검 비밀번호
```

GA4와 Meta Pixel은 GTM에서 관리하므로 `NEXT_PUBLIC_GA_ID`와 `NEXT_PUBLIC_META_PIXEL_ID`는 비워 둡니다. 직접 설치값까지 동시에 넣으면 페이지 조회와 문의 전환이 중복 집계될 수 있습니다.

## Google Apps Script

현재 배포된 Apps Script가 이전 버전이면 `integrations/google-apps-script.gs` 전체를 반영한 뒤 웹 앱을 새 버전으로 다시 배포합니다. 기존 웹 앱 URL을 유지해야 Vercel 환경변수를 다시 바꿀 필요가 없습니다.

## Meta 최종 테스트

1. Meta 이벤트 관리자에서 `EXIO | 영종 디에트르 | Web` 데이터 세트의 이벤트 테스트를 엽니다.
2. 테스트 이벤트 코드를 Vercel의 `META_TEST_EVENT_CODE`에 임시로 입력하고 재배포합니다.
3. `https://exio.kr`에서 방문 분석에 동의한 뒤 실제 관심고객 등록 테스트를 한 번 진행합니다.
4. `PageView`와 `Lead`가 표시되는지 확인합니다.
5. 브라우저와 서버에서 수신된 `Lead`가 같은 이벤트 ID로 중복 제거되는지 확인합니다.
6. 확인 후 `META_TEST_EVENT_CODE`를 삭제하고 다시 배포합니다.

`/system-check`의 Meta 점검 버튼은 실제 Lead를 만들지 않습니다. 실제 전환 검증은 반드시 위 방식으로 진행합니다.

## 다음 운영 순서

1. v23을 `exio.kr`에 배포하고 기존 Meta 테스트 캠페인은 그대로 유지
2. v23 기준으로 `yeongjong.exio.kr` 복제 준비
3. GDN과 네이버 파워링크 캠페인 연결
4. 7~14일 동안 유입·문의·전환 품질 데이터 수집
5. 수집 결과를 반영해 v24 최종 운영판 제작
6. Meta 신규 캠페인부터 `yeongjong.exio.kr` 사용

## 배포 전 검증

다음 검사를 모두 통과한 결과물만 배포합니다.

```text
npm ci
npm run typecheck
npm run lint
npm run build
```
