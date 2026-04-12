import { TopicPageClient } from "@/components/topic/topic-page-client";

export default function TopicPage({
  params
}: {
  params: { tag: string };
}) {
  return <TopicPageClient initialTag={params.tag} />;
}
