import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | Spline Fitness",
  description: "Privacy policy for Spline Fitness workout tracking application",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to App
          </Link>
          <Link href="/" className="flex items-center">
            <Image
              src="/spline_logo.svg"
              alt="Spline Fitness"
              width={80}
              height={80}
            />
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: January 19, 2026</p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Overview</h2>
            <p className="text-muted-foreground mb-4">
              Spline Fitness (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is a workout tracking application
              available at splinefitness.com. This privacy policy explains how we collect, use, and protect
              your information when you use our service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Information We Collect</h2>

            <h3 className="text-lg font-medium text-foreground mb-2">Account Information</h3>
            <p className="text-muted-foreground mb-4">
              When you sign in with Google, we receive and store:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
              <li>Your email address</li>
              <li>Your name (as provided by Google)</li>
              <li>Your Google account identifier</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground mb-2">Workout Data</h3>
            <p className="text-muted-foreground mb-4">
              When you log workouts, we store:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
              <li>Exercise names and types</li>
              <li>Sets, reps, and weights</li>
              <li>Workout duration and timestamps</li>
              <li>Any notes you add to your workouts</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">How We Use Your Information</h2>
            <p className="text-muted-foreground mb-4">We use your information to:</p>
            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
              <li>Provide and maintain the workout tracking service</li>
              <li>Display your workout history and progress</li>
              <li>Associate your workouts with your account so you can access them across devices</li>
            </ul>
            <p className="text-muted-foreground mb-4">
              We do not sell, rent, or share your personal information with third parties for marketing purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Data Storage</h2>
            <p className="text-muted-foreground mb-4">
              Your data is stored securely using Supabase, a cloud database service. Data is encrypted in transit
              and at rest. Our servers are located in the United States.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Third-Party Services</h2>
            <p className="text-muted-foreground mb-4">We use the following third-party services:</p>
            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
              <li><strong>Google OAuth</strong> - For authentication (signing in to your account)</li>
              <li><strong>Supabase</strong> - For secure data storage and authentication services</li>
              <li><strong>Vercel</strong> - For hosting the application</li>
            </ul>
            <p className="text-muted-foreground mb-4">
              Each of these services has their own privacy policies governing their use of data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Guest Mode</h2>
            <p className="text-muted-foreground mb-4">
              You can use Spline Fitness without signing in. In guest mode, no data is collected or stored.
              Your workouts exist only in your browser session and are not saved when you close the app.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Data Retention and Deletion</h2>
            <p className="text-muted-foreground mb-4">
              Your workout data is retained as long as you have an account with us. If you wish to delete
              your account and all associated data, please contact us at the email address below.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Your Rights</h2>
            <p className="text-muted-foreground mb-4">You have the right to:</p>
            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
              <li>Access your personal data</li>
              <li>Request correction of your data</li>
              <li>Request deletion of your account and data</li>
              <li>Export your workout data</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Changes to This Policy</h2>
            <p className="text-muted-foreground mb-4">
              We may update this privacy policy from time to time. We will notify users of any material
              changes by updating the &quot;Last updated&quot; date at the top of this page.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Contact Us</h2>
            <p className="text-muted-foreground mb-4">
              If you have questions about this privacy policy or your data, please contact us at:
            </p>
            <p className="text-muted-foreground">
              <strong>Email:</strong> privacy@splinefitness.com
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t py-8 px-4 mt-12">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/spline_logo.svg" alt="Spline Fitness" width={50} height={50} />
            <span className="text-sm text-muted-foreground">Spline Fitness</span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/terms"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="/blog"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Blog
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
