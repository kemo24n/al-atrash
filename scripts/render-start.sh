#!/bin/sh
# Start command for Render (Blueprint and Docker service):
# 1) every boot: bring the tables up to date with src/db/schema.ts (adds new tables/columns, a few seconds)
# 2) first boot only: seed the catalogue (later boots skip this in ~1s)
# 3) copy product photos to Supabase Storage in the background (skips photos already copied)
# 4) start the shop
npx drizzle-kit push --force || echo "⚠ schema update failed, check DATABASE_URL"
if node scripts/needs-seed.mjs; then
  npx tsx src/db/seed.ts || echo "⚠ seeding failed, check DATABASE_URL"
fi
node scripts/only-alameen.mjs
(npx tsx scripts/pull-images.ts || echo "images: kept remote URLs") &
exec npx next start -p "${PORT:-10000}" -H 0.0.0.0
