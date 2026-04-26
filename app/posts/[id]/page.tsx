import { PostDetailPage } from "@/components/posts/post-detail-page";

export default function PostDetailRoutePage({ params }: { params: { id: string } }) {
  return <PostDetailPage postId={params.id} />;
}
