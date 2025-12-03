export interface BlogPostMeta {
  title: string;
  description: string;
  date: string;
  author: string;
  slug: string;
  readingTime?: string;
  categories?: string[];
  tags?: string[];
  coverImage?: string;
  featured?: boolean;
  draft?: boolean;
}

export interface BlogPost extends BlogPostMeta {
  content: string;
}
