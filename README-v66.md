# v6.6 관심고객 운영 연동 준비

이번 버전은 Google Sheets와 담당자 문자 알림을 실제 운영에 연결하기 쉽게 정리합니다.

## 반영 내용

- Google Apps Script 저장 코드 전면 개선
- 접수번호 기준 중복 행 방지
- 개인정보 동의 시각, 신청 위치, 광고 UTM 값 저장
- 처리상태 드롭다운과 상담메모 열 자동 생성
- WEBHOOK_SECRET을 JSON 본문에서도 검증
- 문자 알림 웹훅 규격과 권장 문자 양식 정리
- `/system-check` 운영 연결 상태 화면 추가
- `/api/health`에 핵심 운영 준비 여부 추가
- 기존 상담, Meta Pixel/CAPI, GA4, 개인정보 동의 기능 유지

## 상태 확인

로컬:

```text
http://localhost:3000/system-check
```

배포 후:

```text
https://yeongjong-detre-landing.vercel.app/system-check
```

## 적용

```bash
npm install
npm run dev
git add .
git commit -m "Release v6.6 lead operations readiness"
git push
```

다음 실제 설정 단계에서는 Google Apps Script 웹앱 URL과 문자 자동화 웹훅 URL을 Vercel 환경변수에 등록해야 합니다.
