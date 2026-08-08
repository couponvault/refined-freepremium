import type { Metadata } from "next";
import Link from "next/link";
import LegalDoc, { H } from "@/components/public/LegalDoc";
import { buildMetadata, SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Parental Controls",
  description: `How parents and guardians can block ${SITE_NAME} and other adult websites — filters, RTA, device settings.`,
  path: "/parental-controls",
});

export default function ParentalControlsPage() {
  return (
    <LegalDoc
      title="Parental Controls"
      subtitle="Keep minors away from adult websites · Practical blocking guide"
    >
      <section>
        <H>1. Our commitment</H>
        <p className="mt-2">
          {SITE_NAME} is for <strong className="text-foreground">adults 18+ only</strong>.
          We use an age-confirmation gate and label content for adult filters
          (including RTA / rating metadata).{" "}
          <strong className="text-foreground">
            No technical filter replaces active parenting
          </strong>
          . If children use your devices or network, you must enable blocking.
        </p>
      </section>

      <section>
        <H>2. What is RTA?</H>
        <p className="mt-2">
          The <strong className="text-foreground">Restricted to Adults (RTA)</strong>{" "}
          label helps parental-control software recognize adult sites. Many
          filters honor RTA. Learn more at{" "}
          <a
            href="https://www.rtalabel.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            rtalabel.org
          </a>
          . Our pages also send an adult content rating for SafeSearch-style
          systems.
        </p>
      </section>

      <section>
        <H>3. Free / built-in tools (start here)</H>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>
            <strong className="text-foreground">Windows:</strong> Microsoft Family
            Safety / Microsoft Account family settings — block adult content and
            set screen time.
          </li>
          <li>
            <strong className="text-foreground">macOS / iOS / iPadOS:</strong>{" "}
            Screen Time → Content &amp; Privacy Restrictions → Store /
            Web Content → Limit Adult Websites.
          </li>
          <li>
            <strong className="text-foreground">Android:</strong> Google Family Link
            or Digital Wellbeing + browser restricted mode where available.
          </li>
          <li>
            <strong className="text-foreground">Routers / DNS:</strong> Enable
            OpenDNS FamilyShield, CleanBrowsing, or your ISP&apos;s parental DNS
            so adult domains are blocked for the whole home Wi‑Fi.
          </li>
          <li>
            <strong className="text-foreground">Browsers:</strong> Use supervised
            profiles; disable private/incognito for kids&apos; accounts; install
            reputable filter extensions only from trusted sources.
          </li>
        </ul>
      </section>

      <section>
        <H>4. Dedicated filtering software</H>
        <p className="mt-2">
          Consider well-known parental products (examples people often evaluate:
          Qustodio, Net Nanny, Norton Family, Covenant Eyes). Compare reviews,
          privacy policies, and whether they honor RTA. We do not endorse a
          specific paid vendor.
        </p>
      </section>

      <section>
        <H>5. How to block this site specifically</H>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5">
          <li>Add our domain to your filter&apos;s block list / “always block.”</li>
          <li>Block categories: Adult, Pornography, Nudity.</li>
          <li>Turn on SafeSearch (Google/Bing/YouTube) on child accounts.</li>
          <li>Use separate adult logins; do not share adult device PINs with kids.</li>
          <li>Check browser history and installed apps regularly.</li>
        </ol>
      </section>

      <section>
        <H>6. Talk with young people</H>
        <p className="mt-2">
          Filters help, but conversations about consent, respect, online safety,
          and what to do if they encounter inappropriate material matter more.
          Encourage them to tell a trusted adult without fear.
        </p>
      </section>

      <section>
        <H>7. If a minor accessed this site</H>
        <p className="mt-2">
          Clear the device browser data, strengthen controls above, and review
          how they found the site (search, ads, shared links). Contact us via{" "}
          <Link href="/dmca" className="text-accent hover:underline">
            /dmca
          </Link>{" "}
          if you need data deletion related to a minor.
        </p>
      </section>

      <section>
        <H>8. Related help</H>
        <p className="mt-2">
          Adults who want help with compulsive viewing:{" "}
          <Link href="/addiction-help" className="text-accent hover:underline">
            Addiction Help
          </Link>
          .
        </p>
      </section>
    </LegalDoc>
  );
}
