# v7.1 이미지·평면도 최종 정리

## 반영 내용

- 84A·84B·104A·104B·113A·113B 평면도 상단의 상담북 메뉴 영역 제거
- PC에서 평면도 전체 비율 유지 및 잘림 방지
- 모바일에서 타입 탭을 가로 스크롤 방식으로 개선
- 확대 보기에서 넓은 도면을 가로 스크롤로 세밀하게 확인 가능
- 공식자료와 평면도 카드의 모서리·여백·그림자 통일
- `/api/health` 버전 7.1.0
- Google Sheets와 SOLAPI 문자 기능 유지

## 적용

```bash
npm install
npm run dev
```

정상 확인 후:

```bash
git add .
git commit -m "Release v7.1 brochure and floor plan cleanup"
git push
```
