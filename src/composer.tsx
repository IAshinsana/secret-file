"use client";

import * as React from "react";
import { Loader2, ShieldCheck, Copy, Check, RotateCcw, Lock, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateKey, encryptText, encryptBytes } from "@/lib/secret-chat/crypto";

const MAX_SIZE = 3 * 1024 * 1024;
const EXPIRIES = [
  { v: "1h", label: "1 hour" },
  { v: "24h", label: "24 hours" },
  { v: "7d", label: "1 week" },
] as const;

export function SecretFileComposer() {
  const [file, setFile] = React.useState<File | null>(null);
  const [expiry, setExpiry] = React.useState("24h");
  const [busy, setBusy] = React.useState(false);
  const [link, setLink] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const [error, setError] = React.useState("");
  const fileRef = React.useRef<HTMLInputElement>(null);

  async function create() {
    if (!file) return;
    if (file.size > MAX_SIZE) { setError("Files must be 3 MB or smaller."); return; }
    setBusy(true); setError("");
    try {
      const { key, fragment } = await generateKey();
      const created = await (await fetch("/api/secret-chat/create", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expiry, mode: "direct" }),
      })).json();
      if (!created.ok) throw new Error(created.error || "Could not create the share.");

      const joined = await (await fetch(`/api/secret-chat/${created.id}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join" }),
      })).json();
      if (!joined.ok) throw new Error(joined.error || "Could not initialise the session.");

      const enc = await encryptBytes(key, await file.arrayBuffer());
      const isImage = file.type.startsWith("image/");
      const up = await (await fetch(`/api/secret-chat/${created.id}/media`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ iv: enc.iv, ciphertext: enc.ct, mime: isImage ? "image" : "file" }),
      })).json();
      if (!up.ok) throw new Error(up.error || "Upload failed.");

      const media = { name: file.name, mime: file.type, mediaKind: isImage ? "image" : "file", mediaId: up.mediaId };
      const env = JSON.stringify({ k: "media", m: media });
      const { iv, ct } = await encryptText(key, env);
      const sent = await (await fetch(`/api/secret-chat/${created.id}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", sender: joined.participant, kind: "media", iv, ciphertext: ct, mediaId: up.mediaId }),
      })).json();
      if (!sent.ok) throw new Error(sent.error || "Send failed.");

      setLink(`${window.location.origin}/tools/secret-file/${created.id}#${fragment}`);
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (e) { setError(e instanceof Error ? e.message : "Network error — please try again."); }
    finally { setBusy(false); }
  }

  function copy() {
    navigator.clipboard.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  if (link) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 md:p-6">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <Check className="size-4" /><span className="text-sm font-medium">File encrypted &amp; uploaded — share this link</span>
        </div>
        <p className="mt-3 break-all rounded-lg bg-background px-3 py-2 font-mono text-xs">{link}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={copy} size="sm" variant="outline" className="gap-1.5">
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Copied!" : "Copy link"}
          </Button>
          <Button onClick={() => { setLink(""); setCopied(false); setError(""); }} size="sm" variant="ghost" className="gap-1.5">
            <RotateCcw className="size-3.5" />Send another
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          The link includes the decryption key (after the <code className="font-mono">#</code>). Send it only to the
          person who should receive the file. The file is destroyed after they download it.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 md:p-6">
      <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
        <ShieldCheck className="size-4" />
        <span className="font-medium">End-to-end encrypted in your browser · 3 MB max</span>
      </div>
      <input ref={fileRef} type="file" className="hidden" onChange={(e) => { setFile(e.target.files?.[0] ?? null); setError(""); }} />
      <button
        onClick={() => fileRef.current?.click()}
        className="mt-4 flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border/60 bg-background px-4 py-8 text-center transition-colors hover:bg-muted/50"
      >
        <Upload className="size-6 text-muted-foreground" />
        <span className="text-sm font-medium">{file ? file.name : "Click to choose a file"}</span>
        {file
          ? <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB · {file.type || "unknown type"}</span>
          : <span className="text-xs text-muted-foreground">Any file up to 3 MB</span>}
      </button>
      <div className="mt-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Auto-destruct after</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {EXPIRIES.map((e) => (
            <button
              key={e.v}
              onClick={() => setExpiry(e.v)}
              className={
                "rounded-full border px-3 py-1 text-sm " +
                (expiry === e.v ? "border-primary bg-primary/10 text-primary" : "border-border/60 hover:bg-muted/60")
              }
            >
              {e.label}
            </button>
          ))}
        </div>
      </div>
      <Button onClick={create} disabled={busy || !file} className="mt-5 gap-2">
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
        Create one-time file link
      </Button>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
