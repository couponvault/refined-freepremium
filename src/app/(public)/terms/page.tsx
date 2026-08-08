import type { Metadata } from "next";
import Link from "next/link";
import LegalDoc, { H } from "@/components/public/LegalDoc";
import { buildMetadata, SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Terms of Service",
  description: `Terms of service for ${SITE_NAME} — 18+ adult website rules and disclaimers.`,
  path: "/terms",
});

export default function TermsPage() {
  return (
    <LegalDoc title="Terms of Service" subtitle="Last updated: August 2026 · Binding agreement">
      <section>
        <H>1. Acceptance of terms</H>
        <p className="mt-2">
          By entering or using {SITE_NAME}, you agree to these Terms, our{" "}
          <Link href="/privacy" className="text-accent hover:underline">
            Privacy Policy
          </Link>
          , and{" "}
          <Link href="/policy" className="text-accent hover:underline">
            Content Policy
          </Link>
          . If you do not agree, leave immediately.
        </p>
      </section>

      <section>
        <H>2. Adults only (18+)</H>
        <p className="mt-2">
          You represent that you are at least <strong className="text-foreground">18 years old</strong>{" "}
          (or the age of majority in your place of residence, if higher), that
          adult content is legal for you to view where you are, and that you will
          not allow minors to access this site. We use an age gate and adult
          content labeling; you are responsible for preventing underage access on
          devices you control. See{" "}
          <Link href="/parental-controls" className="text-accent hover:underline">
            Parental Controls
          </Link>
          .
        </p>
      </section>

      <section>
        <H>3. Nature of the service</H>
        <p className="mt-2">
          {SITE_NAME} is a free adult video aggregation / streaming index. Much
          content is delivered through <strong className="text-foreground">third-party embeds</strong>.
          We may change, suspend, or discontinue any part of the service at any
          time. No account is required for general viewing unless a feature
          expressly says otherwise.
        </p>
      </section>

      <section>
        <H>4. License &amp; acceptable use</H>
        <p className="mt-2">We grant you a limited, personal, non-commercial, revocable license to use the site. You agree not to:</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>Access the site if you are under 18 or if adult content is illegal for you</li>
          <li>Share material with minors or bypass age restrictions</li>
          <li>Scrape, bulk-download, or overload our systems</li>
          <li>Upload or promote illegal content (see Content Policy)</li>
          <li>Interfere with security, rate limits, or other users</li>
          <li>Use the site for commercial redistribution without permission</li>
        </ul>
      </section>

      <section>
        <H>5. Intellectual property &amp; DMCA</H>
        <p className="mt-2">
          Third-party videos remain the property of their respective owners.
          Copyright complaints must follow our{" "}
          <Link href="/dmca" className="text-accent hover:underline">
            DMCA process
          </Link>
          . False notices may have legal consequences for the sender.
        </p>
      </section>

      <section>
        <H>6. Advertising</H>
        <p className="mt-2">
          The site may display third-party adult advertisements (including
          popunders or redirects when configured). We are not responsible for
          advertiser websites, offers, or billing. Click ads at your own risk.
        </p>
      </section>

      <section>
        <H>7. Disclaimers</H>
        <p className="mt-2">
          THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo;
          WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. We do not warrant
          uninterrupted access, accuracy of listings, or that embeds will always
          work. Adult content may be offensive; you assume all risk of viewing.
        </p>
      </section>

      <section>
        <H>8. Limitation of liability</H>
        <p className="mt-2">
          To the maximum extent permitted by law, {SITE_NAME} and its operators
          are not liable for indirect, incidental, consequential, or punitive
          damages, or loss of data/profits, arising from your use of the site.
          Some jurisdictions do not allow certain limitations; in those cases our
          liability is limited to the fullest extent allowed.
        </p>
      </section>

      <section>
        <H>9. Indemnity</H>
        <p className="mt-2">
          You agree to indemnify and hold harmless the operators from claims
          arising from your misuse of the site, violation of these Terms, or
          infringement of others&apos; rights.
        </p>
      </section>

      <section>
        <H>10. Responsible use</H>
        <p className="mt-2">
          If you feel your viewing habits are harmful, visit our{" "}
          <Link href="/addiction-help" className="text-accent hover:underline">
            Addiction Help
          </Link>{" "}
          page for information and external resources. This is not medical advice.
        </p>
      </section>

      <section>
        <H>11. Governing law</H>
        <p className="mt-2">
          These Terms are governed by the laws applicable to the operator&apos;s
          place of business, without regard to conflict-of-law rules, unless
          mandatory consumer laws in your country say otherwise.
        </p>
      </section>

      <section>
        <H>12. Changes</H>
        <p className="mt-2">
          We may update these Terms at any time. Continued use after changes
          constitutes acceptance.
        </p>
      </section>
    </LegalDoc>
  );
}
