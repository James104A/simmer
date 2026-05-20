import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — Simmer",
  description: "The rules for using the Simmer app and service.",
};

const LAST_UPDATED = "May 18, 2026";
const SUPPORT_EMAIL = "jfrauen@me.com";

export default function TermsPage() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Link
          href="/"
          className="text-sm text-foreground-muted hover:text-foreground"
        >
          ← Back to Simmer
        </Link>

        <h1 className="mt-6 font-[family-name:var(--font-display)] text-4xl font-semibold text-foreground">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-foreground-muted">
          Last updated {LAST_UPDATED}
        </p>

        <div className="mt-8 space-y-8 text-foreground leading-relaxed">
          <section>
            <p>
              These terms govern your use of the Simmer iOS app and the
              service at simmerfam.com (together, &ldquo;Simmer&rdquo;). By
              creating an account or using the service, you agree to these
              terms. If you do not agree, do not use Simmer.
            </p>
          </section>

          <Section title="Your account">
            <ul className="list-disc space-y-2 pl-6">
              <li>You must be at least 13 years old to use Simmer.</li>
              <li>
                Provide accurate account information and keep your credentials
                secure. You are responsible for activity under your account.
              </li>
              <li>
                One person per account. Do not impersonate anyone or
                misrepresent your affiliation with a person or entity.
              </li>
            </ul>
          </Section>

          <Section title="Your content">
            <p>
              You retain ownership of the recipes, photos, notes, and other
              content you create in Simmer (&ldquo;Your Content&rdquo;). You
              grant Simmer a worldwide, non-exclusive, royalty-free license to
              host, store, reproduce, and display Your Content solely to
              operate the service — including showing it to your friends and
              your linked partner.
            </p>
            <p className="mt-4">
              You are responsible for Your Content. You represent that you
              have the rights necessary to share it and that it does not
              violate anyone&rsquo;s rights or applicable law.
            </p>
          </Section>

          <Section title="Acceptable use">
            <p>You agree not to use Simmer to:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                Post content that is illegal, abusive, harassing, hateful,
                sexually explicit, violent, or that exploits minors.
              </li>
              <li>Harass, threaten, or impersonate any person.</li>
              <li>
                Post spam, scams, deceptive content, or unsolicited commercial
                content.
              </li>
              <li>
                Infringe anyone&rsquo;s intellectual property, privacy,
                publicity, or other rights.
              </li>
              <li>
                Attempt to access another user&rsquo;s account, reverse
                engineer the service, or interfere with its operation.
              </li>
              <li>
                Scrape, copy, or harvest data from Simmer except as expressly
                permitted by our API for your own account.
              </li>
            </ul>
            <p className="mt-4">
              You can report content or users in the app. We may remove
              content and suspend or terminate accounts that violate these
              terms, in our reasonable judgment.
            </p>
          </Section>

          <Section title="Zero tolerance for objectionable content and abusive users">
            <p>
              Simmer enforces a zero-tolerance policy for objectionable
              content and abusive behavior. We provide in-app tools to block
              users and report content. Reports are reviewed and acted on
              promptly; accounts that post objectionable content or harass
              other users may be removed without notice.
            </p>
          </Section>

          <Section title="Friends and partner sharing">
            <p>
              Simmer is social. Recipes you create are visible to your friends
              and your linked partner, if any. Do not add a partner without
              their consent. You can unfriend, unlink, or block other users at
              any time.
            </p>
          </Section>

          <Section title="Termination">
            <p>
              You may delete your account at any time from Settings → Delete
              Account, or by emailing{" "}
              <a
                className="text-accent-amber hover:text-accent-amber-light underline"
                href={`mailto:${SUPPORT_EMAIL}`}
              >
                {SUPPORT_EMAIL}
              </a>
              . We may suspend or terminate your access if you violate these
              terms or if we are required to do so by law.
            </p>
          </Section>

          <Section title="Disclaimers">
            <p>
              Simmer is provided &ldquo;as is&rdquo; and &ldquo;as
              available,&rdquo; without warranties of any kind, express or
              implied, including merchantability, fitness for a particular
              purpose, and non-infringement. Recipes shared on Simmer come from
              users; Simmer does not verify the safety, nutritional accuracy,
              or allergen content of any recipe. Use your own judgment,
              especially for allergies, dietary restrictions, and food safety.
            </p>
          </Section>

          <Section title="Limitation of liability">
            <p>
              To the maximum extent permitted by law, Simmer and its
              affiliates will not be liable for any indirect, incidental,
              special, consequential, or punitive damages, or any loss of
              profits, revenues, data, or goodwill, arising out of or related
              to your use of the service. Our total liability for any claim
              arising out of these terms or the service is limited to the
              greater of (a) the amount you paid us in the prior twelve months
              or (b) US $50.
            </p>
          </Section>

          <Section title="Changes to the service or these terms">
            <p>
              We may change, suspend, or discontinue features at any time. We
              will update these terms from time to time; the &ldquo;Last
              updated&rdquo; date above reflects the most recent change.
              Material changes will be announced in the app or by email.
              Continued use after a change means you accept the updated terms.
            </p>
          </Section>

          <Section title="Governing law">
            <p>
              These terms are governed by the laws of the State of California,
              without regard to its conflict-of-laws rules. Disputes will be
              resolved in the state or federal courts located in California,
              and you consent to their jurisdiction.
            </p>
          </Section>

          <Section title="Apple-specific terms">
            <p>
              If you obtained the Simmer app from the App Store, you
              acknowledge that these terms are between you and Simmer, not
              Apple. Apple is not responsible for the app or its content. In
              the event of any failure to conform to an applicable warranty,
              you may notify Apple and Apple may refund the purchase price of
              the app to you, if any; Apple has no other warranty obligation
              with respect to the app. Apple and its subsidiaries are
              third-party beneficiaries of these terms and may enforce them
              against you.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Questions about these terms? Reach us at{" "}
              <a
                className="text-accent-amber hover:text-accent-amber-light underline"
                href={`mailto:${SUPPORT_EMAIL}`}
              >
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          </Section>
        </div>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-foreground">
        {title}
      </h2>
      <div className="mt-3 text-foreground">{children}</div>
    </section>
  );
}
