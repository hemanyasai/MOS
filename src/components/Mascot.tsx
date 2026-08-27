import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

/**
 * ============================================================
 *  MASCOT — in-house illustration, two skins + expressions
 * ------------------------------------------------------------
 *  Pastel: rounded head with ears. Scifi: hexagon head + antenna.
 *  Only the face (eyes/mouth) changes between expressions.
 * ============================================================
 */

export type MascotExpression = "idle" | "happy" | "sleepy" | "focused" | "goblin";

export function Mascot({
  size = 96,
  className,
  expression = "idle",
}: {
  size?: number;
  className?: string;
  expression?: MascotExpression;
}) {
  const { isPastel } = useTheme();

  return (
    <div
      className={cn("inline-flex select-none items-center justify-center", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {isPastel ? <PastelMascot expression={expression} /> : <ScifiMascot expression={expression} />}
    </div>
  );
}

const OUT = "var(--mascot-outline)";

/* ---- pastel mascot (rounded head, ears, blush) ---- */
function PastelMascot({ expression }: { expression: MascotExpression }) {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <g fill="var(--mascot-body)" stroke={OUT} strokeWidth="3" strokeLinejoin="round">
        <circle cx="27" cy="26" r="12" />
        <circle cx="73" cy="26" r="12" />
        <rect x="14" y="24" width="72" height="64" rx="30" />
      </g>

      {/* eyes */}
      {expression === "happy" && (
        <g fill="none" stroke={OUT} strokeWidth="3.5" strokeLinecap="round">
          <path d="M31 55q6-8 12 0" />
          <path d="M57 55q6-8 12 0" />
        </g>
      )}
      {expression === "sleepy" && (
        <g fill="none" stroke={OUT} strokeWidth="3.5" strokeLinecap="round">
          <path d="M31 54q6 6 12 0" />
          <path d="M57 54q6 6 12 0" />
        </g>
      )}
      {expression === "focused" && (
        <g fill={OUT}>
          <rect x="32" y="50" width="12" height="5" rx="2.5" />
          <rect x="56" y="50" width="12" height="5" rx="2.5" />
        </g>
      )}
      {expression === "idle" && (
        <g fill={OUT}>
          <circle cx="37" cy="53" r="5" />
          <circle cx="63" cy="53" r="5" />
        </g>
      )}

      {/* blush */}
      <circle cx="26" cy="66" r="6" fill="var(--tint-1)" opacity={expression === "happy" ? 0.95 : 0.75} />
      <circle cx="74" cy="66" r="6" fill="var(--tint-1)" opacity={expression === "happy" ? 0.95 : 0.75} />

      {/* mouth */}
      <g fill="none" stroke={OUT} strokeWidth="3" strokeLinecap="round">
        {expression === "happy" && <path d="M41 66q9 10 18 0" />}
        {expression === "idle" && <path d="M44 68q6 6 12 0" />}
        {expression === "focused" && <path d="M43 70h14" />}
        {expression === "goblin" && <path d="M38 70q6-10 24 0" />}
      </g>
      {expression === "sleepy" && (
        <ellipse cx="50" cy="70" rx="4" ry="5" fill="none" stroke={OUT} strokeWidth="3" />
      )}
      {/* goblin spiral eyes */}
      {expression === "goblin" && (
        <g fill="none" stroke={OUT} strokeWidth="2.5">
          <path d="M37 53 a5 5 0 1 1 0.1 0" />
          <path d="M63 53 a5 5 0 1 1 0.1 0" />
        </g>
      )}
    </svg>
  );
}

/* ---- scifi mascot (hexagon head, ring eyes, antenna) ---- */
function ScifiMascot({ expression }: { expression: MascotExpression }) {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <g stroke={OUT} strokeWidth="2.5" strokeLinejoin="round" fill="none">
        <path d="M50 8v16" strokeLinecap="round" />
        <circle cx="50" cy="8" r="4" fill={OUT} />
        <path d="M50 24 84 43v34L50 96 16 77V43z" fill="var(--mascot-body)" />
      </g>

      {/* eyes */}
      <g stroke={OUT} strokeWidth="2.5" fill="none" strokeLinecap="round">
        {expression === "idle" && (
          <>
            <circle cx="38" cy="56" r="7" />
            <circle cx="62" cy="56" r="7" />
          </>
        )}
        {expression === "happy" && (
          <>
            <path d="M31 58q7-9 14 0" />
            <path d="M55 58q7-9 14 0" />
          </>
        )}
        {expression === "sleepy" && (
          <>
            <path d="M31 56h14" />
            <path d="M55 56h14" />
          </>
        )}
        {expression === "focused" && (
          <>
            <path d="M31 52 45 56 31 60z" fill="var(--mascot-body)" />
            <path d="M69 52 55 56 69 60z" fill="var(--mascot-body)" />
          </>
        )}
      </g>
      {(expression === "idle" || expression === "focused") && (
        <g fill={OUT}>
          <circle cx="38" cy="56" r="2.5" />
          <circle cx="62" cy="56" r="2.5" />
        </g>
      )}

      {/* mouth bar */}
      <g stroke={OUT} strokeWidth="2.5" strokeLinecap="round" fill="none">
        {expression === "idle" && <path d="M40 76h20" opacity="0.7" />}
        {expression === "happy" && <path d="M40 74q10 8 20 0" />}
        {expression === "sleepy" && <path d="M45 76h10" opacity="0.5" />}
        {expression === "goblin" && <path d="M38 74q10 6 24 0" />}
        {expression === "focused" && (
          <>
            <path d="M38 76h24" />
            <path d="M44 72v8" opacity="0.5" />
            <path d="M56 72v8" opacity="0.5" />
          </>
        )}
      </g>
    </svg>
  );
}
