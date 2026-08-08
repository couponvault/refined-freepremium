import type { Metadata } from "next";
import Link from "next/link";
import LegalDoc, { H } from "@/components/public/LegalDoc";
import { buildMetadata, SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Content Policy",
  description: `Prohibited content, no-CSAM policy, and reporting for ${SITE_NAME}.`,
  path: "/policy",
});

export default function PolicyPage() {
  return (
    <LegalDoc
      title="Content Policy"
      subtitle="Zero tolerance for illegal & underage content · Last updated: August 2026"
    >
      <section>
        <H>1. Zero tolerance — minors / CSAM</H>
        <p className="mt-2">
          {SITE_NAME} strictly prohibits any sexual content involving anyone under
          18 — real, fictional, animated, drawn, or AI-generated. We do not host
          or knowingly index such material. Suspected child sexual abuse material
          will be removed and may be reported to appropriate authorities / NCMEC
          or equivalent.
        </p>
      </section>

      <section>
        <H>2. Other prohibited content</H>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>Non-consensual intimate imagery / “revenge porn”</li>
          <li>Trafficking, exploitation, or coercion content</li>
          <li>Extreme illegal violence or other material banned by law</li>
          <li>Malware, phishing, or scam promotions</li>
          <li>Copyright-infringing material (process via DMCA)</li>
          <li>Bestiality or other content illegal in applicable jurisdictions</li>
        </ul>
      </section>

      <section>
        <H>3. Third-party embeds</H>
        <p className="mt-2">
          Listings may point to third-party hosts. We act quickly on valid notices.
          See{" "}
          <Link href="/2257" className="text-accent hover:underline">
            18 U.S.C. § 2257 Notice
          </Link>{" "}
          regarding record-keeping for content we do not produce.
        </p>
      </section>

      <section>
        <H>4. How to report</H>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>Use <strong className="text-foreground">Report</strong> on a video page for spam, illegal, or broken content</li>
          <li>
            Copyright:{" "}
            <Link href="/dmca" className="text-accent hover:underline">
              DMCA page
            </Link>
          </li>
          <li>Underage / CSAM suspicions: report immediately via DMCA/contact and mark clearly — we prioritize these</li>
        </ul>
      </section>

      <section>
        <H>5. Enforcement</H>
        <p className="mt-2">
          We may remove content, mark DMCA claims, geo-block, or restrict access
          without prior notice when violations are found or alleged in good faith.
        </p>
      </section>

      <section>
        <H>6. User responsibility</H>
        <p className="mt-2">
          You must not upload, request, or share prohibited material. Violations
          may result in reporting to law enforcement where appropriate.
        </p>
      </section>
    </LegalDoc>
  );
}
