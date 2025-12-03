import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { BlogPostMeta } from "@/types/blog";

interface BlogPostCardProps {
  post: BlogPostMeta;
}

export function BlogPostCard({ post }: BlogPostCardProps) {
  return (
    <Link href={`/blog/${post.slug}`}>
      <Card className="cursor-pointer transition-all hover:border-primary hover:shadow-lg h-full">
        <CardHeader>
          <CardTitle className="text-lg">{post.title}</CardTitle>
          <CardDescription>{post.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{new Date(post.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric"
            })}</span>
            <span>·</span>
            <span>{post.readingTime}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
