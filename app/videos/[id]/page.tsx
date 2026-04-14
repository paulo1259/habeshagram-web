import { notFound } from "next/navigation";
import { VideoDetailPageClient } from "@/components/videos/video-detail-page-client";
import { getCuratedVideoHighlightById } from "@/services/video-highlights-data";

export default function VideoDetailPage({ params }: { params: { id: string } }) {
  const video = getCuratedVideoHighlightById(params.id);

  if (!video) {
    notFound();
  }

  return <VideoDetailPageClient video={video} />;
}
