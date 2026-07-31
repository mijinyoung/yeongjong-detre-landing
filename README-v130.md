# 영종 디에트르 랜딩페이지 v13.0

현재 현장을 실제 광고 송출 직전 상태로 점검하고, 매체별 광고 주소를 실수 없이 만들 수 있도록 운영 기능을 보강한 버전입니다.

## 핵심 개선

- 관리자 화면에 `광고 송출 주소 만들기` 기능을 추가했습니다.
- 네이버 검색광고, Google Ads, Meta 광고, 카카오 광고의 기본 유입값을 자동으로 입력합니다.
- 캠페인명·광고소재명·검색어를 구분해 UTM 광고 주소를 생성합니다.
- 생성한 주소를 한 번에 복사하거나 새 창에서 직접 점검할 수 있습니다.
- 실제 배포 도메인을 자동으로 불러오며 직접 수정도 가능합니다.
- 홈페이지에 들어온 UTM 값은 기존과 동일하게 Google Sheets와 관리자 광고 리포트에 저장됩니다.

## 광고 송출 전 최종 판정

`/system-check` 화면을 다음 항목까지 확인하도록 강화했습니다.

- 실제 HTTPS 홈페이지 주소
- Google Sheets 상담 저장
- 담당자 문자 알림
- 관리자 보안 세션
- 개발용 테스트 모드 해제
- Meta Pixel·GA4·Google Ads 브라우저 측정
- Meta 서버 전환 측정

필수 항목이 모두 정상이고 광고 측정 도구가 하나 이상 연결되면 `광고 송출 가능`으로 표시됩니다. 비밀번호이나 API 키의 실제 값은 화면에 표시하지 않습니다.

## 광고 주소 사용 방법

1. 배포된 홈페이지의 `/admin`에 로그인합니다.
2. `광고 송출 주소 만들기`에서 광고 매체를 선택합니다.
3. 캠페인명과 광고소재명을 입력합니다.
4. `광고 주소 복사`를 누릅니다.
5. 복사한 주소를 해당 광고 관리자 화면의 랜딩페이지 주소에 붙여넣습니다.

광고소재마다 `광고소재명`을 다르게 입력해야 관리자 화면에서 어느 광고가 문의를 만들었는지 비교할 수 있습니다.

예시:

```text
캠페인명: yeongjong-launch
광고소재명: video-a
광고소재명: image-b
```

## 배포 후 최종 점검 순서

1. Vercel 배포 상태가 `Ready`인지 확인합니다.
2. `/system-check`에서 `광고 송출 가능` 판정을 확인합니다.
3. Google Sheets와 문자 알림 테스트를 각각 한 번 실행합니다.
4. `/admin`에서 실제 광고 주소를 만듭니다.
5. 만든 주소를 새 창으로 열고 관심고객 등록을 1회 완료합니다.
6. Google Sheets와 관리자 화면에 유입경로·캠페인·광고소재가 정확히 표시되는지 확인합니다.
7. Meta Events Manager 또는 Google 광고 도구에서 완료 전환 수신을 확인한 뒤 광고를 시작합니다.

## 환경변수 확인

다음 값은 실제 광고 송출 전에 반드시 설정되어야 합니다.

```text
NEXT_PUBLIC_SITE_URL
GOOGLE_SHEET_WEBHOOK_URL
GOOGLE_SHEET_WEBHOOK_SECRET
SYSTEM_CHECK_TOKEN
ADMIN_DASHBOARD_TOKEN
ADMIN_SESSION_SECRET
ADMIN_ALLOWED_ORIGINS
```

문자 알림은 사용 중인 방식에 맞춰 `SMS_WEBHOOK_URL` 또는 SOLAPI 환경변수를 설정합니다. 광고 측정은 실제 사용하는 매체에 맞춰 Meta, GA4, Google Ads 값을 설정합니다.

`LEAD_TEST_MODE`는 운영 환경에서 반드시 `false`이거나 비어 있어야 합니다.

## 기존 연동 작업

이번 버전은 Google Sheets 열 구조나 저장 로직을 변경하지 않았습니다. v12에서 Apps Script를 이미 업데이트했다면 Google Apps Script를 다시 배포할 필요가 없습니다.

## 검증

- 현장 설정 및 이미지·영상 파일 검사
- TypeScript 검사
- ESLint 검사
- Next.js 프로덕션 빌드

## 버전

- package version: `13.0.0`
- project version: `13.0.0`
- Google Apps Script source version: `13.0.0`
