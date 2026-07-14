import { BreakingNow } from "@/components/discovery/breaking-now";
import { CommunitySpotlight } from "@/components/discovery/community-spotlight";
import { DailyDebates } from "@/components/discovery/daily-debates";
import { EventHighlights } from "@/components/discovery/event-highlights";
import { CommunityHighlights } from "@/components/discovery/community-highlights";
import { LocalNewsSection } from "@/components/discovery/local-news-section";
import { TrendingTopics } from "@/components/discovery/trending-topics";
import { WhoToFollow } from "@/components/discovery/who-to-follow";
import { RadioTeaser } from "@/components/radio/radio-teaser";

export function RightSidebar() {
  return (
    <aside className="sticky top-24 hidden h-fit space-y-5 xl:block">
      <RadioTeaser compact />
      <BreakingNow compact />
      <TrendingTopics />
      <DailyDebates compact />
      <WhoToFollow />
      <EventHighlights />
      <CommunitySpotlight />
      <LocalNewsSection compact />
      <CommunityHighlights />
    </aside>
  );
}
