# 영종 디에트르 랜딩페이지 v19.0

결제한 자체 도메인을 Vercel에 연결하고 광고 송출 전에 운영 상태를 최종 판정하기 위한 버전입니다.

운영 대표주소는 `https://exio.kr`로 설정했으며, `www.exio.kr`은 대표주소로 이동시키는 구성을 사용합니다.

## 핵심 변경

- `/system-check`에 도메인 연결 결과 화면을 추가했습니다.
- 설정된 대표주소와 현재 접속주소를 비교합니다.
- 자체 도메인인지, Vercel 임시 주소인지 구분합니다.
- HTTPS 적용과 대표 호스트 일치 여부를 확인합니다.
- 대표 홈페이지, 사이트맵, robots 검색 설정 바로가기를 제공합니다.
- `NEXT_PUBLIC_SITE_URL`에 경로·검색값이 들어간 잘못된 설정을 차단합니다.
- `ADMIN_ALLOWED_ORIGINS`가 새 대표주소와 일치하는지 관리자 보안 판정에 반영합니다.
- 자체 도메인과 HTTPS 연결을 광고 송출 필수 항목으로 추가했습니다.
- 모바일 운영 점검 화면을 도메인 카드형으로 정돈했습니다.
- 도메인 연결 순서와 광고 관리자 주소 변경 절차를 문서화했습니다.

## 적용 방법

1. v19 파일을 기존 GitHub Desktop 프로젝트에 덮어씁니다.
2. Commit·Push 후 Vercel 배포가 `Ready`가 될 때까지 기다립니다.
3. Vercel `Settings → Domains`에서 `exio.kr`과 `www.exio.kr`을 추가하고 `exio.kr`을 Primary로 지정합니다.
4. 도메인 구입처에서 Vercel이 안내하는 DNS 값을 등록합니다.
5. `NEXT_PUBLIC_SITE_URL`과 `ADMIN_ALLOWED_ORIGINS`를 모두 `https://exio.kr`로 변경하고 재배포합니다.
6. 새 도메인의 `/system-check`에서 전체 항목을 확인합니다.

자세한 안내는 `DOMAIN-LAUNCH-GUIDE.md`를 확인합니다.

## 기존 연동 영향

Google Sheets 저장 코드와 SOLAPI 문자 처리 방식은 변경하지 않았습니다. 현재 v16 이상 Apps Script가 정상 운영 중이면 다시 배포할 필요가 없습니다.

## 검증 항목

- 멀티 프로젝트 등록부와 현장 설정 검사
- TypeScript 검사
- ESLint 검사
- Next.js 프로덕션 빌드
- 도메인 상태 응답 타입과 모바일 화면 검사
- ZIP 제외 항목 검사

## 버전

- package version: `19.0.0`
- project version: `19.0.0`
- Google Apps Script source version: `19.0.0` (기존 v16 이상 운영 배포와 호환)
