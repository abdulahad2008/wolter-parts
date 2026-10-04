# Wolter Parts

Small online shop for Wolter e-bike accessories and spare parts — **parts.wolter.uz**.
Customers browse on their phones and buy through Telegram; there is no online payment and no customer accounts.

- **Shop:** products (search, categories, sort), product page, Ro‘yxat (several items in one Telegram message), pickup location.
- **Admin** (`/admin`, works on a phone too): drag-and-drop product order, show/hide, add/edit with photo upload, categories, «Sotib olish» click counts, settings (Telegram target, message template, address), admin accounts.

## Stack

One Next.js 16 app (TypeScript, Tailwind CSS 4) + PostgreSQL (Drizzle ORM). Photos are resized with sharp to square WebP and stored on a Docker volume. Admin login: bcrypt + signed cookie (iron-session). Drag-and-drop: dnd-kit. No CMS, no paid services.

```
src/app/(shop)/          shop pages: /, /p/[slug], /royxat, /manzil
src/app/admin/           admin: login, (panel)/ products, categories, clicks, settings; actions.ts = all admin writes
src/app/api/             /api/click (counts buy taps), /api/admin/upload (photos), /api/health
src/app/media/[file]     serves photos from MEDIA_DIR
src/app/go/list          bot mode only: saves a Ro‘yxat and opens the bot
src/lib/                 db, schema, setup (migrations + first data), telegram links, auth, images
drizzle/                 SQL migrations (applied automatically on start)
```

## Environment variables

| Name | Example | Notes |
| --- | --- | --- |
| `DATABASE_URL` | `postgres://user:pass@wolter-parts-db:5432/wolter_parts` | Internal URL from the Dokploy database page |
| `SESSION_SECRET` | 32+ random characters | `openssl rand -base64 32`. Required; the app won't start with a placeholder. Changing it logs everyone out |
| `SITE_URL` | `https://parts.wolter.uz` | Used in Telegram messages, link previews, sitemap |
| `MEDIA_DIR` | `/data/media` | Already set in the Docker image; mount a volume here |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | | Creates the first admin **only when there are no admins** (password 10+ characters). Remove the password afterwards |
| `SEED_DEMO` | `false` | `true` fills an *empty* shop with the 10 sample products from the previews |
| `ALLOW_INDEXING` | `false` | Keep `false` until launch (adds noindex + blocks robots). Set `true` at launch |
| `TRUST_CLOUDFLARE` | `false` | Set `true` only if `parts` is proxied by Cloudflare (orange cloud), so login/click limits see the real visitor IP |

On start the app applies migrations and creates what an empty install needs (settings, 4 categories, first admin).

## Run locally

```bash
cp .env.example .env.local      # point DATABASE_URL at a local Postgres, MEDIA_DIR=./data/media
npm install
npm run dev                      # http://localhost:3000, admin at /admin
```

After changing `src/lib/schema.ts`: `npm run db:generate` and commit the new file in `drizzle/`.

## Deploy: Dokploy on Hetzner + Cloudflare DNS (about 30 minutes)

1. **Dokploy → Projects → Create project** `wolter-parts`.
2. **Add Database → PostgreSQL** (name `wolter-parts-db`, database `wolter_parts`). Copy the *internal* connection URL.
3. **Add Application** → provider GitHub → this repo, branch `main`, **Build type: Dockerfile**. Turn on auto-deploy.
4. **Environment:** paste the variables from the table above (`DATABASE_URL`, `SESSION_SECRET`, `SITE_URL=https://parts.wolter.uz`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`, `ALLOW_INDEXING=false`).
5. **Advanced → Volumes/Mounts:** Volume mount, name `wolter-parts-media`, mount path `/data/media`. (Must be a *named volume*, so Dokploy volume backups work.)
6. **Cloudflare → wolter.uz → DNS → Add record:** type `A`, name `parts`, IPv4 = the Hetzner server IP, **Proxy status: DNS only** (grey cloud). wolter.uz itself stays on Framer and is not touched.
7. **Dokploy → Application → Domains → Add:** host `parts.wolter.uz`, path `/`, container port `3000`, HTTPS on, certificate **Let's Encrypt**.
8. **Deploy.** Check `https://parts.wolter.uz/api/health` → `{"ok":true}`, then log in at `https://parts.wolter.uz/admin`.
9. **Remove `ADMIN_PASSWORD`** from the environment and redeploy (the account stays in the database). Change the password in Admin → Sozlamalar if you like.
10. **Backups:** Dokploy → Settings → Destinations → add an S3 destination (a Cloudflare R2 bucket works; 10 GB free). Then on the database: Backups → daily. On the application: Volume Backups → `wolter-parts-media`, daily. Test one restore.
11. **At launch:** set `ALLOW_INDEXING=true`, redeploy, and add a link to parts.wolter.uz on the Framer site.

If you later turn on the orange cloud (Cloudflare proxy) for `parts`, use SSL mode **Full (strict)**, never Flexible, and set `TRUST_CLOUDFLARE=true`.

The image builds the app on the server; a build needs about 1–2 GB of free RAM for a few minutes, the running app ~300–400 MB with the database.

## Telegram

- **Manager mode** (default): «Sotib olish» opens `https://t.me/<manager>?text=<message>` — the chat opens with the message typed in; the customer presses Send.
- **Bot mode** (Admin → Sozlamalar → Telegram bot): single product → `https://t.me/<bot>?start=p_<SKU>_<SIZE>`; Ro‘yxat → `/go/list` saves the lines in `buy_clicks` (same `group_id`) and opens `?start=c_<group_id>`. The bot itself is a separate project.
- Message template placeholders: `{nomi}` `{sku}` `{o‘lcham}` `{narx}` `{havola}`. Without a size the "o‘lcham …" phrase is dropped automatically.

## Updating

```bash
npm outdated
npm install next@latest react@latest react-dom@latest   # and others as needed
npm run build                                           # must pass
git commit -am "Update dependencies" && git push        # Dokploy redeploys
```

Do this about once a month, and immediately when Next.js or React publish a security fix.

## Defaults chosen before launch (easy to change)

- Ro‘yxat (multi-item list) is on.
- Buy button goes to the manager account **@wolteruz** (Admin → Sozlamalar).
- Uzbek only; the admin has a disabled "Nomi (ruscha)" field reserved for a Russian version.
- Address shown: «Beshyog‘och 55/1, Toshkent», landmark «Magic City to‘g‘risida», 10:00–20:00 (Admin → Sozlamalar).
- Copy says «Sotib olish va to‘lov — Telegram chatda kelishiladi» — no delivery promise.
- The map is a drawn illustration that opens Yandex Maps (no third-party map script).
