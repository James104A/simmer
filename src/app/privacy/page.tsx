import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Simmer",
  description: "How Simmer collects, uses, and protects your information.",
};

const LAST_UPDATED = "May 18, 2026";
const SUPPORT_EMAIL = "jfrauen@me.com";

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-foreground-muted">
          Last updated {LAST_UPDATED}
        </p>

        <div className="mt-8 space-y-8 text-foreground leading-relaxed">
          <section>
            <p>
              Simmer is a social recipe app that lets you save your own recipes
              and share them with friends and your partner. This policy
              describes what we collect, why we collect it, and the choices you
              have. We try to keep it short and plain.
            </p>
          </section>

          <Section title="Who we are">
            <p>
              &ldquo;Simmer&rdquo; refers to the Simmer mobile app and the
              service at simmerfam.com. If you have questions about this policy,
              email{" "}
              <a
                className="text-accent-amber hover:text-accent-amber-light underline"
                href={`mailto:${SUPPORT_EMAIL}`}
              >
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          </Section>

          <Section title="Information we collect">
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>Account information.</strong> Your name, email address,
                and a hashed password. If you sign in with Apple, we receive a
                stable identifier from Apple and, on the first sign-in, your
                name and email if you choose to share them.
              </li>
              <li>
                <strong>Recipes and content you create.</strong> The recipes,
                titles, ingredients, instructions, photos, notes, and other
                content you add to your library.
              </li>
              <li>
                <strong>Social graph.</strong> Friend connections, partner
                links, friend requests you send or receive, and the email
                addresses you use to invite friends.
              </li>
              <li>
                <strong>Device tokens.</strong> If you enable push
                notifications, the Apple Push Notification service token for
                your device, so we can deliver activity alerts.
              </li>
              <li>
                <strong>Moderation signals.</strong> Reports you submit and
                blocks you create, so we can act on abusive content and prevent
                blocked users from contacting you.
              </li>
              <li>
                <strong>Basic technical data.</strong> Server logs (IP address,
                timestamps, request paths) used for security, debugging, and
                rate limiting. We do not maintain a long-term advertising or
                tracking profile of you.
              </li>
            </ul>
            <p className="mt-4">
              We do <strong>not</strong> track you across other companies&rsquo;
              apps or websites, and we do not sell your personal information.
            </p>
          </Section>

          <Section title="How we use your information">
            <ul className="list-disc space-y-2 pl-6">
              <li>To operate the service — show your recipes, your feed, your friends, and your partner&rsquo;s shared library.</li>
              <li>To deliver push notifications you have opted into.</li>
              <li>To authenticate you and keep your account secure.</li>
              <li>To respond to reports, enforce our Terms, and prevent abuse.</li>
              <li>To communicate with you about your account or important changes to the service.</li>
            </ul>
          </Section>

          <Section title="Who can see your content">
            <p>
              Recipes you create are visible to you. They appear in the feeds
              of your friends and your linked partner, if any. Reports you
              submit are visible only to Simmer staff handling moderation.
              Email addresses used in friend invitations are visible to the
              recipient of the invitation.
            </p>
          </Section>

          <Section title="Third-party services">
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>Apple.</strong> Sign in with Apple, the Apple Push
                Notification service, and App Store / TestFlight delivery.
              </li>
              <li>
                <strong>Vercel.</strong> Hosts the simmerfam.com web service and
                serves API traffic.
              </li>
              <li>
                <strong>Supabase / PostgreSQL.</strong> Stores your account and
                recipe data.
              </li>
            </ul>
            <p className="mt-4">
              These providers process data on our behalf under their own
              security and privacy practices. We do not share your data with
              advertisers or data brokers.
            </p>
          </Section>

          <Section title="Data retention">
            <p>
              We keep your account and content for as long as your account is
              active. When you delete your account, we delete your profile,
              recipes, friend connections, device tokens, and notes within 30
              days. Reports and moderation records may be retained longer to
              support safety investigations and meet legal obligations.
              Aggregated, non-identifying logs may be retained for security and
              capacity planning.
            </p>
          </Section>

          <Section title="Your choices">
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>Access and correction.</strong> You can view and edit
                your profile and recipes from inside the app.
              </li>
              <li>
                <strong>Delete your account.</strong> Use Settings → Delete
                Account in the iOS app, or email{" "}
                <a
                  className="text-accent-amber hover:text-accent-amber-light underline"
                  href={`mailto:${SUPPORT_EMAIL}`}
                >
                  {SUPPORT_EMAIL}
                </a>{" "}
                from your account email to request deletion.
              </li>
              <li>
                <strong>Push notifications.</strong> You can disable
                notifications anytime in iOS Settings → Notifications →
                Simmer.
              </li>
              <li>
                <strong>Block and report.</strong> Block or report any user or
                recipe directly from the app.
              </li>
            </ul>
          </Section>

          <Section title="Children">
            <p>
              Simmer is not directed to children under 13, and we do not
              knowingly collect personal information from children under 13. If
              you believe a child has provided us with information, please
              contact us and we will delete it.
            </p>
          </Section>

          <Section title="International users">
            <p>
              Simmer is operated from the United States. If you use the service
              from outside the United States, you understand that your
              information will be processed in the United States.
            </p>
          </Section>

          <Section title="Changes to this policy">
            <p>
              We will update the &ldquo;Last updated&rdquo; date when this
              policy changes. If we make material changes, we will provide
              prominent notice in the app or by email.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Questions, requests, or concerns? Reach us at{" "}
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
