# v4.0 전체 프로젝트 적용

이 ZIP은 이전 변경사항을 모두 합친 전체 프로젝트입니다. 별도로 CSS를 붙이거나 `page.tsx`에서 위치를 찾을 필요가 없습니다.

## 적용

1. 현재 프로젝트 폴더를 복사해 백업합니다.
2. ZIP의 전체 파일을 기존 프로젝트에 덮어씁니다.
3. 기존 프로젝트의 `node_modules`, `.next`, `.git`은 ZIP에 포함하지 않았습니다. 그대로 두어도 됩니다.
4. VS Code 터미널에서 실행합니다.

```bash
npm install
npm run dev
```

5. 브라우저에서 `Ctrl + Shift + R`로 새로고침합니다.

## 이번 버전

- 입지 섹션 `약 5분` 숫자 정렬을 실제 `globals.css`에 통합
- 사업개요 섹션 추가 및 페이지에 자동 배치
- 커뮤니티 섹션 추가 및 페이지에 자동 배치
- 버튼 인터랙션과 모바일 레이아웃 보완
- 기존 상담폼, UTM, Meta Pixel 준비 코드 유지

## GitHub / Vercel 반영

```bash
git add .
git commit -m "Release integrated v4.0 landing page"
git push
```
