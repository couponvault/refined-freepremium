import type { Metadata } from "next";
import Link from "next/link";
import LegalDoc, { H } from "@/components/public/LegalDoc";
import { buildMetadata, SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Privacy Policy",
  description: `Privacy policy for ${SITE_NAME} — cookies, data, ads, and your rights on this adult website.`,
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <LegalDoc title="Privacy Policy" subtitle="Last updated: August 2026 · Adults only (18+)">
      <section>
        <H>1. Who we are</H>
        <p className="mt-2">
          {SITE_NAME} (&ldquo;we&rdquo;, &ldquo;us&rdquo;) operates an{" "}
          <strong className="text-foreground">adult entertainment website</strong>{" "}
          for users aged 18+ (or the age of majority where you live). This Privacy
          Policy explains what information we process, why, and the choices you
          have.
        </p>
      </section>

      <section>
        <H>2. Age requirement</H>
        <p className="mt-2">
          This service is not directed to children or anyone under 18. We do not
          knowingly collect personal information from minors. If you believe a
          minor has provided data, contact us via the{" "}
          <Link href="/dmca" className="text-accent hover:underline">
            DMCA / contact form
          </Link>{" "}
          and we will delete it where required.
        </p>
      </section>

      <section>
        <H>3. Information we collect</H>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>
            <strong className="text-foreground">Technical data:</strong> IP
            address, browser type, device type, referring URL, pages viewed, and
            approximate timestamps — used for security, abuse prevention, and
            basic traffic understanding.
          </li>
          <li>
            <strong className="text-foreground">Voluntary submissions:</strong>{" "}
            name, email, and message content when you file a DMCA notice or video
            report.
          </li>
          <li>
            <strong className="text-foreground">On-device data:</strong> age
            verification flag, theme preference, watch-later / continue watching,
            exclusive unlock status (localStorage / cookies).
          </li>
          <li>
            <strong className="text-foreground">We do not require accounts</strong>{" "}
            for normal browsing. We do not ask for payment card data on this site.
          </li>
        </ul>
      </section>

      <section>
        <H>4. Cookies, local storage &amp; similar tech</H>
        <p className="mt-2">We and/or partners may use:</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>Essential storage (age gate, security, session/admin where applicable)</li>
          <li>Preference storage (theme, lists on your device)</li>
          <li>
            Third-party cookies/scripts from <strong className="text-foreground">embedded video players</strong> and{" "}
            <strong className="text-foreground">advertising networks</strong>{" "}
            (if enabled in admin). Those parties have their own policies.
          </li>
        </ul>
        <p className="mt-2">
          You can clear site data in your browser. Blocking cookies may break age
          confirmation or embeds.
        </p>
      </section>

      <section>
        <H>5. How we use information</H>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>Operate, secure, and improve the website</li>
          <li>Process copyright and abuse reports</li>
          <li>Enforce our Terms and Content Policy</li>
          <li>Comply with law and respond to lawful requests</li>
          <li>Measure aggregate traffic (views) for site ranking displays</li>
        </ul>
      </section>

      <section>
        <H>6. Advertising &amp; embeds (adult networks)</H>
        <p className="mt-2">
          If ads are enabled, adult ad networks may collect device/browser data to
          show ads and fight fraud. Embedded players may track playback on their
          platforms. We do not control those third parties. Review their privacy
          policies and use browser controls or extensions if you wish to limit
          tracking.
        </p>
      </section>

      <section>
        <H>7. Sharing</H>
        <p className="mt-2">
          We do not sell your personal information. We may share data with hosting
          / infrastructure providers, and when required by law, to protect rights
          and safety, or to process DMCA/abuse reports. Aggregated non-identifying
          statistics may be used internally.
        </p>
      </section>

      <section>
        <H>8. International visitors</H>
        <p className="mt-2">
          Servers and processors may be located in different countries. By using
          the site you understand your information may be processed outside your
          home country, subject to applicable safeguards and law.
        </p>
      </section>

      <section>
        <H>9. Retention</H>
        <p className="mt-2">
          Technical logs are kept only as long as needed for security and
          operations. DMCA and report records are retained as needed to handle
          claims and legal compliance, then deleted or anonymized when no longer
          required.
        </p>
      </section>

      <section>
        <H>10. Your choices &amp; rights</H>
        <p className="mt-2">
          Depending on your location (e.g. GDPR/CCPA-style rules), you may have
          rights to access, correct, delete, or restrict certain personal data, or
          to object to certain processing. To make a request, use the contact
          method on our{" "}
          <Link href="/dmca" className="text-accent hover:underline">
            DMCA page
          </Link>{" "}
          with the subject line &ldquo;Privacy request.&rdquo; We may need to
          verify your request. You can also clear local device storage yourself.
        </p>
      </section>

      <section>
        <H>11. Security</H>
        <p className="mt-2">
          We use reasonable technical and organizational measures (HTTPS,
          access-controlled admin, rate limits). No method of transmission or
          storage is 100% secure.
        </p>
      </section>

      <section>
        <H>12. Changes</H>
        <p className="mt-2">
          We may update this policy. The &ldquo;Last updated&rdquo; date will
          change. Continued use after updates means you accept the revised policy.
        </p>
      </section>

      <section>
        <H>13. Contact</H>
        <p className="mt-2">
          Privacy questions: submit via{" "}
          <Link href="/dmca" className="text-accent hover:underline">
            /dmca
          </Link>{" "}
          (use a privacy subject line) or the contact email your operator publishes
          in site settings / legal notices.
        </p>
      </section>
    </LegalDoc>
  );
}
