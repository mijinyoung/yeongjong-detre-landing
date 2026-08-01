const gonePage = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, nofollow, noarchive" />
    <title>이전 페이지 안내 | 영종 디에트르 라 메르</title>
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px; color: #fff; background: #07162f; font-family: Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      main { width: min(620px, 100%); padding: clamp(32px, 7vw, 64px); border: 1px solid rgba(255,255,255,.16); border-radius: 24px; background: rgba(255,255,255,.05); }
      p { margin: 0 0 14px; color: #c8d0df; line-height: 1.75; }
      .eyebrow { color: #e0ad4f; font-weight: 800; letter-spacing: .14em; }
      h1 { margin: 0 0 22px; font-size: clamp(28px, 6vw, 44px); line-height: 1.25; }
      a { display: inline-flex; margin-top: 16px; padding: 14px 20px; border-radius: 10px; color: #07162f; background: #e0ad4f; font-weight: 800; text-decoration: none; }
      a:focus-visible { outline: 3px solid #fff; outline-offset: 4px; }
    </style>
  </head>
  <body>
    <main>
      <p class="eyebrow">PAGE NOTICE</p>
      <h1>요청하신 이전 페이지는 더 이상 제공되지 않습니다.</h1>
      <p>현재 이 도메인은 영종 디에트르 라 메르 분양 안내 홈페이지로 운영됩니다.</p>
      <a href="/">현재 홈페이지로 이동</a>
    </main>
  </body>
</html>`;

export function proxy() {
  return new Response(gonePage, {
    status: 410,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=3600",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}

export const config = {
  matcher: [
    "/main/:path*",
    "/service/:path*",
    "/member/:path*",
    "/order/:path*",
    "/goods/:path*",
    "/board/:path*",
    "/m/:path*",
  ],
};
