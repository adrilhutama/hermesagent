#!/bin/bash
set -e

# Buat direktori ~/.hermes jika belum ada
mkdir -p /root/.hermes

# Buat ~/.hermes/config.yaml
cat << 'EOF' > /root/.hermes/config.yaml
custom_providers:
  - name: bynara
    base_url: https://router.bynara.id/v1
    key_env: BYNARA_API_KEY

model:
  default: agnes-2.5-flash
  provider: custom:bynara
EOF

# Buat ~/.hermes/.env
cat << EOF > /root/.hermes/.env
BYNARA_API_KEY=${BYNARA_API_KEY}
TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
TELEGRAM_ALLOWED_USERS=${TELEGRAM_ALLOWED_USERS}
EOF

chmod 600 /root/.hermes/.env

echo "Konfigurasi NaraRouter siap. Menjalankan Hermes Gateway..."

# Eksekusi gateway di foreground (bukan systemctl) agar container tidak exit
exec hermes gateway start
