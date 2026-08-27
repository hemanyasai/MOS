import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ModuleScreen } from "@/components/ModuleScreen";
import { Diary } from "@/components/Diary";
import { DiaryLock } from "@/components/DiaryLock";

export const Route = createFileRoute("/diary")({
  head: () => ({
    meta: [
      { title: "JB — MOS" },
      {
        name: "description",
        content: "JB: the locked private diary inside MOS, with images, voice notes and tags.",
      },
      { property: "og:title", content: "JB — MOS" },
      { property: "og:description", content: "The locked private diary module in MOS." },
    ],
  }),
  component: DiaryScreen,
});

function DiaryScreen() {
  // Re-locks on every navigation into JB — unlock state lives only in this component.
  const [unlocked, setUnlocked] = useState(false);

  return (
    <ModuleScreen moduleKey="diary">
      {unlocked ? <Diary /> : <DiaryLock onUnlock={() => setUnlocked(true)} />}
    </ModuleScreen>
  );
}
