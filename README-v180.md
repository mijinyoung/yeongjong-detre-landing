# 영종 디에트르 랜딩페이지 v18.0

현재 영종 광고 사이트를 유지하면서, 앞으로 추가할 여러 현장을 빠르고 안전하게 복제할 수 있도록 멀티 프로젝트 기반을 구축한 버전입니다.

## 핵심 변경

- 공통 홈페이지 기능과 현장별 콘텐츠 설정을 분리했습니다.
- `NEXT_PUBLIC_PROJECT_CODE`로 배포할 현장을 선택합니다.
- 현장 등록부에 `active`와 `draft` 상태를 추가했습니다.
- 새 현장 초안을 만드는 자동 복제 도구를 추가했습니다.
- 새 현장용 설정, 이미지·영상 폴더, Apps Script를 한 번에 준비합니다.
- 현장 코드 중복과 기존 파일 덮어쓰기를 차단합니다.
- 미완성 초안 현장을 빌드 대상으로 선택하면 검증 단계에서 중단합니다.
- 모든 운영 현장의 설정, 필수 문구, 자산 경로, Apps Script 현장 코드를 함께 검사합니다.
- 현장 목록 확인 명령과 멀티 프로젝트 운영 문서를 추가했습니다.

## 권장 운영 구조

- 하나의 공통 코드: 디자인, 폼, 관리자, 광고 추적, 성능·보안
- 현장별 별도 배포: 도메인, Google Sheet, SOLAPI, Meta·Google 광고, 관리자 인증

이렇게 하면 새 현장을 만들 때 기존 기능을 다시 개발하지 않고 현장 자료와 연동값을 교체하는 작업에 집중할 수 있습니다. 데이터와 광고 전환은 현장별로 분리되므로 운영 혼선도 줄어듭니다.

## 현재 영종 사이트 적용

1. v18 파일을 기존 GitHub Desktop 프로젝트에 덮어씁니다.
2. Commit·Push 후 Vercel 배포가 `Ready`가 될 때까지 기다립니다.
3. 홈페이지, 관심고객 등록, `/admin`을 확인합니다.

`NEXT_PUBLIC_PROJECT_CODE`를 설정하지 않으면 기존 영종 현장이 기본으로 선택됩니다. 기존 Google Apps Script 재배포와 새 Vercel 비밀값 추가는 필요하지 않습니다.

## 새 현장 적용

새 현장은 별도 Vercel 프로젝트에서 아래 값을 포함한 현장 전용 환경변수를 사용합니다.

```text
NEXT_PUBLIC_PROJECT_CODE=새-현장코드
NEXT_PUBLIC_SITE_URL=https://새-현장-도메인
```

전체 절차는 `MULTI-PROJECT-GUIDE.md`, 필요한 자료 목록은 `PROJECT-MATERIALS-TEMPLATE.md`를 확인합니다.

## 검증 항목

- 현장 등록부 동기화
- 운영 현장 설정·이미지·영상 검사
- 초안 배포 차단 검사
- 현장별 Apps Script 코드·버전 검사
- TypeScript 검사
- ESLint 검사
- Next.js 프로덕션 빌드
- 새 현장 생성 미리보기 검사

## 버전

- package version: `18.0.0`
- project version: `18.0.0`
- Google Apps Script source version: `18.0.0` (기존 v16·v17 운영 배포와 호환)
