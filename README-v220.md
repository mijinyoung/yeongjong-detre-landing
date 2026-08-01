# 영종 디에트르 랜딩페이지 v22.0

## 핵심 목표

현재 현장의 광고 문의 전환을 Meta·Google/GDN·카카오·네이버에서 일관되게 측정하고, 다음 현장을 명령 한 번으로 생성할 수 있는 광고 운영 표준을 구축했습니다.

## 적용 내용

- GTM 통합 모드와 직접 설치 모드 분리
- 두 모드가 동시에 같은 태그를 실행하지 않도록 중복 방지
- Google Tag Manager 동의 기반 로더 추가
- GA4 권장 문의 이벤트 `generate_lead` 적용
- 문의 저장 성공 후에만 전환 이벤트 생성
- 접수번호, 폼 위치, 유입 출처, 현장 코드를 개인정보 없이 dataLayer에 전달
- Meta Pixel `Lead`와 Meta CAPI `Lead`에 동일 Event ID 적용
- Google Ads 상담 완료 전환에 Event ID를 Transaction ID로 적용
- 카카오 픽셀 방문 및 잠재고객 `participation(Consulting)` 지원
- 네이버 신 전환 스크립트 `wcs.trans`와 `lead` 이벤트 지원
- 광고 분석 동의 문구와 개인정보 안내에 4대 채널 반영
- `/system-check`에 GTM·카카오·네이버 광고 상태 및 4대 채널 종합 판정 추가
- `npm run campaign:new` 현장 생성 명령 추가
- 새 현장 생성 시 광고 환경변수 체크리스트와 현장 준비 안내서 자동 생성
- `AD-TRACKING-SETUP.md` 계정 설정 및 테스트 안내 추가
- 프로젝트 버전 `22.0.0` 반영

## 검증 기준

- 현장 생성 명령 미리보기
- 현장 설정 검증
- TypeScript 검사
- ESLint 검사
- Next.js 프로덕션 빌드
- GTM 모드와 직접 설치 모드별 태그 중복 여부
- 문의 완료 dataLayer 이벤트 및 Event ID 확인
- 개인정보를 남기지 않는 선택형 광고 이벤트 점검 로그 추가

광고 계정의 실제 ID 입력과 GTM 컨테이너 발행은 배포 후 `AD-TRACKING-SETUP.md` 순서대로 진행합니다.
