import { createFileRoute } from "@tanstack/react-router";
import { BrainDump } from "@/components/BrainDump";
import { ModuleScreen } from "@/components/ModuleScreen";

export const Route = createFileRoute("/dump")({
  head: () => ({
    meta: [
      { title: "Trash Panda / Random Crap — MOS" },
      { name: "description", content: "The hidden brain-dump notes buffer inside MOS." },
      { property: "og:title", content: "Trash Panda / Random Crap — MOS" },
      { property: "og:description", content: "The hidden brain-dump notes buffer inside MOS." },
    ],
  }),
  component: () => (
    <ModuleScreen moduleKey="dump">
      <BrainDump />
    </ModuleScreen>
  ),
});

