"use client";

import { AdminContentManager } from "@/components/admin/admin-content-manager";
import { AdminLayout } from "@/components/admin/admin-layout";

const teamOptions = [
  { label: "No team tag", value: "" },
  { label: "Manchester United", value: "Manchester United" },
  { label: "Arsenal", value: "Arsenal" },
  { label: "Chelsea", value: "Chelsea" },
  { label: "Manchester City", value: "Manchester City" }
];

export default function AdminVideosPage() {
  return (
    <AdminLayout
      title="Curated Videos"
      description="Manage the admin-curated embed library behind the Video Highlights rail and the dedicated video detail pages."
    >
      <AdminContentManager
        kind="videos"
        title="Curated videos"
        description="Create and edit embedded video highlights without touching Firestore documents by hand."
        emptyTitle="No curated videos yet"
        emptyDescription="Once you publish a video here, it will flow into the homepage highlight rail and any related team surfaces."
        initialValues={{
          title: "",
          category: "Community Moments",
          source: "",
          summary: "",
          thumbnailURL: "",
          videoUrl: "",
          embedUrl: "",
          duration: "",
          hashtags: "",
          publishLabel: "",
          featured: false
        }}
        fields={[
          { name: "title", label: "Title", type: "text", placeholder: "Late winner sparks fan chaos", required: true },
          {
            name: "category",
            label: "Category",
            type: "select",
            options: [
              { label: "Community Moments", value: "Community Moments" },
              { label: "Fan Reactions", value: "Fan Reactions" },
              { label: "Culture", value: "Culture" },
              { label: "Music", value: "Music" }
            ]
          },
          { name: "source", label: "Source", type: "text", placeholder: "YouTube / BBC Sport / Club channel", required: true },
          {
            name: "summary",
            label: "Summary",
            type: "textarea",
            placeholder: "A short summary that explains why this clip matters.",
            rows: 4,
            required: true
          },
          { name: "thumbnailURL", label: "Thumbnail URL", type: "text", placeholder: "https://..." },
          { name: "videoUrl", label: "Video URL", type: "text", placeholder: "https://..." },
          {
            name: "embedUrl",
            label: "Embed URL",
            type: "text",
            placeholder: "https://www.youtube.com/embed/...",
            helpText: "This is the URL the in-app player uses.",
            required: true
          },
          { name: "duration", label: "Duration", type: "text", placeholder: "3:14" },
          {
            name: "hashtags",
            label: "Hashtags",
            type: "tags",
            placeholder: "habesha, music, community",
            helpText: "Separate multiple hashtags with commas."
          },
          { name: "publishLabel", label: "Publish label", type: "text", placeholder: "Tonight / 2h ago / This week" },
          {
            name: "featured",
            label: "Feature this video",
            type: "checkbox",
            helpText: "Featured items float toward the top of discovery surfaces."
          }
        ]}
        getItemTitle={(item) => item.title}
        getItemSummary={(item) => item.summary}
        getBadges={(item) => {
          const badges = [item.category, item.source];
          if (item.featured) {
            badges.push("Featured");
          }
          return badges;
        }}
      />
    </AdminLayout>
  );
}
