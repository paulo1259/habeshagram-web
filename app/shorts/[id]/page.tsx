import { ShortDetailPageClient } from "@/components/videos/short-detail-page-client";

export default function ShortDetailPage({ params }: { params: { id: string } }) {
  return <ShortDetailPageClient shortId={params.id} />;
}
