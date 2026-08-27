import { useLiveQuery } from "dexie-react-hooks";
import { useRef, useState } from "react";
import { Image as ImageIcon, Mic, Paperclip, Plus, Square, Trash2, X, Search } from "lucide-react";
import { useBlobUrl } from "@/hooks/use-blob-url";
import { db, type DiaryAttachment, type DiaryEntry } from "@/lib/db";
import { STICKERS, addEntry, entryDate, parseTags, preview, removeEntry } from "@/lib/diary";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const fieldStyle = { borderColor: "var(--glass-border)", background: "var(--glass)" };

function pill(isPastel: boolean) {
  return cn("border px-3 py-1.5 text-xs transition-colors", isPastel ? "rounded-full" : "rounded-sm");
}

function BlobImage({ blob, className }: { blob: Blob; className?: string }) {
  const url = useBlobUrl(blob);
  const [open, setOpen] = useState(false);
  if (!url) return null;
  return (
    <>
      <img 
        src={url} 
        alt="Diary attachment" 
        loading="lazy" 
        className={cn("cursor-pointer transition-transform hover:scale-[1.02]", className)} 
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
      />
      {open && (
        <div 
          className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm"
          onClick={(e) => { e.stopPropagation(); setOpen(false); }}
        >
          <img src={url} alt="Preview" className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl" />
        </div>
      )}
    </>
  );
}

function BlobAudio({ blob }: { blob: Blob }) {
  const url = useBlobUrl(blob);
  if (!url) return null;
  return <audio controls src={url} className="w-full" onClick={(e) => e.stopPropagation()} />;
}

