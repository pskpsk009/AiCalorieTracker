import { createFileRoute } from "@tanstack/react-router";
import { GetFitApp } from "@/components/getfit-app";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GetFit — Meal & Nutrition Tracker" },
      { name: "description", content: "Track meals, daily nutrition, and weekly calorie progress with GetFit." },
      { property: "og:title", content: "GetFit — Meal & Nutrition Tracker" },
      { property: "og:description", content: "A simple daily meal and nutrition tracking experience." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <GetFitApp />;
}
