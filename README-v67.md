# v6.7 연동 설정 도우미

이번 버전은 Google Sheets와 문자 알림을 연결한 뒤 실제로 테스트할 수 있는 도구를 추가합니다.

## 반영 내용

- `/system-check`에 실제 연결 순서 안내 추가
- Google Sheets 테스트 전송 버튼
- 문자 알림 테스트 전송 버튼
- 테스트 접수번호 표시
- `SYSTEM_CHECK_TOKEN` 비밀번호 검증
- 테스트 API에서 비밀 키 값은 브라우저에 노출하지 않음
- 기존 Google Sheets, 문자 웹훅, Meta CAPI, GA4, 상담 기능 유지

## Vercel 환경변수 추가

```text
SYSTEM_CHECK_TOKEN=20자 이상의 임의 문자열
```

환경변수를 추가한 뒤 Vercel에서 재배포하세요.

## 테스트 주소

```text
https://yeongjong-detre-landing.vercel.app/system-check
```

Google Sheets 또는 문자 알림이 `미설정`이면 해당 테스트 버튼은 비활성화됩니다.

## 적용

```bash
npm install
npm run dev
git add .
git commit -m "Release v6.7 integration setup assistant"
git push
```
