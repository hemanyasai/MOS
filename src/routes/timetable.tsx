import { createFileRoute } from "@tanstack/react-router";
import { ModuleScreen } from "@/components/ModuleScreen";
import { ClassSchedule } from "@/components/ClassSchedule";
import { Deadlines } from "@/components/Deadlines";

export const Route = createFileRoute("/timetable")({
  head: () => ({
    meta: [
      { title: "Bloom Season / Orbit — MOS" },
      {
        name: "description",
        content: "Class schedule, deadlines, extra classes and pending-date events in MOS.",
      },
      { property: "og:title", content: "Bloom Season / Orbit — MOS" },
      { property: "og:description", content: "Your timetable and deadline module in MOS." },
    ],
  }),
  component: TimetableScreen,
});

function TimetableScreen() {
  return (
    <ModuleScreen moduleKey="timetable">
      <div className="flex flex-col gap-8">
        <ClassSchedule />
        <Deadlines />
      </div>
    </ModuleScreen>
  );
}
