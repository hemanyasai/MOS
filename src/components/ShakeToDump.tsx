import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useShake } from "@/hooks/use-shake";

/** Hidden entry point: shake the device to open the brain dump. */
export function ShakeToDump() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useShake(() => {
    if (pathname !== "/dump") navigate({ to: "/dump" });
  });

  return null;
}
