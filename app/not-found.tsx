import Link from "next/link";
import { contactHref, projectConfig } from "@/data/project-config";

export default function NotFound() {
  return (
    <main className="thankYouPage" id="main-content">
      <section className="thankYouCard" aria-labelledby="not-found-title">
        <p className="thankYouEyebrow">PAGE NOT FOUND</p>
        <h1 id="not-found-title">요청하신 페이지를 찾을 수 없습니다.</h1>
        <p className="thankYouCopy">
          주소가 변경되었거나 존재하지 않는 페이지입니다. 홈페이지에서 분양 정보를
          다시 확인해 주세요.
        </p>
        <div className="thankYouActions">
          <Link href="/">홈페이지로 돌아가기</Link>
          <a href={contactHref} className="secondary">
            전화상담 {projectConfig.contact.displayPhone}
          </a>
        </div>
      </section>
    </main>
  );
}
