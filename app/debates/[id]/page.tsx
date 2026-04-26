import { DebateDetailPage } from "@/components/debates/debate-detail-page";

export default function DebateDetailRoutePage({ params }: { params: { id: string } }) {
  return <DebateDetailPage debateId={params.id} />;
}
