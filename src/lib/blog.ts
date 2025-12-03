import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";
import { BlogPostMeta } from "@/types/blog";

const postsDirectory = path.join(process.cwd(), "src/content/posts");

export async function getAllPosts(): Promise<BlogPostMeta[]> {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(postsDirectory);

  const posts = fileNames
    .filter((name) => name.endsWith(".mdx"))
    .map((fileName) => {
      const slug = fileName.replace(/\.mdx$/, "");
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, "utf8");
      const { data, content } = matter(fileContents);

      return {
        slug,
        title: data.title || "Untitled",
        description: data.description || "",
        date: data.date || new Date().toISOString(),
        author: data.author || "Spline Fitness",
        readingTime: readingTime(content).text,
        categories: data.categories,
        tags: data.tags,
        coverImage: data.coverImage,
        featured: data.featured,
        draft: data.draft,
      } as BlogPostMeta;
    })
    .filter((post) => !post.draft);

  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export async function getPostBySlug(
  slug: string
): Promise<BlogPostMeta | null> {
  const posts = await getAllPosts();
  return posts.find((p) => p.slug === slug) || null;
}
