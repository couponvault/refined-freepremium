import {
  jsonLdScript,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/seo";

/** Sitewide WebSite + Organization structured data for Google. */
export default function SeoExtras() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(websiteJsonLd()),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(organizationJsonLd()),
        }}
      />
    </>
  );
}
