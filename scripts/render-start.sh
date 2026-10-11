#!/bin/sh
# Start command for the Render Docker service:
# 1) first boot only: create the tables and seed the catalogue (later boots skip this in ~1s)
# 2) copy product photos to Supabase Storage in the background (skips photos already copied)
# 3) start the shop
if node scripts/needs-setup.mjs; then
  npx drizzle-kit push --force && npx tsx src/db/seed.ts || echo "⚠ database setup failed, check DATABASE_URL"
fi
(npx tsx scripts/pull-images.ts || echo "images: kept remote URLs") &
exec npx next start -p "${PORT:-10000}" -H 0.0.0.0
