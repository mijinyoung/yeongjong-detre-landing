# 멀티 프로젝트 광고 플랫폼 운영 안내

## 운영 원칙

홈페이지 기능 코드는 하나로 관리하지만, 실제 광고 현장은 서로 분리해 배포합니다.

- 공통 관리: 화면 구성, 폼 안정성, 관리자 기능, 광고 추적, 성능·보안 개선
- 현장별 분리: 문구, 이미지, 영상, 도메인, 전화번호, Google Sheets, SOLAPI, Meta·Google 광고 계정, 관리자 비밀번호
- 배포: 현장마다 별도 Vercel 프로젝트와 도메인을 사용

이 구조에서는 공통 기능을 한 번 개선해 모든 현장에 적용할 수 있고, 새 현장은 자료 교체와 연동 설정 중심으로 제작할 수 있습니다. 동시에 한 현장의 시트나 광고 전환이 다른 현장과 섞이는 문제를 막습니다.

## 새 현장 제작 흐름

1. `PROJECT-MATERIALS-TEMPLATE.md`에 적힌 자료를 한 번에 준비합니다.
2. 새 현장 코드를 정하고 초안을 생성합니다.
3. 현장 전용 설정 파일과 `public/projects/현장코드/` 자료 폴더를 채웁니다.
4. 현장 전용 Apps Script를 새 Google Sheet에 배포합니다.
5. 별도 Vercel 프로젝트에 현장별 환경변수를 설정합니다.
6. 초안 상태를 운영 가능 상태로 바꾸고 전체 검증을 통과시킵니다.
7. 도메인 연결 후 폼·문자·시트·광고 전환을 실접수로 최종 시험합니다.

## 자동 생성 명령

개발자가 사용하는 명령이며, 일반 운영 중 직접 실행할 필요는 없습니다.

```text
npm run project:new -- --code=new-site --name="새 현장명" --dry-run
npm run project:new -- --code=new-site --name="새 현장명"
```

생성되는 항목:

- `data/projects/new-site.json`: 현장 전용 콘텐츠 설정
- `public/projects/new-site/`: 현장 전용 이미지·영상 폴더
- `integrations/projects/new-site/google-apps-script.gs`: 현장 전용 시트 연동 코드
- `data/projects/registry.json`: 현장 등록 정보

새 현장은 처음에 `draft`로 등록됩니다. 자료와 연동값이 완성되기 전에는 빌드 대상으로 선택할 수 없으므로 미완성 사이트가 실수로 배포되지 않습니다.

## Vercel 현장 선택

각 Vercel 프로젝트에 다음 값을 설정합니다.

```text
NEXT_PUBLIC_PROJECT_CODE=현장코드
NEXT_PUBLIC_SITE_URL=https://현장별-도메인
```

`NEXT_PUBLIC_PROJECT_CODE`는 공개되어도 되는 현장 식별값입니다. API 키, 관리자 비밀번호, 시트·문자·광고 인증값은 기존처럼 비공개 환경변수로만 관리합니다.

## 반드시 현장별로 분리할 값

- `GOOGLE_SHEET_WEBHOOK_URL`
- `SOLAPI_API_KEY`, `SOLAPI_API_SECRET`, 발신·수신 번호
- `META_PIXEL_ID`, `META_CAPI_ACCESS_TOKEN`
- `NEXT_PUBLIC_META_PIXEL_ID`, Google Analytics·Ads 값
- `ADMIN_DASHBOARD_TOKEN`, `ADMIN_SESSION_SECRET`
- 실제 도메인과 `ADMIN_ALLOWED_ORIGINS`

## 현재 영종 사이트에 미치는 영향

환경변수를 추가하지 않아도 기본 현장 `yeongjong-detre`가 선택됩니다. 따라서 v18을 기존 영종 프로젝트에 덮어써도 화면, 시트, 문자, 관리자 기능은 그대로 유지됩니다. 기존 Apps Script를 다시 배포할 필요도 없습니다.
