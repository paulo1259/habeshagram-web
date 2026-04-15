import { VideoDetailPageClient } from "@/components/videos/video-detail-page-client";

export default function VideoDetailPage({ params }: { params: { id: string } }) {
  return <VideoDetailPageClient videoId={params.id} />;
}
