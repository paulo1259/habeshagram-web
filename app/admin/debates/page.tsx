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

export default function AdminDebatesPage() {
  return (
    <AdminLayout
      title="Daily Debates"
      description="Manage the debate prompts that keep HabeshaGram feeling fresh day to day, including the create-post deep links."
    >
      <AdminContentManager
        kind="debates"
        title="Daily debates"
        description="Only active debates rotate into the public app. Featured debates bubble up first before the daily rotation is applied."
        emptyTitle="No debates available today"
        emptyDescription="Add a debate prompt here to power the homepage and football discovery debate cards."
        initialValues={{
          prompt: "",
          category: "Big Debate",
          teamTag: "",
          hashtag: "",
          suggestedText: "",
          featured: false,
          active: true,
          publishLabel: ""
        }}
        fields={[
          {
            name: "prompt",
            label: "Prompt",
            type: "textarea",
            placeholder: "Is Arsenal the most complete side right now?",
            rows: 3
          },
          {
            name: "category",
            label: "Category",
            type: "select",
            options: [
              { label: "Big Debate", value: "Big Debate" },
              { label: "Fan Base", value: "Fan Base" },
              { label: "Matchday", value: "Matchday" },
              { label: "Community", value: "Community" }
            ]
          },
          { name: "teamTag", label: "Team tag", type: "select", options: teamOptions },
          { name: "hashtag", label: "Hashtag", type: "text", placeholder: "ggmu" },
          {
            name: "suggestedText",
            label: "Suggested post text",
            type: "textarea",
            placeholder: "My take: Arsenal are the most balanced side right now because...",
            rows: 4
          },
          { name: "publishLabel", label: "Publish label", type: "text", placeholder: "Today / Fan Debate" },
          {
            name: "featured",
            label: "Feature this debate",
            type: "checkbox",
            helpText: "Featured debates get priority in the daily rotation."
          },
          {
            name: "active",
            label: "Keep this debate active",
            type: "checkbox",
            helpText: "Inactive debates stay in Firestore but do not render in the public app."
          }
        ]}
        getItemTitle={(item) => item.prompt}
        getItemSummary={(item) => item.suggestedText}
        getBadges={(item) => {
          const badges: string[] = [item.category];
          if (item.teamTag) {
            badges.push(item.teamTag);
          }
          if (item.hashtag) {
            badges.push(`#${item.hashtag}`);
          }
          badges.push(item.active ? "Active" : "Paused");
          if (item.featured) {
            badges.push("Featured");
          }
          return badges;
        }}
      />
    </AdminLayout>
  );
}
