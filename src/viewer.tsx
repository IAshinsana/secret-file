"use client";

import * as React from "react";
import { ShieldCheck, Loader2, Download, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { importKeyFromFragment, decryptText, decryptBytes } from "@/lib/secret-chat/crypto";

type Status = "loading" | "ready" | "revealed" | "gone" | "error";

export function SecretFileViewer({ sessionId }: { sessionId: string }) {
  const [status, setStatus] = React.useState<Status>("loading");
  const [info, setInfo] = React.useState<{ name: string; url: string; mediaKind: string } | null>(null);
  const [errMsg, setErrMsg] = React.useState("");
  const fragRef = React.useRef("");

  React.useEffect(() => {
    const frag = decodeURIComponent(window.location.hash.replace(/^#/, ""));
    if (!frag) { setStatus("error"); setErrMsg("This link is missing the decryption key (the part after #)."); return; }
    fragRef.current = frag;
    (async () => {
      try {
        const meta = await (await fetch(`/api/secret-chat/${sessionId}?since=0`)).json();
        if (!meta.alive) { setStatus("gone"); return; }
        setStatus("ready");
      } catch { setStatus("error"); setErrMsg("Could not reach the server. Please try again."); }
    })();
  }, [sessionId]);

  async function reveal() {
    setStatus("loading");
    try {
      const key = await importKeyFromFragment(fragRef.current);
      const data = await (await fetch(`/api/secret-chat/${sessionId}?since=0`)).json();
      if (!data.alive || !data.messages?.length) { setStatus("gone"); return; }
      const m = data.messages[0];
      const raw = await decryptText(key, m.iv, m.ciphertext);
      const env = JSON.parse(raw) as { m?: { name: string; mediaId: string; mediaKind: string } };
      if (!env.m) throw new Error("not a file");

      const blob = await (await fetch(`/api/secret-chat/${sessionId}/media/${env.m.mediaId}`)).json();
      if (!blob.ok) throw new Error("blob missing");
      const buf = await decryptBytes(key, blob.iv, blob.ciphertext);
      const url = URL.createObjectURL(new Blob([buf]));
      setInfo({ name: env.m.name, url, mediaKind: env.m.mediaKind });
      setStatus("revealed");
      await fetch(`/api/secret-chat/${sessionId}`, { method: "DELETE" }).catch(() => {});
    } catch {
      setStatus("error");
      setErrMsg("Could not decrypt — the link may be wrong, or the file was already downloaded and destroyed.");
    }
  }

  if (status === "loading") {
    return <Box><Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" /><p className="mt-3 text-center text-sm text-muted-foreground">Checking the file…</p></Box>;
  }
  if (status === "gone") {
    return <Box><AlertTriangle className="mx-auto size-6 text-amber-500" /><p className="mt-3 text-center text-sm">This file has been destroyed — already downloaded by someone, or the timer ran out.</p></Box>;
  }
  if (status === "error") {
    return <Box><AlertTriangle className="mx-auto size-6 text-destructive" /><p className="mt-3 text-center text-sm">{errMsg || "Something went wrong."}</p></Box>;
  }
  if (status === "revealed" && info) {
    return (
      <Box>
        <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="size-4" /><span className="font-medium">Decrypted in your browser · now destroyed on our side</span>
        </div>
        {info.mediaKind === "image" && <img src={info.url} alt={info.name} className="mt-4 max-h-96 w-full rounded-lg object-contain" />}
        <a href={info.url} download={info.name} className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          <Download className="size-4" />Download {info.name}
        </a>
        <p className="mt-3 text-xs text-muted-foreground">
          Save it now — closing this page will lose access. It&apos;s already been destroyed on our side.
        </p>
      </Box>
    );
  }

  return (
    <Box>
      <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
        <ShieldCheck className="size-4" /><span className="font-medium">An encrypted file is waiting for you</span>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Someone sent you a one-time file. <strong>The moment you reveal it, it&apos;s destroyed</strong> — make sure
        you save it now.
      </p>
      <Button onClick={reveal} className="mt-4 gap-2"><Download className="size-4" />Reveal &amp; download</Button>
    </Box>
  );
}

function Box({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-xl rounded-2xl border border-border/60 bg-card p-5 md:p-6">{children}</div>;
}
