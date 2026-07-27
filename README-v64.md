# v6.4 개인정보·광고 분석 동의

- Meta Pixel과 Google Analytics를 방문자 동의 후에만 로드
- 분석 사용 동의 / 선택 기능 거부 배너 추가
- 상담신청·전화 연결 등 필수 기능은 동의 여부와 무관하게 작동
- 푸터에서 방문 분석 설정을 다시 열 수 있도록 추가
- 개인정보 안내에 방문 분석 도구 설명 추가
- `/api/health` 버전 6.4.0

## 적용

전체 프로젝트를 기존 폴더에 덮어쓴 후:

```bash
npm install
npm run dev
```

정상 확인 후:

```bash
git add .
git commit -m "Release v6.4 analytics consent"
git push
```
