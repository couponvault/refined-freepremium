import type { Metadata } from "next";
import Link from "next/link";
import LegalDoc, { H } from "@/components/public/LegalDoc";
import { buildMetadata, SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Porn Addiction Help & Responsible Viewing",
  description: `What compulsive porn use can look like, practical steps to cut back, and where to get professional help. Resources from ${SITE_NAME}.`,
  path: "/addiction-help",
});

export default function AddictionHelpPage() {
  return (
    <LegalDoc
      title="Porn Addiction Help"
      subtitle="Understanding compulsive use · Practical steps · Where to get support"
    >
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-100/90">
        <strong className="text-foreground">Important:</strong> This page is
        educational, not medical or mental-health advice. If you are in crisis,
        contact local emergency services or a suicide/crisis hotline in your
        country immediately.
      </div>

      <section>
        <H>1. What people mean by “porn addiction”</H>
        <p className="mt-2">
          Many people use “porn addiction” to describe{" "}
          <strong className="text-foreground">compulsive sexual content use</strong>{" "}
          that feels out of control and harms sleep, work, relationships, mood,
          or self-respect — even when they want to stop or cut back. Clinicians
          may talk about problematic pornography use, compulsive sexual behavior,
          or impulse-control issues. Labels vary; what matters is whether use is
          hurting your life.
        </p>
      </section>

      <section>
        <H>2. Signs it may be a problem</H>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>You watch more often or longer than you intended</li>
          <li>You keep using despite guilt, anxiety, or relationship damage</li>
          <li>You need more extreme content to feel the same effect</li>
          <li>School, work, sleep, or hobbies are suffering</li>
          <li>You hide use or feel unable to stop for a set period</li>
          <li>Real-life intimacy feels harder or less satisfying</li>
        </ul>
        <p className="mt-2">
          Having some of these signs does not replace a professional assessment.
        </p>
      </section>

      <section>
        <H>3. Why it can be hard to stop</H>
        <p className="mt-2">
          Easy access, novelty, stress relief, loneliness, and habit loops make
          adult sites highly reinforcing. Shame often keeps people stuck. Progress
          is usually gradual — relapse into old habits is common and not a reason
          to give up.
        </p>
      </section>

      <section>
        <H>4. Practical steps to cut back or quit</H>
        <ol className="mt-2 list-decimal space-y-2 pl-5">
          <li>
            <strong className="text-foreground">Decide your goal:</strong> full
            abstinence, or clear limits (e.g. no use on workdays, time caps).
          </li>
          <li>
            <strong className="text-foreground">Block access:</strong> use router
            DNS filters, adult-block apps, or OS screen-time tools. See{" "}
            <Link href="/parental-controls" className="text-accent hover:underline">
              Parental Controls
            </Link>{" "}
            for tool ideas (they work for adults too).
          </li>
          <li>
            <strong className="text-foreground">Remove triggers:</strong> log out
            of sites, clear bookmarks, turn off NSFW social feeds, don’t browse
            alone in bed with your phone if that’s your pattern.
          </li>
          <li>
            <strong className="text-foreground">Replace the habit:</strong>{" "}
            short walks, exercise, calling a friend, journaling, sleep hygiene —
            plan a 10-minute substitute when urges hit.
          </li>
          <li>
            <strong className="text-foreground">Urge surfing:</strong> notice the
            urge, wait 15 minutes without acting; urges usually peak and fall.
          </li>
          <li>
            <strong className="text-foreground">Accountability:</strong> tell a
            trusted person, therapist, or support group; some people use
            accountability software.
          </li>
          <li>
            <strong className="text-foreground">Treat root issues:</strong>{" "}
            stress, anxiety, depression, ADHD, or relationship problems often
            fuel compulsive use — professional help helps more than willpower alone.
          </li>
        </ol>
      </section>

      <section>
        <H>5. Getting professional help</H>
        <p className="mt-2">
          Consider a licensed therapist experienced in compulsive sexual behavior
          or addiction. In the United States you can start with the SAMHSA
          National Helpline (treatment referral, 24/7):
        </p>
        <p className="mt-2">
          <a
            href="https://www.samhsa.gov/find-help/national-helpline"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            samhsa.gov/find-help/national-helpline
          </a>{" "}
          · 1-800-662-HELP (4357)
        </p>
        <p className="mt-2">
          Other options: your primary-care doctor, local mental-health clinic,
          university counseling services, or reputable online therapy platforms
          in your country. If you feel hopeless or unsafe, use a local crisis line
          immediately.
        </p>
      </section>

      <section>
        <H>6. Support communities (use carefully)</H>
        <p className="mt-2">
          Peer groups (in-person 12-step style meetings, moderated forums, or
          recovery apps) help some people. Others prefer private therapy only.
          Avoid communities that promote shame, extreme medical claims, or hate.
          Choose spaces that focus on health, honesty, and respect.
        </p>
      </section>

      <section>
        <H>7. For partners &amp; family</H>
        <p className="mt-2">
          Compulsive use can hurt trust. Partners may seek couples counseling.
          Focus on clear boundaries and professional support rather than only
          surveillance. Parents: protect minors with filters —{" "}
          <Link href="/parental-controls" className="text-accent hover:underline">
            Parental Controls
          </Link>
          .
        </p>
      </section>

      <section>
        <H>8. Our role as {SITE_NAME}</H>
        <p className="mt-2">
          We provide adult entertainment for consenting adults and also provide
          this information so visitors who want to reduce use know where to start.
          Leaving this site, using blockers, and seeking help are healthy choices
          when content use is causing harm.
        </p>
      </section>

      <section>
        <H>9. Leave / continue</H>
        <p className="mt-2 flex flex-wrap gap-3">
          <a
            href="https://www.google.com"
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:border-accent/40"
          >
            Exit to Google
          </a>
          <Link
            href="/parental-controls"
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:border-accent/40"
          >
            Set up blockers
          </Link>
          <Link
            href="/"
            className="rounded-lg bg-accent/15 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/25"
          >
            Back to home
          </Link>
        </p>
      </section>
    </LegalDoc>
  );
}
