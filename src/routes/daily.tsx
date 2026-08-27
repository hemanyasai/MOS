import { createFileRoute } from "@tanstack/react-router";
import { ModuleScreen } from "@/components/ModuleScreen";
import { PeriodTracker } from "@/components/PeriodTracker";
import { MetricsTracker } from "@/components/MetricsTracker";

export const Route = createFileRoute("/daily")({
  head: () => ({
    meta: [
      { title: "Petal Trail / Mission Log — MOS" },
      {
        name: "description",
        content: "Daily to-dos, mood tracking, period tracking and work logs in MOS.",
      },
      { property: "og:title", content: "Petal Trail / Mission Log — MOS" },
      { property: "og:description", content: "Your daily activities module in MOS." },
    ],
  }),
  component: DailyScreen,
});

function DailyScreen() {
  return (
    <ModuleScreen moduleKey="daily">
      <div className="flex flex-col gap-8">
        <PeriodTracker />
        <MetricsTracker />
      </div>
    </ModuleScreen>
  );
}
