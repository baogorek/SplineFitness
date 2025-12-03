import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { getAllPosts } from "@/lib/blog";
import { BlogPostCard } from "@/components/blog/blog-post-card";

export const metadata: Metadata = {
  title: "Blog | Spline Fitness",
  description:
    "Fitness tips, training guides, and workout insights from Spline Fitness",
  openGraph: {
    title: "Spline Fitness Blog",
    description: "Fitness tips, training guides, and workout insights",
    type: "website",
  },
};

export default async function BlogPage() {
  const posts = await getAllPosts();

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
          <h1 className="text-3xl font-bold text-foreground mb-2">Blog</h1>
          <p className="text-muted-foreground">
            Fitness tips, training guides, and workout insights
          </p>
        </div>

        {posts.length === 0 ? (
          <p className="text-muted-foreground">No posts yet. Check back soon!</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {posts.map((post) => (
              <BlogPostCard key={post.slug} post={post} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
