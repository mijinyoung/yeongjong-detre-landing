# v4.5 전환 완료 페이지

이번 버전은 상담 신청 완료 후 전용 `/thank-you` 페이지로 이동합니다.

## 주요 변경

- Meta 광고에서 URL 기반 맞춤 전환을 만들 수 있는 완료 페이지 추가
- GA4와 Meta Pixel에 `lead_thank_you_view` 이벤트 전송
- 접수번호 표시
- 전화상담 및 홈페이지 복귀 버튼 제공
- 완료 페이지 검색엔진 노출 차단
- 이름·전화번호 등 개인정보는 URL에 포함하지 않음

## Meta 맞춤 전환 URL

배포 후 아래 경로를 기준으로 맞춤 전환을 만들 수 있습니다.

```text
https://yeongjong-detre-landing.vercel.app/thank-you
```

## 적용

전체 파일을 기존 프로젝트에 덮어쓴 뒤:

```bash
npm install
npm run dev
```

테스트 접수 후 `/thank-you?receipt=...`로 이동하는지 확인합니다.
