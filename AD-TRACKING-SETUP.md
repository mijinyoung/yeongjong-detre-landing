# 분양 광고 전환 측정 설정 안내

이 프로젝트는 Meta, Google/GDN, 카카오, 네이버 광고에서 발생한 상담 신청을 하나의 `generate_lead` 이벤트로 통일합니다. 고객 정보가 Google Sheets에 정상 저장된 뒤에만 문의 완료 이벤트가 만들어집니다.

## 1. 태그 실행 방식 선택

### GTM 통합 모드 — 여러 현장 운영 권장

```text
NEXT_PUBLIC_TRACKING_MODE=gtm
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
NEXT_PUBLIC_TRACKING_DEBUG=false
```

사이트는 Google Tag Manager 컨테이너만 불러오며, Meta Pixel·GA4·Google Ads·카카오·네이버 브라우저 태그는 GTM에서 실행합니다. 서버의 Meta Conversions API는 GTM과 별개로 작동합니다.

### 직접 설치 모드 — GTM 설정 전 임시 운영

```text
NEXT_PUBLIC_TRACKING_MODE=direct
```

사이트가 환경변수에 입력된 각 광고 ID를 직접 실행합니다. GTM 컨테이너 안에 같은 태그를 함께 설치하면 전환이 중복될 수 있으므로 두 방식을 동시에 사용하지 않습니다.

## 2. Vercel 환경변수

```text
NEXT_PUBLIC_TRACKING_MODE=gtm
NEXT_PUBLIC_GTM_ID=

NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_GOOGLE_ADS_ID=
NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL=

NEXT_PUBLIC_META_PIXEL_ID=
META_PIXEL_ID=
META_CAPI_ACCESS_TOKEN=
META_GRAPH_API_VERSION=v24.0
META_TEST_EVENT_CODE=

NEXT_PUBLIC_KAKAO_PIXEL_ID=
NEXT_PUBLIC_KAKAO_LEAD_TAG=Consulting

NEXT_PUBLIC_NAVER_WCS_ACCOUNT_ID=
NEXT_PUBLIC_NAVER_WCS_DOMAIN=exio.kr
NEXT_PUBLIC_NAVER_WCS_LEAD_TYPE=lead
```

`NEXT_PUBLIC_META_PIXEL_ID`와 `META_PIXEL_ID`에는 같은 Pixel ID를 입력합니다. `META_CAPI_ACCESS_TOKEN`은 서버 전용 비밀값이므로 `NEXT_PUBLIC_` 접두사를 붙이지 않습니다.

## 3. GTM 문의 완료 이벤트

상담 저장 성공 시 아래 데이터가 `dataLayer`에 한 번 전달됩니다.

```text
event: generate_lead
event_id: 브라우저·Meta CAPI 중복 제거용 고유값
lead_id: Google Sheets 접수번호
placement: 신청 폼 위치
source: 광고 유입 출처
project_code: 현장 코드
project_name: 현장명
conversion_name: consultation_complete
```

GTM에서 다음 Data Layer Variable을 만듭니다.

- `event_id`
- `lead_id`
- `placement`
- `source`
- `project_code`
- `project_name`

그리고 이벤트 이름이 `generate_lead`인 Custom Event Trigger를 하나 만들어 아래 전환 태그가 공통으로 사용하게 합니다.

## 4. 채널별 태그 연결

### GA4

- Google tag 또는 GA4 구성 태그: 모든 페이지
- GA4 이벤트 이름: `generate_lead`
- 실행 조건: Custom Event `generate_lead`
- 이벤트 매개변수: `event_id`, `lead_id`, `placement`, `source`, `project_code`

### Google Ads·GDN

- Google Ads 전환 액션: 상담 신청 완료
- 실행 조건: Custom Event `generate_lead`
- Transaction ID: Data Layer Variable `event_id`
- GA4의 `generate_lead`를 Google Ads로 가져오는 방식과 Google Ads 전환 태그 직접 실행 중 한 가지를 주 전환으로 사용합니다.

### Meta Pixel·Conversions API

- Meta PageView: 모든 페이지
- Meta 표준 이벤트: `Lead`
- 실행 조건: Custom Event `generate_lead`
- 브라우저 Pixel Event ID: Data Layer Variable `event_id`
- 서버 CAPI도 같은 Event ID와 `Lead` 이벤트명을 사용하므로 브라우저·서버 전환이 중복 제거됩니다.

### 카카오

- 방문 이벤트: `pageView`
- 문의 완료 이벤트: `participation`
- 태그값: `Consulting`
- 실행 조건: Custom Event `generate_lead`

### 네이버 검색광고·GFA

- 신 스크립트 `wcs.trans`를 사용합니다.
- 방문 이벤트: `wcs_do()`
- 문의 완료 이벤트: `type: lead`
- 전환 ID: Data Layer Variable `event_id`
- 구 `wcs.cnv` 스크립트와 함께 설치하지 않습니다.

## 5. Meta CAPI 테스트

1. Meta 이벤트 관리자에서 테스트 이벤트 코드를 발급합니다.
2. Vercel의 `META_TEST_EVENT_CODE`에 임시 입력하고 재배포합니다.
3. 광고 분석에 동의한 상태에서 상담 신청을 한 번 완료합니다.
4. Meta 테스트 이벤트에 브라우저 `Lead`와 서버 `Lead`가 같은 Event ID로 표시되는지 확인합니다.
5. 정상 확인 후 `META_TEST_EVENT_CODE`를 삭제하고 다시 배포합니다.

운영 중 테스트 이벤트 코드가 남아 있으면 실제 광고 성과로 집계되지 않으므로 반드시 삭제합니다.

## 6. 최종 확인

1. `https://운영도메인/system-check`에 접속합니다.
2. Meta Pixel, Meta CAPI, GA4, Google Ads, 카카오 픽셀, 네이버 광고 전환이 모두 `연결됨`인지 확인합니다.
3. `광고 송출 가능` 판정을 확인합니다.
4. 분석 사용에 동의한 뒤 실제 상담을 한 건 접수합니다.
5. Google Sheets 저장, 담당자 문자, Meta 테스트 이벤트, GA4 DebugView, Google Ads 진단, 카카오 픽셀 헬퍼, 네이버 전환 스크립트 어시스턴트를 확인합니다.

## 7. 새 현장 한 번에 생성

```text
npm run campaign:new -- --code=현장코드 --name="현장명"
```

이 명령은 현장 설정, 이미지·영상 폴더, Google Apps Script, Vercel 광고 환경변수 체크리스트와 현장별 작업 안내서를 동시에 만듭니다. 이후 현장 자료와 광고 계정 ID만 교체합니다.
