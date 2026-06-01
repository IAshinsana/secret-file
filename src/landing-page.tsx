import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CalendarDays, ChevronRight, ExternalLink } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { FacetMark } from "@/components/marketing/facet-mark";
import { ToolCard } from "@/components/marketing/tool-card";
import { disabledSlugs } from "@/lib/admin/store";
import { pageMeta } from "@/lib/seo";
import { jsonLd, softwareAppSchema, faqSchema, breadcrumbSchema, howToSchema } from "@/lib/schema";
import { SITE, AUTHOR } from "@/lib/site";
import { getToolBySlug, TOOLS } from "@/lib/data/tools";
import { SecretFileComposer } from "@/components/secret-file/composer";

const SLUG = "secret-file";
const tool = getToolBySlug(SLUG)!;
const TOOL_URL = `${SITE.url}${tool.href}`;

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMeta({
  title: "Send a Self-Destructing File — Encrypted Anonymous File Share (No Signup)",
  description:
    "Upload any file up to 3 MB, get a one-time link to share, and the file is end-to-end encrypted in your browser before it ever leaves. Recipients download once and the encrypted blob is destroyed. A free, no-signup, no-account alternative to WeTransfer for sending one private file.",
  path: tool.href,
  keywords: tool.keywords,
  publishedAt: tool.publishedAt,
  updatedAt: tool.updatedAt,
});

const FAQ = [
  {
    question: "Is the file really only downloadable once?",
    answer:
      "Yes. The moment the recipient hits Reveal, the file is decrypted in their browser, the download starts, and we immediately delete the encrypted blob server-side. Anyone opening the same link afterwards sees \"this file has been destroyed\". Save it before closing the tab — that's the only chance.",
  },
  {
    question: "Can induwara.lk read the file or know what it is?",
    answer:
      "No. The encryption key is generated in your browser and lives only in the URL fragment (the part after #), which browsers never transmit to a server. We receive and store opaque ciphertext we have no key for. We never see the file name, contents, MIME type after decryption, or anything readable.",
  },
  {
    question: "What's the file size limit and why?",
    answer:
      "3 MB per file. The limit exists because the file is encrypted client-side and uploaded in a single request — bigger files would time out on slow mobile connections, and we'd need to add chunking/resume logic that introduces complexity (and abuse surface). For typical use-cases — a confidential PDF, a screenshot, a config file — 3 MB is enough.",
  },
  {
    question: "What file types can I send?",
    answer:
      "Any. Images, PDFs, ZIPs, documents, text files, code, anything. The encryption is bytes-in, bytes-out — we don't inspect or restrict types. Images get an inline preview on the recipient page; everything else is a download button.",
  },
  {
    question: "How long does it sit before auto-destruct?",
    answer:
      "Whatever timer you picked: 1 hour, 24 hours, or 1 week. The server enforces it — even if no one ever opens the link, the encrypted blob is permanently deleted when the window closes. Combined with the read-once behaviour, your file never lingers indefinitely.",
  },
  {
    question: "How is this different from WeTransfer, Firefox Send, or Dropbox Transfer?",
    answer:
      "Same outcome — share one file via a link — but with two important differences. First, no signup, no email-collection, no account. Second, the encryption happens in YOUR browser before the upload, with a key we never see. WeTransfer holds your file in plaintext on their servers; we can't read it even with a subpoena because we don't have the key. Closest equivalent in spirit was Firefox Send (now discontinued); this is a free, working alternative.",
  },
  {
    question: "Can I send a password or just text instead?",
    answer:
      "Yes — use our companion tool, \"Send a One-Time Secret\", which is optimised for text (passwords, API keys, notes). Same encryption model, no file overhead.",
  },
  {
    question: "What if my upload gets interrupted?",
    answer:
      "Nothing bad happens — the partial upload is discarded server-side and you'll see an error in the composer. Just retry. The recipient never gets a partial file; either the whole encrypted blob is on the server or it isn't.",
  },
];

