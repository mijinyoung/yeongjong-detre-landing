import { faqItems } from "@/data/site-content";
import { projectConfig } from "@/data/project-config";
import { getSiteUrl } from "@/lib/site-url";

const siteUrl = getSiteUrl();

const jsonLd = (value: object) =>
  JSON.stringify(value).replace(/</g, "\\u003c");

export default function StructuredData() {
  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: projectConfig.identity.name,
    url: siteUrl,
    inLanguage: projectConfig.seo.language,
    description: projectConfig.seo.description,
  };

  const residence = {
    "@context": "https://schema.org",
    "@type": "ApartmentComplex",
    name: projectConfig.identity.name,
    url: siteUrl,
    image: `${siteUrl}${projectConfig.seo.ogImage}`,
    description: projectConfig.seo.description,
    telephone: projectConfig.contact.displayPhone,
    address: {
      "@type": "PostalAddress",
      addressLocality: projectConfig.seo.addressLocality,
      addressRegion: projectConfig.seo.addressRegion,
      addressCountry: projectConfig.seo.addressCountry,
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
  const structuredItems = projectConfig.display.faq
    ? [website, residence, faq]
    : [website, residence];

  return (
    <>
      {structuredItems.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(item) }}
        />
      ))}
    </>
  );
}
