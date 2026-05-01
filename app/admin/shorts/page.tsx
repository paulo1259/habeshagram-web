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

export default function AdminShortsPage() {
  return (
    <AdminLayout
      title="Curated Shorts"
      description="Manage the dedicated short-form feed behind /shorts without mixing long-form YouTube highlights into the vertical experience."
    >
      <AdminContentManager
        kind="shorts"
        title="Curated shorts"
        description="Create and edit quick, vertical-friendly clips that are intended specifically for swipeable short-form viewing."
        emptyTitle="No curated shorts yet"
        emptyDescription="Once you publish shorts here, they will power the dedicated /shorts feed without affecting the normal Videos experience."
        initialValues={{
          title: "",
          category: "Matchday Clip",
          source: "",
          summary: "",
          thumbnailURL: "",
          videoUrl: "",
          embedUrl: "",
          duration: "",
          teamTag: "",
          hashtags: "",
          publishLabel: "",
          vertical: true,
          featured: false
        }}
        fields={[
          { name: "title", label: "Title", type: "text", placeholder: "Crowd erupts after late Arsenal winner", required: true },
          {
            name: "category",
            label: "Category",
            type: "select",
            options: [
              { label: "Matchday Clip", value: "Matchday Clip" },
              { label: "Fan Cam", value: "Fan Cam" },
              { label: "Quick Take", value: "Quick Take" },
              { label: "Culture Burst", value: "Culture Burst" }
            ]
          },
          { name: "source", label: "Source", type: "text", placeholder: "Club camera / creator / newsroom", required: true },
          {
            name: "summary",
            label: "Summary",
            type: "textarea",
            placeholder: "Keep it punchy. This should read like a true short-form caption.",
            rows: 4,
            required: true
          },
          { name: "thumbnailURL", label: "Thumbnail URL", type: "text", placeholder: "https://..." },
          { name: "videoUrl", label: "Video URL", type: "text", placeholder: "https://..." },
          {
            name: "embedUrl",
            label: "Embed URL",
            type: "text",
            placeholder: "https://www.youtube.com/embed/... or another vertical-friendly player URL",
            helpText: "This powers the in-feed shorts player.",
            required: true
          },
          {
            name: "duration",
            label: "Duration",
            type: "text",
            placeholder: "0:29",
            helpText: "Keep shorts brief. Items over about 3 minutes are excluded from /shorts.",
            required: true
          },
          { name: "teamTag", label: "Team tag", type: "select", options: teamOptions },
          {
            name: "hashtags",
            label: "Hashtags",
            type: "tags",
            placeholder: "arsenal, matchday, habeshafans",
            helpText: "Separate multiple hashtags with commas."
          },
          { name: "publishLabel", label: "Publish label", type: "text", placeholder: "Now / Tonight / 45m ago" },
          {
            name: "vertical",
            label: "Marked as vertical-friendly",
            type: "checkbox",
            helpText: "Leave this enabled for content that feels natural in a full-height shorts feed."
          },
          {
            name: "featured",
            label: "Feature this short",
            type: "checkbox",
            helpText: "Featured shorts rise toward the top of the /shorts feed."
          }
        ]}
        getItemTitle={(item) => item.title}
        getItemSummary={(item) => item.summary}
        getBadges={(item) => {
          const badges = [item.category, item.source, item.duration];
          if (item.teamTag) {
            badges.push(item.teamTag);
          }
          if (item.vertical) {
            badges.push("Vertical");
          }
          if (item.featured) {
            badges.push("Featured");
          }
          return badges;
        }}
      />
    </AdminLayout>
  );
}
