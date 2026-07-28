# 영종 디에트르 랜딩페이지 v8.1

## v8.1 운영 안정화

- 모든 관심고객 폼에 동기식 제출 잠금 적용: 빠른 연속 클릭과 React 상태 반영 전 재호출 방지
- 공통 `submitLead` 요청 함수 추가
  - 12초 요청 타임아웃
  - HTML/빈 응답 등 비정상 서버 응답 안전 처리
  - API 오류 메시지 통일
- Google Sheets 저장이 실패한 요청은 중복 번호로 기록하지 않도록 서버 중복 판정 순서 수정
- Google Sheets 저장 성공 후 SOLAPI 문자 발송 실패는 접수 성공으로 유지
- LeadSection, QuickLead, LeadModal이 서버의 실제 접수 결과 메시지를 동일하게 표시

## 배포 전 확인

```bash
npm install
npm run lint
npm run build
```

기존 Vercel 환경변수는 v8.0과 동일하게 유지합니다.
