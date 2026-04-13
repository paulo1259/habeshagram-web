import { BreakingNow } from "@/components/discovery/breaking-now";
import { CommunitySpotlight } from "@/components/discovery/community-spotlight";
import { DailyDebates } from "@/components/discovery/daily-debates";
import { EventHighlights } from "@/components/discovery/event-highlights";
import { CommunityHighlights } from "@/components/discovery/community-highlights";
import { LocalNewsSection } from "@/components/discovery/local-news-section";
import { PremierLeagueStandings } from "@/components/discovery/premier-league-standings";
import { RadioShowcase } from "@/components/discovery/radio-showcase";
import { TrendingTopics } from "@/components/discovery/trending-topics";
import { WhoToFollow } from "@/components/discovery/who-to-follow";

export function RightSidebar() {
  return (
    <aside className="sticky top-24 hidden h-fit space-y-5 xl:block">
      <RadioShowcase compact />
      <BreakingNow compact />
      <PremierLeagueStandings compact />
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
