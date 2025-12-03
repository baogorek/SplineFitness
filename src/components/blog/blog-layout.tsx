import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { BlogPostMeta } from "@/types/blog";

interface BlogLayoutProps {
  meta: BlogPostMeta;
  children: React.ReactNode;
}

export function BlogLayout({ meta, children }: BlogLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/blog"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>
          <Link href="/" className="flex items-center">
            <Image src="/spline_logo.svg" alt="Spline Fitness" width={80} height={80} />
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <article>
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              {meta.title}
            </h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>{meta.author}</span>
              <span>·</span>
              <span>
                {new Date(meta.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              {meta.readingTime && (
                <>
                  <span>·</span>
                  <span>{meta.readingTime}</span>
                </>
              )}
            </div>
          </header>

          <div className="prose-custom">{children}</div>
        </article>
      </main>
    </div>
  );
}
