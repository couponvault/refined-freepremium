import type { Metadata } from "next";
import Link from "next/link";
import LegalDoc, { H } from "@/components/public/LegalDoc";
import { buildMetadata, SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "18 U.S.C. § 2257 Record-Keeping Notice",
  description: `2257 compliance notice for ${SITE_NAME} — third-party embedded adult content.`,
  path: "/2257",
});

export default function Notice2257Page() {
  return (
    <LegalDoc
      title="18 U.S.C. § 2257 Notice"
      subtitle="Record-keeping requirements disclosure · Last updated: August 2026"
    >
      <section>
        <H>1. Statement</H>
        <p className="mt-2">
          {SITE_NAME} is not the primary producer of the adult audiovisual content
          that may appear on this website. Content is typically displayed via{" "}
          <strong className="text-foreground">third-party embeds, links, or feeds</strong>{" "}
          from external platforms that are responsible for their own production
          and record-keeping obligations under 18 U.S.C. § 2257 and 28 C.F.R. 75,
          where those laws apply.
        </p>
      </section>

      <section>
        <H>2. Custodian of records</H>
        <p className="mt-2">
          For any content that {SITE_NAME} itself produces (if any), records
          required by § 2257 are maintained by the operator and are available for
          inspection as required by law during normal business hours at the
          address the operator designates for legal process. For{" "}
          <strong className="text-foreground">third-party content</strong>, the
          original producer / hosting platform is the custodian of records; please
          contact them directly.
        </p>
      </section>

      <section>
        <H>3. Age of performers</H>
        <p className="mt-2">
          All persons depicted in sexually explicit content that we knowingly
          allow must be 18 years of age or older at the time of creation. See our{" "}
          <Link href="/policy" className="text-accent hover:underline">
            Content Policy
          </Link>
          .
        </p>
      </section>

      <section>
        <H>4. Reporting</H>
        <p className="mt-2">
          If you believe any listing violates the law or our policies, report it
          immediately via{" "}
          <Link href="/dmca" className="text-accent hover:underline">
            /dmca
          </Link>{" "}
          or the on-page Report tool.
        </p>
      </section>

      <section>
        <H>5. Operator note</H>
        <p className="mt-2">
          Site owners should replace placeholder contact/inspection details with
          their real legal entity information and consult an attorney familiar
          with adult-industry compliance in their jurisdiction. This page is a
          starting template, not a guarantee of compliance.
        </p>
      </section>
    </LegalDoc>
  );
}
