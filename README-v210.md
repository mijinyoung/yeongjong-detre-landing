# 영종 디에트르 랜딩페이지 v21.0

## 핵심 목표

`exio.kr`의 과거 검색 흔적을 정리하고 현재 영종 디에트르 라 메르 홈페이지를 Google·네이버에 정확히 등록할 수 있도록 검색엔진 전환 체계를 보강했습니다.

## 적용 내용

- Google Search Console HTML 메타 태그 소유확인 지원
- 네이버 서치어드바이저 HTML 메타 태그 소유확인 지원
- 검색 소유확인 환경변수가 비어 있을 때 빈 메타 태그를 출력하지 않도록 처리
- 과거 쇼핑몰 경로 7종에 HTTP `410 Gone` 응답 적용
- 이전 페이지 응답에 `noindex`, `nofollow`, `noarchive` 헤더와 메타 태그 적용
- 이전 주소를 직접 방문한 고객에게 현재 분양 홈페이지 이동 버튼 제공
- `/system-check`에 Google·네이버 검색 등록 상태 추가
- 광고 송출 필수 판정과 검색 등록 권장 판정을 분리
- 배포 후 클릭 순서를 정리한 `SEARCH-REGISTRATION-GUIDE.md` 추가
- 프로젝트 버전 `21.0.0` 반영

## 새 Vercel 환경변수

```text
GOOGLE_SITE_VERIFICATION=
NAVER_SITE_VERIFICATION=
```

각 서비스가 제공한 `<meta>` 태그 전체가 아니라 `content` 속성의 값만 입력합니다. 입력 후 반드시 Vercel에서 재배포합니다.

## 검증 기준

- 현장 설정 검증
- TypeScript 검사
- ESLint 검사
- Next.js 프로덕션 빌드
- 정상 홈페이지 응답과 기존 쇼핑몰 경로 `410 Gone` 응답 확인

상세 등록 절차는 `SEARCH-REGISTRATION-GUIDE.md`를 확인하세요.
