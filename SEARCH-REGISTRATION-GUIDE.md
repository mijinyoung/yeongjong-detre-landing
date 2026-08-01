# exio.kr 검색엔진 등록 안내

이 문서는 `exio.kr`의 현재 분양 홈페이지를 Google과 네이버에 등록하고, 과거에 이 도메인을 사용했던 사이트의 검색 흔적을 현재 정보로 교체하기 위한 배포 후 작업 안내입니다.

## 먼저 v21을 배포합니다

1. v21 파일을 기존 GitHub 프로젝트에 덮어씁니다.
2. GitHub Desktop에서 커밋하고 `Push origin`을 누릅니다.
3. Vercel 배포가 `Ready`가 될 때까지 기다립니다.

v21은 과거 쇼핑몰에서 사용하던 `/main`, `/service`, `/member`, `/order`, `/goods`, `/board`, `/m` 주소에 `410 Gone`을 반환합니다. 검색로봇은 이를 통해 해당 문서가 영구적으로 종료됐음을 확인할 수 있습니다. 현재 홈페이지 `/`는 정상적으로 유지됩니다.

## Google Search Console

1. [Google Search Console](https://search.google.com/search-console)에서 `속성 추가`를 누릅니다.
2. `URL 접두어`를 선택하고 `https://exio.kr`을 입력합니다.
3. 소유권 확인 방법에서 `HTML 태그`를 선택합니다.
4. 표시된 태그에서 `content="..."` 안쪽 값만 복사합니다.
5. Vercel의 프로젝트 `Settings → Environment Variables`에 아래 값을 추가합니다.
   - 이름: `GOOGLE_SITE_VERIFICATION`
   - 값: 앞 단계에서 복사한 content 값
   - 환경: `Production`
6. Vercel에서 최신 배포를 한 번 더 재배포합니다.
7. Search Console로 돌아가 `확인`을 누릅니다.
8. 왼쪽 `Sitemaps`에서 `sitemap.xml`을 입력해 제출합니다.
9. 상단 URL 검사에 `https://exio.kr`을 입력하고 `색인 생성 요청`을 누릅니다.

Google 공식 안내: [소유권 확인](https://support.google.com/webmasters/answer/9008080?hl=ko), [사이트맵 제출](https://support.google.com/webmasters/answer/7451001?hl=ko)

## 네이버 서치어드바이저

1. [네이버 서치어드바이저](https://searchadvisor.naver.com/)에 로그인합니다.
2. `웹마스터 도구`에서 `https://exio.kr`을 사이트로 추가합니다.
3. 소유확인 방법에서 `HTML 태그`를 선택합니다.
4. 표시된 태그에서 `content="..."` 안쪽 값만 복사합니다.
5. Vercel의 프로젝트 `Settings → Environment Variables`에 아래 값을 추가합니다.
   - 이름: `NAVER_SITE_VERIFICATION`
   - 값: 앞 단계에서 복사한 content 값
   - 환경: `Production`
6. Vercel에서 최신 배포를 한 번 더 재배포합니다.
7. 서치어드바이저로 돌아가 `소유확인`을 완료합니다.
8. `요청 → 사이트맵 제출`에서 `https://exio.kr/sitemap.xml`을 제출합니다.
9. `검증 → robots.txt`에서 `https://exio.kr/robots.txt` 수집과 검증을 실행합니다.

네이버 공식 안내: [사이트맵 제출](https://searchadvisor.naver.com/guide/request-feed), [robots.txt 설정](https://searchadvisor.naver.com/guide/seo-basic-robots)

## 완료 확인

배포 후 `https://exio.kr/system-check`에서 Google 검색 등록과 네이버 검색 등록이 `연결됨`으로 표시되는지 확인합니다. 이 두 항목은 광고 송출을 막는 필수 항목은 아니지만, 과거 검색 흔적을 정리하고 현재 홈페이지를 검색엔진에 알리기 위한 권장 항목입니다.

검색 결과 교체에는 검색엔진의 재수집 시간이 필요하므로 즉시 바뀌지 않을 수 있습니다. 소유확인용 환경변수는 확인이 끝난 뒤에도 삭제하지 마세요.
