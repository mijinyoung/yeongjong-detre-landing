# v3.3 적용 방법

이번 버전에는 다음이 포함됩니다.

- `약 5분` 숫자 baseline 문제를 독립 클래스와 강제 광학 정렬로 수정
- 숫자에 Arial 계열 폰트를 적용해 한글 폰트의 숫자 기준선 영향을 제거
- 프리미엄 커뮤니티 섹션 신규 추가

## 1. 파일 덮어쓰기

다음 파일을 현재 프로젝트의 같은 위치에 복사합니다.

- `components/InteractiveLocation.tsx`
- `components/CommunityHighlights.tsx`

## 2. CSS 추가

`app/v33.css`의 내용을 전부 복사해 현재 프로젝트의 `app/globals.css` 맨 아래에 붙여넣습니다.

## 3. page.tsx에 커뮤니티 추가

`app/page.tsx` 상단 import 영역에 추가:

```tsx
import CommunityHighlights from "@/components/CommunityHighlights";
```

페이지 구성에서 원하는 위치에 추가:

```tsx
<CommunityHighlights />
```

추천 위치는 입지 섹션 다음, 평면 안내 섹션 전입니다.

## 4. 로컬 확인

```bash
npm run dev
```

브라우저에서 `Ctrl + Shift + R`로 강력 새로고침합니다.

## 5. GitHub / Vercel 반영

```bash
git add .
git commit -m "Add v3.3 community and fix location time alignment"
git push
```
