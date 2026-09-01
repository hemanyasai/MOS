import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Trash2, PawPrint } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { usePersonalityEmptyState } from "@/hooks/use-personality";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const fieldStyle = { borderColor: "var(--glass-border)", background: "var(--glass)" };

function stamp(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Tiny scattered tilts for the pastel "messy pile" feel. */
const TILTS = ["-0.8deg", "0.6deg", "-0.4deg", "1deg", "0.3deg"];

export function BrainDump() {
  const { theme, isPastel } = useTheme();
  const [text, setText] = useState("");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notes } = useQuery({
    queryKey: ["notes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async (body: string) => {
      if (!user) return;
      const { error } = await supabase.from("notes").insert([
        { user_id: user.id, body, created_at: Date.now() }
      ]);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notes"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notes"] }),
  });

  const list = notes ?? [];

  const add = async () => {
    const body = text.trim();
    if (!body) return;
    setText("");
    await addMutation.mutateAsync(body);
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="glass-panel flex items-center gap-2 p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void add();
            }
          }}
          placeholder={isPastel ? "dump it here…" : "> log entry"}
          className={cn(
            "min-w-0 flex-1 border px-3 py-2 text-sm",
            isPastel ? "rounded-2xl" : "rounded-sm font-mono",
          )}
          style={fieldStyle}
        />
        <button
          type="button"
          onClick={() => void add()}
          className={cn(
            "shrink-0 border px-3 py-2 text-xs",
            isPastel ? "rounded-full" : "rounded-sm uppercase tracking-[0.18em]",
          )}
          style={{ borderColor: "var(--primary)", background: "var(--glass)", color: "var(--primary)" }}
        >
          {isPastel ? "toss it in" : "add"}
        </button>
      </div>

      {list.length === 0 ? (
        <div className="glass-panel grid min-h-[30vh] place-items-center p-10 text-center">
          <p className="text-display text-lg">
            {isPastel ? "Nothing here yet" : "No signal here yet"}
          </p>
        </div>
      ) : (
        <ul className={cn("flex flex-col", isPastel ? "gap-3" : "gap-1.5")}>
          {list.map((n, i) => (
            <li
              key={n.id}
              className={cn(
                "flex items-start gap-3 border p-3",
                isPastel ? "rounded-2xl" : "rounded-sm",
              )}
              style={{
                ...fieldStyle,
                ...(isPastel ? { transform: `rotate(${TILTS[i % TILTS.length]})` } : {}),
              }}
            >
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-[10px] uppercase tracking-[0.18em] text-muted-foreground",
                    !isPastel && "font-mono tracking-normal",
                  )}
                >
                  {stamp(n.created_at)}
                </p>
                <p className={cn("mt-1 break-words text-sm", !isPastel && "font-mono")}>{n.body}</p>
              </div>
              <button
                type="button"
                aria-label="Delete note"
                onClick={() => deleteMutation.mutate(n.id)}
                className="shrink-0 opacity-40 transition-opacity hover:opacity-90"
              >
                {isPastel ? <PawPrint className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-muted-foreground">
        {theme === "pastel"
          ? "Shake your phone anywhere in MOS to land back here."
          : "Shake gesture opens this buffer from any sector."}
      </p>
    </section>
  );
}
