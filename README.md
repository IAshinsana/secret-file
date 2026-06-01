# Secret File — Self-Destructing Encrypted File Share

> Reference implementation. Live: **https://induwara.lk/tools/secret-file**

Upload a file up to 3 MB, get a one-time link. The file is **end-to-end
encrypted in your browser** before it ever leaves. The recipient downloads
once; the encrypted blob is destroyed server-side. We never see the file,
the key, or the contents.

## Versus WeTransfer / Firefox Send / Dropbox Transfer

Two big differences:

1. **No signup, no email collection, no inbox notification.** Just a link.
2. **Encryption happens in your browser** with a key our server never sees.
   WeTransfer holds your file in plaintext on their servers. We can't read
   it, even with a subpoena, because we don't have the key.

Closest spirit-equivalent was Firefox Send (now discontinued). This is a
free working alternative.

## How it works

1. Your browser reads the file → generates an AES-256 key → encrypts bytes
   locally → uploads ciphertext + IV.
2. The key goes in the URL fragment (`#`), never sent to the server.
3. Recipient opens the link → browser fetches the ciphertext → decrypts with
   the key from the URL → triggers download → sends destroy signal.

## Limits

- **3 MB per file.** Larger needs chunking + resumable upload (more abuse
  surface). For a one-off PDF, screenshot, or config file, 3 MB is plenty.
- **Any file type.** No restriction. Images get an inline preview; everything
  else is a download button.
- **TTL configurable** (1 h / 24 h / 1 week). Server-enforced — even if no
  one downloads, the file is wiped after the window closes.

## Key files

- `src/composer.tsx` — File picker + encryption + upload
- `src/viewer.tsx` — Decryption + download + auto-destroy

Reuses the same session backend as [secret-chat](https://github.com/IAshinsana/secret-chat).

## Use it

Live: [induwara.lk/tools/secret-file](https://induwara.lk/tools/secret-file)

## Reuse

MIT licensed.
