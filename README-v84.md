# 영종 디에트르 랜딩페이지 v8.4

## 적용 내용

- 검색 및 SNS 공유 메타데이터 보강
- Google 검색용 이미지·영상 미리보기 정책 추가
- ApartmentComplex, VideoObject 구조화 데이터 추가
- JSON-LD 안전 직렬화 적용
- 관리자·시스템 점검·완료 페이지 robots 차단 강화
- 웹 앱 manifest 추가
- 정적 이미지와 영상 장기 캐시 적용
- 보안 응답 헤더와 압축 설정 추가
- 하단 홍보영상 초기 다운로드 지연 (`preload="none"`)
- 버전 8.4.0 반영

## 배포 전 확인

Vercel 환경변수 `NEXT_PUBLIC_SITE_URL`에는 실제 운영 도메인을 입력하세요.
예: `https://도메인주소`

환경변수 변경 후에는 Vercel에서 재배포해야 canonical, sitemap, 구조화 데이터 URL이 실제 도메인으로 생성됩니다.