export default function SecretFilePage() {
  if (disabledSlugs().has(SLUG)) notFound();

  const breadcrumbs = breadcrumbSchema([
    { name: "Home", url: SITE.url },
    { name: "Tools", url: `${SITE.url}/tools` },
    { name: tool.shortTitle, url: TOOL_URL },
  ]);
  const softwareApp = softwareAppSchema({
    name: tool.title, description: tool.description, url: TOOL_URL, category: "SecurityApplication", keywords: tool.keywords,
  });
  const faq = faqSchema(FAQ);
  const relatedSlugs = new Set(["one-time-secret", "secret-chat", "qr-code-generator"]);
  const relatedTools = TOOLS.filter((t) => relatedSlugs.has(t.slug)).slice(0, 3);
  const howTo = howToSchema({
    name: "How to send a self-destructing file",
    description: "Encrypt a file in your browser, share the one-time link, and have it destroyed after one download.",
    url: TOOL_URL,
    steps: [
      { name: "Choose a file", text: "Click to pick any file up to 3 MB." },
      { name: "Pick a timer", text: "Choose how long it can sit undownloaded (1 hour to 1 week)." },
      { name: "Create the link", text: "Your browser encrypts the file bytes; the server only ever sees ciphertext. Copy the resulting link." },
      { name: "Send & destroy on download", text: "Share the link with one person. They download once, then the file is permanently destroyed." },
    ],
  });

  return (
    <article className="mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbs) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(softwareApp) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faq) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(howTo) }} />

      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/" className="hover:text-foreground">Home</Link></li>
          <ChevronRight className="size-3.5" aria-hidden="true" />
          <li><Link href="/tools" className="hover:text-foreground">Tools</Link></li>
          <ChevronRight className="size-3.5" aria-hidden="true" />
          <li className="font-medium text-foreground">{tool.shortTitle}</li>
        </ol>
      </nav>

      <header className="mt-6">
        <div className="flex items-center gap-2 text-sm text-primary">
          <FacetMark size={16} />
          <span className="font-medium uppercase tracking-wider">End-to-end encrypted · Read-once</span>
        </div>
        <h1 className="heading-display mt-3 text-balance text-3xl md:text-5xl">
          Send a self-destructing file — encrypted, no signup
        </h1>
        <p className="mt-4 max-w-3xl text-pretty text-lg text-muted-foreground md:text-xl">
          Upload any file up to 3 MB, get a one-time link, and the file is encrypted in your browser before it ever
          leaves. The recipient downloads once; the encrypted blob is destroyed. We never see the file, the key, or
          the contents. Free, no account, no email.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <span>By <Link href="/about" className="font-medium text-foreground hover:underline">{AUTHOR.name}</Link></span>
          {tool.updatedAt && (
            <span className="flex items-center gap-1"><CalendarDays className="size-3.5" />Updated {new Date(tool.updatedAt).toLocaleDateString("en-LK", { year: "numeric", month: "short", day: "numeric" })}</span>
          )}
        </div>
      </header>

      <div className="mt-8 max-w-xl"><SecretFileComposer /></div>

      <Section heading="How it works">
        <p>
          When you choose a file and click <em>Create one-time file link</em>, your browser generates a random AES-256
          key with the native Web Crypto API and places it in the part of the URL after the <code className="rounded bg-muted px-1 py-0.5 font-mono text-sm">#</code> — the
          URL <em>fragment</em>, which browsers <strong>never transmit to any server</strong>. The file&apos;s bytes
          are encrypted locally with that key before they leave your device, so what reaches our server is opaque
          ciphertext we have no way to decrypt.
        </p>
        <p>
          The link you share has two parts: the session identifier (which we know) and the decryption key (which
          only you and the recipient know, because it&apos;s in the fragment). When they open it, their browser
          downloads the encrypted blob, uses the key from their URL to decrypt it locally, and offers the file as
          a download. At the same moment, we receive a destroy signal and permanently delete the encrypted blob
          server-side. No log keeps it. No backup.
        </p>
        <p>
          That gives you two layers of protection. <strong>Read-once</strong> means even if someone later finds the
          link in a chat history, opening it shows nothing — the blob is gone. The <strong>server-enforced timer</strong> means
          if no one downloads the file, it still self-destructs after the window you picked. Because we never have
          the key, there is no point at which a readable copy of your file exists on our side.
        </p>
        <p>
          The one rule: <strong>the link is the key</strong>. Anyone who gets the full URL can download the file once.
          Send it over a channel that&apos;s at least somewhat private and prefer the shortest timer that works.
        </p>
      </Section>

      <Section heading="When this is the right tool">
        <ul className="mt-2 space-y-2">
          <li><strong>Sharing a confidential PDF with a lawyer, accountant, or client</strong> — without leaving it in your email forever.</li>
          <li><strong>Sending a screenshot containing sensitive info</strong> (an invoice, a private message, ID details) without it sitting in chat history.</li>
          <li><strong>Handing over a config file, certificate, or key file</strong> to a teammate or contractor.</li>
          <li><strong>One-time delivery of a design draft, contract, or document</strong> you don&apos;t want forwarded.</li>
          <li><strong>Replacing email attachments</strong> when the file is sensitive — your inbox keeps it forever; this doesn&apos;t.</li>
        </ul>
      </Section>

      <Section heading="Frequently asked questions">
        <Accordion className="w-full">
          {FAQ.map((item) => (
            <AccordionItem key={item.question} value={item.question}>
              <AccordionTrigger className="text-left">{item.question}</AccordionTrigger>
              <AccordionContent className="text-base leading-relaxed text-muted-foreground">{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Section>

      <Section heading="Related tools">
        <div className="grid gap-4 md:grid-cols-3">
          {relatedTools.map((t) => <ToolCard key={t.slug} tool={t} />)}
        </div>
      </Section>

      <Section heading="Sources & references">
        <ul className="space-y-2 text-base">
          <li><a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-foreground hover:underline">MDN — Web Crypto API (AES-GCM-256)<ExternalLink className="size-3.5 text-muted-foreground" /></a></li>
          <li><a href="https://developer.mozilla.org/en-US/docs/Web/API/URL/hash" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-foreground hover:underline">MDN — URL fragment (#hash) never sent to servers<ExternalLink className="size-3.5 text-muted-foreground" /></a></li>
        </ul>
        <p className="mt-4 text-sm text-muted-foreground">File contents are encrypted with AES-GCM-256 via the browser&apos;s native Web Crypto API; the key lives only in the URL fragment.</p>
      </Section>

      <div className="mt-16 rounded-2xl border border-border/60 bg-muted/30 p-6 text-center md:p-8">
        <p className="text-sm text-muted-foreground">Questions or a bug to report?</p>
        <p className="mt-1 font-medium">Email <a href={`mailto:${AUTHOR.email}`} className="text-primary hover:underline">{AUTHOR.email}</a>.</p>
      </div>
    </article>
  );
}

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="mt-12 md:mt-16">
      <h2 className="heading-section text-2xl md:text-3xl">{heading}</h2>
      <Separator className="my-4" />
      <div className="space-y-4 text-base leading-relaxed text-foreground/90">{children}</div>
    </section>
  );
}
