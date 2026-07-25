# v0.6 적용 확인

1. `public/images/hero-final.png`가 존재하는지 확인
2. `components/Hero.tsx`, `QuickLead.tsx`, `Location.tsx` 확인
3. `app/page.tsx` 덮어쓰기
4. `app/globals.css` 덮어쓰기
5. 터미널 실행

```bash
npm install
npm run dev
```

테스트 주소:

```text
http://localhost:3000/?utm_source=meta&utm_campaign=v06-test&utm_content=hero
```

간편 등록과 하단 등록 폼 모두 `/api/leads`로 전송됩니다.