function BlobFile({ file }: { file: DiaryAttachment }) {
  const url = useBlobUrl(file.blob);
  const [open, setOpen] = useState(false);
  if (!url) return null;
  
  const isImage = file.blob.type.startsWith("image/");

  return (
    <>
      <button 
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className="text-xs underline underline-offset-4 text-left break-all cursor-pointer hover:text-primary transition-colors"
      >
        {file.filename}
      </button>
      {open && (
        <div 
          className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm"
          onClick={(e) => { e.stopPropagation(); setOpen(false); }}
        >
          <div className="flex flex-col gap-4 w-full h-full max-w-5xl items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end w-full max-w-[90vw]">
              <button onClick={() => setOpen(false)} className="rounded-full bg-background p-2 border shadow-sm transition-colors hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>
            {isImage ? (
               <img src={url} alt={file.filename} className="max-h-[80vh] max-w-[90vw] object-contain rounded-lg shadow-2xl" />
            ) : (
               <iframe src={url} title={file.filename} className="w-[90vw] h-[80vh] rounded-lg shadow-2xl bg-white" />
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Composer({ onDone }: { onDone: () => void }) {
  const { isPastel } = useTheme();
  const [text, setText] = useState("");
  const [images, setImages] = useState<Blob[]>([]);
  const [voiceNotes, setVoiceNotes] = useState<Blob[]>([]);
  const [attachments, setAttachments] = useState<DiaryAttachment[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [sticker, setSticker] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function toggleRecording() {
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onstop = () => {
        setVoiceNotes((v) => [...v, new Blob(chunks, { type: rec.mimeType || "audio/webm" })]);
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
    } catch {
      setMicError("Microphone unavailable.");
    }
  }

  function commitTag() {
    const next = parseTags(tagDraft);
    if (next.length) setTags((t) => Array.from(new Set([...t, ...next])));
    setTagDraft("");
  }

  const empty =
    !text.trim() && images.length === 0 && voiceNotes.length === 0 && attachments.length === 0;

  return (
    <div className="glass-panel flex flex-col gap-4 p-5">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What happened?"
        rows={4}
        className={cn("border px-3 py-2 text-sm", isPastel ? "rounded-2xl" : "rounded-sm")}
        style={fieldStyle}
      />

      <div className="flex flex-wrap gap-2">
        <button type="button" className={pill(isPastel)} style={fieldStyle} onClick={() => imageInput.current?.click()}>
          <span className="flex items-center gap-1">
            <ImageIcon className="h-3 w-3" /> image
          </span>
        </button>
        <button
          type="button"
          className={pill(isPastel)}
          style={{
            ...fieldStyle,
            borderColor: recording ? "var(--destructive)" : "var(--glass-border)",
            color: recording ? "var(--destructive)" : undefined,
          }}
          onClick={() => void toggleRecording()}
        >
          <span className="flex items-center gap-1">
            {recording ? <Square className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
            {recording ? "stop" : "voice note"}
          </span>
        </button>
        <button type="button" className={pill(isPastel)} style={fieldStyle} onClick={() => fileInput.current?.click()}>
          <span className="flex items-center gap-1">
            <Paperclip className="h-3 w-3" /> file
          </span>
        </button>
        <input
          ref={imageInput}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            setImages((v) => [...v, ...Array.from(e.target.files ?? [])]);
            e.target.value = "";
          }}
        />
        <input
          ref={fileInput}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            setAttachments((v) => [
              ...v,
              ...Array.from(e.target.files ?? []).map((f) => ({ blob: f as Blob, filename: f.name })),
            ]);
            e.target.value = "";
          }}
        />
      </div>

      {micError && <p className="text-xs text-muted-foreground">{micError}</p>}

      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((b, i) => (
            <div key={i} className="relative">
              <BlobImage
                blob={b}
                className={cn("h-16 w-16 object-cover", isPastel ? "rounded-2xl" : "rounded-sm")}
              />
              <button
                type="button"
                aria-label="Remove image"
                onClick={() => setImages((v) => v.filter((_, j) => j !== i))}
                className="absolute -right-1 -top-1 rounded-full bg-background/80 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {voiceNotes.map((b, i) => (
        <BlobAudio key={i} blob={b} />
      ))}

      {attachments.length > 0 && (
        <ul className="flex flex-col gap-1">
          {attachments.map((f, i) => (
            <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
              <Paperclip className="h-3 w-3" /> {f.filename}
              <button
                type="button"
                aria-label={`Remove ${f.filename}`}
                onClick={() => setAttachments((v) => v.filter((_, j) => j !== i))}
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {tags.map((t) => (
          <button
            key={t}
            type="button"
            className={pill(isPastel)}
            style={fieldStyle}
            onClick={() => setTags((v) => v.filter((x) => x !== t))}
          >
            #{t} ×
          </button>
        ))}
        <input
          value={tagDraft}
          onChange={(e) => setTagDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commitTag();
            }
          }}
          onBlur={commitTag}
          placeholder="tags"
          className={cn("border px-3 py-1.5 text-xs", isPastel ? "rounded-full" : "rounded-sm")}
          style={fieldStyle}
        />
      </div>

      <div className="flex flex-wrap gap-1">
        {STICKERS.map((s) => (
          <button
            key={s}
            type="button"
            aria-label={`Sticker ${s}`}
            onClick={() => setSticker((cur) => (cur === s ? null : s))}
            className={cn(
              "border px-2 py-1 text-base transition-colors",
              isPastel ? "rounded-full" : "rounded-sm",
            )}
            style={{
              borderColor: sticker === s ? "var(--primary)" : "transparent",
              background: sticker === s ? "var(--glass)" : "transparent",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          className={pill(isPastel)}
          style={{ borderColor: "var(--primary)", background: "var(--glass)", color: "var(--primary)" }}
          onClick={async () => {
            if (empty) return;
            await addEntry({ text: text.trim(), images, voiceNotes, attachments, tags, sticker });
            onDone();
          }}
        >
          Save entry
        </button>
        <button type="button" className={pill(isPastel)} style={fieldStyle} onClick={onDone}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function EntryDetail({ entry, onClose }: { entry: DiaryEntry; onClose: () => void }) {
  const { isPastel } = useTheme();
  
  const imageAttachments = entry.attachments.filter(a => a.blob.type.startsWith("image/"));
  const otherAttachments = entry.attachments.filter(a => !a.blob.type.startsWith("image/"));
  const allImages = [...entry.images, ...imageAttachments.map(a => a.blob)];

  return (
    <div className="glass-panel flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">{entryDate(entry.timestamp)}</p>
          {entry.sticker && <p className="mt-1 text-2xl">{entry.sticker}</p>}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Delete entry"
            onClick={async () => {
              await removeEntry(entry.id);
              onClose();
            }}
            className="opacity-40 transition-opacity hover:opacity-90"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button type="button" aria-label="Close entry" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {entry.text && <p className="whitespace-pre-wrap text-sm">{entry.text}</p>}

      {allImages.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {allImages.map((b, i) => (
            <BlobImage
              key={i}
              blob={b}
              className={cn("max-h-64 object-contain", isPastel ? "rounded-2xl" : "rounded-sm")}
            />
          ))}
        </div>
      )}

      {entry.voiceNotes.map((b, i) => (
        <BlobAudio key={i} blob={b} />
      ))}

      {otherAttachments.length > 0 && (
        <ul className="flex flex-col gap-1">
          {otherAttachments.map((f, i) => (
            <li key={i} className="flex items-center gap-2">
              <Paperclip className="h-3 w-3" />
              <BlobFile file={f} />
            </li>
          ))}
        </ul>
      )}

      {entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {entry.tags.map((t) => (
            <span key={t} className={pill(isPastel)} style={fieldStyle}>
              #{t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
export function Diary() {
  const { theme, isPastel } = useTheme();
  const [composing, setComposing] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  
  const entries = useLiveQuery(() => db.diaryEntries.orderBy("timestamp").reverse().toArray(), [], []);
  const allEntries = entries ?? [];
  const list = allEntries.filter((e) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    
    if (e.sticker && e.sticker.toLowerCase().includes(q)) return true;
    if (e.tags.some(t => t.toLowerCase().includes(q))) return true;
    
    const dStr = entryDate(e.timestamp).toLowerCase();
    if (dStr.includes(q)) return true;
    
    return false;
  });
  
  const open = allEntries.find((e) => e.id === openId) ?? null;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {allEntries.length} {allEntries.length === 1 ? "entry" : "entries"}
          </p>
          <button
            type="button"
            className={pill(isPastel)}
            style={fieldStyle}
            onClick={() => setComposing((v) => !v)}
          >
            <span className="flex items-center gap-1">
              <Plus className="h-3 w-3" /> entry
            </span>
          </button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input 
            type="text"
            placeholder="Search tags, emojis, dates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(
              "w-full border py-2 pl-9 pr-3 text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-primary",
              isPastel ? "rounded-full" : "rounded-sm"
            )}
            style={fieldStyle}
          />
        </div>
      </div>

      {composing && <Composer onDone={() => setComposing(false)} />}
      {open && <EntryDetail entry={open} onClose={() => setOpenId(null)} />}

      {list.length === 0 ? (
        <div className="glass-panel p-5">
          <p className="text-sm text-muted-foreground">
            {theme === "pastel" ? "No pages written yet." : "Log empty. Nothing recorded."}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {list.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => setOpenId((cur) => (cur === e.id ? null : e.id))}
                className={cn(
                  "flex w-full items-center gap-3 border p-3 text-left",
                  isPastel ? "rounded-2xl" : "rounded-sm",
                )}
                style={fieldStyle}
              >
                {e.images[0] && (
                  <BlobImage
                    blob={e.images[0]}
                    className={cn("h-10 w-10 shrink-0 object-cover", isPastel ? "rounded-xl" : "rounded-sm")}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">
                    {entryDate(e.timestamp)}
                    {e.sticker ? ` · ${e.sticker}` : ""}
                  </p>
                  <p className="truncate text-sm">
                    {preview(e.text) || (e.voiceNotes.length > 0 ? "Voice note" : "Media only")}
                  </p>
                  {e.tags.length > 0 && (
                    <p className="mt-1 truncate text-[11px] text-muted-foreground">
                      {e.tags.map((t) => `#${t}`).join(" ")}
                    </p>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
