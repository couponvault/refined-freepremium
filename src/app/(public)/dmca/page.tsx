import type { Metadata } from "next";
import Link from "next/link";
import LegalDoc, { H } from "@/components/public/LegalDoc";
import DmcaForm from "@/components/public/DmcaForm";
import { buildMetadata, SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "DMCA / Copyright",
  description: `File a DMCA copyright takedown request with ${SITE_NAME}.`,
  path: "/dmca",
});

export default function DmcaPage() {
  return (
    <LegalDoc title="DMCA Policy" subtitle="Copyright infringement notices · Last updated: August 2026">
      <section>
        <H>1. Policy</H>
        <p className="mt-2">
          {SITE_NAME} respects intellectual property rights. If you believe
          content on this site infringes your copyright, submit a notice using
          the form below. We will review and take appropriate action, which may
          include removing or disabling access to the material.
        </p>
      </section>
      <section>
        <H>2. What to include</H>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>Identification of the copyrighted work</li>
          <li>The exact URL(s) of the allegedly infringing material</li>
          <li>Your name, mailing address, phone, and email</li>
          <li>A statement of good-faith belief that use is not authorized</li>
          <li>A statement under penalty of perjury that the notice is accurate</li>
          <li>Your physical or electronic signature (typing your full name is acceptable in the form)</li>
        </ul>
        <p className="mt-2">
          Submitting a knowingly false claim may have legal consequences. See
          also our{" "}
          <Link href="/policy" className="text-accent hover:underline">
            Content Policy
          </Link>
          .
        </p>
      </section>
      <section>
        <H>3. Submit a notice</H>
        <div className="mt-3">
          <DmcaForm />
        </div>
      </section>
    </LegalDoc>
  );
}
