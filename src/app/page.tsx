import { HomeClient } from "@/components/home-client"
import { getAllPosts } from "@/lib/blog"

export default async function Home() {
  const posts = await getAllPosts()
  return <HomeClient posts={posts.slice(0, 3)} />
}
