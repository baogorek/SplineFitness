import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service | Spline Fitness",
  description: "Terms of service for Spline Fitness workout tracking application",
};

export default function TermsPage() {
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: January 19, 2026</p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Agreement to Terms</h2>
            <p className="text-muted-foreground mb-4">
              By accessing or using Spline Fitness at splinefitness.com, you agree to be bound by these
              Terms of Service. If you do not agree to these terms, please do not use the service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Description of Service</h2>
            <p className="text-muted-foreground mb-4">
              Spline Fitness is a workout tracking application that allows users to log and track their
              exercise routines, including circuit training and traditional strength training workouts.
              The service is provided free of charge.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">User Accounts</h2>
            <p className="text-muted-foreground mb-4">
              To save your workout data, you must sign in using your Google account. You are responsible
              for maintaining the security of your account credentials. You may also use the service
              in guest mode without an account, but your data will not be saved.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Acceptable Use</h2>
            <p className="text-muted-foreground mb-4">You agree not to:</p>
            <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
              <li>Use the service for any illegal purpose</li>
              <li>Attempt to gain unauthorized access to the service or its systems</li>
              <li>Interfere with or disrupt the service</li>
              <li>Use automated systems to access the service without permission</li>
              <li>Impersonate another person or entity</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Your Content</h2>
            <p className="text-muted-foreground mb-4">
              You retain ownership of any workout data and content you create using the service. By using
              the service, you grant us a limited license to store and display your content to provide
              the service to you.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Disclaimer of Warranties</h2>
            <p className="text-muted-foreground mb-4">
              The service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind,
              either express or implied. We do not guarantee that the service will be uninterrupted,
              secure, or error-free.
            </p>
            <p className="text-muted-foreground mb-4">
              <strong>Health Disclaimer:</strong> Spline Fitness is a workout tracking tool only. It does
              not provide medical advice, diagnosis, or treatment. Always consult a qualified healthcare
              provider before starting any exercise program. Use of the service is at your own risk.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Limitation of Liability</h2>
            <p className="text-muted-foreground mb-4">
              To the fullest extent permitted by law, we shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages arising from your use of the service, including
              but not limited to personal injury, property damage, or data loss.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Service Modifications</h2>
            <p className="text-muted-foreground mb-4">
              We reserve the right to modify, suspend, or discontinue the service at any time without
              notice. We may also update these terms from time to time. Continued use of the service
              after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Termination</h2>
            <p className="text-muted-foreground mb-4">
              We may terminate or suspend your access to the service at any time for violations of these
              terms or for any other reason at our discretion. You may stop using the service at any time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Governing Law</h2>
            <p className="text-muted-foreground mb-4">
              These terms shall be governed by and construed in accordance with the laws of the United States,
              without regard to conflict of law principles.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Contact Us</h2>
            <p className="text-muted-foreground mb-4">
              If you have questions about these terms, please contact us at:
            </p>
            <p className="text-muted-foreground">
              <strong>Email:</strong> baogorek@gmail.com
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
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy Policy
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
