# Hermes Agent — Docker Deployment

Repository ini berisi container **Hermes Agent (Nous Research)** yang siap di-deploy ke cloud / PaaS seperti **Render**.

## Isi Repository

| File | Fungsi |
|------|--------|
| `Dockerfile` | Image berbasis Ubuntu 22.04, install Hermes Agent headless (`--skip-browser`), expose port `8080` |
| `entrypoint.sh` | Entrypoint container, menjalankan `hermes gateway start` |
| `.gitignore` | Mengecualikan `.env`, log, cache Python, dsb. |

## Menjalankan Secara Lokal

```bash
docker build -t hermes-agent .
docker run -p 8080:8080 hermes-agent
```

## Deploy ke Render

1. Hubungkan repository GitHub ini ke Render sebagai **Web Service** (Docker).
2. Pastikan port service diset ke **8080**.
3. Jika Hermes membutuhkan API key / token, tambahkan sebagai **Environment Variable** di dashboard Render (jangan commit file `.env`).
4. Deploy — Render akan build dari `Dockerfile` dan menjalankan gateway via `entrypoint.sh`.

## Catatan

- Mode instalasi `--skip-browser` membuat image ringan dan cocok untuk free tier cloud.
- Gateway berjalan di port `8080` sesuai `EXPOSE` pada Dockerfile.
