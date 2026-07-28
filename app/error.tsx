"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("Page rendering error", error);
  }, [error]);

  return (
    <main className="thankYouPage" id="main-content">
      <section className="thankYouCard" aria-labelledby="error-title">
        <p className="thankYouEyebrow">TEMPORARY ERROR</p>
        <h1 id="error-title">페이지를 불러오지 못했습니다.</h1>
        <p className="thankYouCopy">
          일시적인 오류가 발생했습니다. 다시 시도하거나 홈페이지로 돌아가 주세요.
        </p>
        <div className="thankYouActions">
          <button type="button" onClick={() => unstable_retry()}>
            다시 시도
          </button>
          <Link href="/" className="secondary">
            홈페이지로 돌아가기
          </Link>
        </div>
      </section>
    </main>
  );
}
