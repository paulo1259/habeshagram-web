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

export default function AdminEditorialPage() {
  return (
    <AdminLayout
      title="Editorial Highlights"
      description="Manage the curated entertainment, culture, music, events, and community cards that fill the discovery layer."
    >
      <AdminContentManager
        kind="editorial"
        title="Editorial highlights"
        description="These cards power the local culture and discovery sections without requiring manual Firestore document editing."
        emptyTitle="No editorial highlights yet"
        emptyDescription="Publish the first highlight here to populate the homepage discovery rails."
        initialValues={{
          headline: "",
          source: "",
          summary: "",
          category: "Community",
          imageURL: "",
          link: "",
          featured: false,
          publishLabel: "",
          hashtags: ""
        }}
        fields={[
          { name: "headline", label: "Headline", type: "text", placeholder: "Habesha music night fills the city again", required: true },
          { name: "source", label: "Source", type: "text", placeholder: "HabeshaGram Desk / Community partner", required: true },
          {
            name: "summary",
            label: "Summary",
            type: "textarea",
            placeholder: "A short editorial summary that reads well in discovery cards.",
            rows: 4,
            required: true
          },
          {
            name: "category",
            label: "Category",
            type: "select",
            options: [
              { label: "Entertainment", value: "Entertainment" },
              { label: "Culture", value: "Culture" },
              { label: "Music", value: "Music" },
              { label: "Events", value: "Events" },
              { label: "Community", value: "Community" }
            ]
          },
          { name: "imageURL", label: "Image URL", type: "text", placeholder: "https://..." },
          { name: "link", label: "Link", type: "text", placeholder: "https://..." },
          { name: "publishLabel", label: "Publish label", type: "text", placeholder: "This week / Weekend plans" },
          {
            name: "hashtags",
            label: "Hashtags",
            type: "tags",
            placeholder: "habesha, music, community",
            helpText: "Separate multiple hashtags with commas."
          },
          {
            name: "featured",
            label: "Feature this highlight",
            type: "checkbox",
            helpText: "Featured highlights rise to the top of the editorial feed."
          }
        ]}
        getItemTitle={(item) => item.headline}
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
