# KosHub OS — Dashboard Anak Kos (Zero-Cost SaaS)

Single-file **production-ready SPA** tanpa backend server. 100% berjalan di browser HP maupun desktop, optimal untuk **Hugging Face Static Space (Free Tier)**. Terintegrasi **NaraRouter AI** (`agnes-2.5-flash`) untuk pencatatan bahasa natural + **Supabase JS Client** untuk sinkronisasi cloud gratis.

## Fitur

| Tab | Isi |
|-----|-----|
| **Overview** | KPI: Total Kas Bulan Ini, Item Dapur Kritis (stok ≤ 1), Piket Hari Ini + grafik 14 hari + transaksi terakhir |
| **Kas & Split Bill** | Mutasi, nominal, siapa menalangi, balance utang-piutang otomatis (patungan rata), grafik harian + proporsi |
| **Inventaris Dapur** | Status stok, badge KRITIS otomatis jika qty ≤ 1, tombol +/− instan |
| **Jadwal Piket** | Checklist rotasi harian/mingguan, reset harian |
| **Konfigurasi** | Input BYNARA_API_KEY, Supabase URL + Anon Key, Export/Import JSON |

### Command Bar AI (Spotlight style)

Ketik bebas, misal:

- `Adril beli telur 1kg 28rb ditalangin sendiri`
- `Minyak goreng sisa 0, beli baru 32rb oleh Budi`
- `Bayar iuran sampah 15rb ditalangin Citra`

Aplikasi `fetch POST` langsung ke `https://router.bynara.id/v1/chat/completions` (model `agnes-2.5-flash`), mengekstrak JSON murni (tanpa markdown) dengan skema:

```json
{ "type": "expense|inventory", "title": "string", "amount": "number", "by": "string", "qty": "number" }
```

Hasil otomatis tersimpan ke **LocalStorage** (dan ke Supabase bila key aktif). **Tanpa API key pun tetap jalan** via parser lokal fallback.

## Tech — Zero Build Tooling (CDN)

- Tailwind CSS v3, Chart.js 4, Lucide Icons, `@supabase/supabase-js` v2
- Dark theme SaaS (slate-950/zinc-900, border zinc-800, aksen sky-500/emerald-400), font Plus Jakarta Sans
- Data: LocalStorage-first (`koshub_db_v1`), Supabase opsional (tabel `expenses`, `inventory`, `chores`)

## Deploy ke Hugging Face Static Space (gratis)

1. Buat Space baru → pilih tipe **Static**.
2. Upload **hanya** `index.html` (cukup 1 file, tanpa build/docker).
3. Selesai — aplikasi langsung live di `https://<user>-<space>.hf.space`.

Tidak ada Dockerfile / backend / env server. Semua config via UI web.

## Konfigurasi via Web (tab Konfigurasi)

1. **BYNARA_API_KEY**: paste key dari Bynara → *Simpan Key* → *Tes Koneksi AI*. Key hanya tersimpan di `localStorage` browser, dikirim hanya ke `router.bynara.id`.
2. **Supabase** (opsional): buat project gratis di supabase.com → buat tabel `expenses`, `inventory`, `chores` → paste URL + anon key → *Simpan & Sync*.
3. **Backup**: *Export JSON* / *Import JSON* kapan saja.

## Struktur Repo

```text
index.html   # seluruh aplikasi (HTML+CSS+JS single-file)
README.md    # dokumentasi ini
.gitignore
```

## Lisensi

MIT — bebas dipakai kos mana pun. 🍳
