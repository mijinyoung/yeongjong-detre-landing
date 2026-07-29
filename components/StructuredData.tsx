import { faqItems } from "@/data/site-content";
import { getSiteUrl } from "@/lib/site-url";

const siteUrl = getSiteUrl();

const jsonLd = (value: object) =>
  JSON.stringify(value).replace(/</g, "\\u003c");

export default function StructuredData() {
  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "영종 디에트르 라 메르",
    url: siteUrl,
    inLanguage: "ko-KR",
    description:
      "영종 디에트르 라 메르 분양 안내와 관심고객 등록 페이지",
  };

  const residence = {
    "@context": "https://schema.org",
    "@type": "ApartmentComplex",
    name: "영종 디에트르 라 메르",
    url: siteUrl,
    image: `${siteUrl}/images/hero-og.jpg`,
    description:
      "청라하늘대교 생활권, 최고 49층, 총 1,009세대 규모의 영종 디에트르 라 메르",
    telephone: "1833-8384",
    address: {
      "@type": "PostalAddress",
      addressLocality: "인천광역시 중구",
      addressRegion: "인천광역시",
      addressCountry: "KR",
    },
  };

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <>
      {[website, residence, faq].map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(item) }}
        />
      ))}
    </>
  );
}
