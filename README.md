# KosHub OS v2 — Multi-Page SaaS (Vercel)

Platform SaaS prosedural & modular untuk mengelola kos: **AI kas parser**, **split bill real-time**, **dapur tracker**, **rotasi piket**, **multi-tenant Kos ID**. Tanpa database server — LocalStorage-first (`koshub_db_v2`), AI via serverless proxy.

## Arsitektur Sistem

```text
Browser (HP/desktop)
 ├── index.html          → public landing (route /, file statis)
 ├── app.html            → overview workspace (route /app)
 ├── finance.html        → kas & split bill (route /finance)
 ├── inventory.html      → kulkas & dapur (route /inventory)
 ├── schedule.html       → piket (route /schedule)
 ├── settings.html       → key + tenant + backup (route /settings)
 ├── public/js/state.js      → store terpusat, event koshub:update
 ├── public/js/ai-client.js  → parser AI + fallback offline
 ├── public/js/components.js → sidebar/drawer, topbar, spotlight Ctrl+K
 └── public/css/app.css       → theme pelengkap Tailwind
        │ POST /api/bynara {model, messages} + Authorization: Bearer <key>
        ▼
Vercel Serverless (api/bynara.js) ──forward──▶ https://router.bynara.id/v1/chat/completions
                                                   model: agnes-2.5-flash
```

**Kenapa proxy?** Browser tidak bisa `fetch` langsung ke NaraRouter tanpa isu CORS, dan key tidak boleh hardcode di HTML. Proxy meneruskan `Authorization` dari request (atau `env BYNARA_API_KEY`), mengembalikan JSON upstream apa adanya.

## Struktur Folder

```text
api/
  bynara.js          # serverless proxy NaraRouter (Node.js)
public/
  js/state.js        # KosHub global: tenant, CRUD, balance, settle, backup
  js/ai-client.js    # KosAI global: parse/apply/testConnection
  js/components.js   # KosUI global: chrome + spotlight + toast
  css/app.css        # card, nav-link, field, animasi
index.html app.html finance.html inventory.html schedule.html settings.html
vercel.json          # cleanUrls + rewrites rute bersih (root / dilayani index.html statis)
.gitignore
README.md
```

## Deploy ke Vercel

```bash
# 1. Push repo ini ke GitHub (sudah di main)
# 2. Vercel → Add New Project → import repo → Deploy (tanpa setting tambahan)
# 3. (Opsional) tambah env BYNARA_API_KEY di Project Settings → Environment Variables
#    →Redeploy. Jika diisi, semua penghuni bisa pakai AI tanpa input key manual.
```

Rute bersih aktif otomatis: `/` `→ landing`, `/app` `→ overview`, `/finance`, `/inventory`, `/schedule`, `/settings`.

Jalankan lokal:

```bash
npx vercel dev
# atau preview statis: npx serve .   (halaman jalan, hanya /api/bynara butuh vercel dev)
```

## Panduan Penggunaan

1. **Buka `/app`** — data demo langsung tampil (LocalStorage).
2. **Spotlight AI (`Ctrl+K` / `Cmd+K`, di halaman mana pun)** — ketik bebas:
   - `Adril beli telur 1kg 28rb ditalangin sendiri` → expense tercatat
   - `Minyak goreng sisa 0, beli baru 32rb oleh Budi` → stok + kas
   - `Bayar iuran sampah 15rb ditalangin Citra` → expense tercatat

   Skema ekstraksi: `{type: "expense"|"inventory", title, amount, by, qty}`.
   Tanpa API key → parser regex offline tetap jalan.
3. **`/settings`** — paste `BYNARA_API_KEY` → *Uji Koneksi* (menghubungi `POST /api/bynara`). Key hanya di `localStorage`.
4. **Multi-kos** — buat/switch/join Kos ID di `/settings`. Samakan ID di semua HP penghuni untuk konteks yang sama. Backup via Export/Import `.json`.
5. **Split bill** — `/finance` menampilkan balance patungan rata + saran transfer greedy (siapa bayar siapa).

## Lisensi

MIT — bebas dipakai kos mana pun. 🍳
