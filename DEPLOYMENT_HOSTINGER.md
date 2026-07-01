# Deploying to a Single Hostinger VPS

This guide wires the frontend and backend together on **one** VPS, under
**one** domain — no Render, no Vercel, no separate hosts. One Nginx server
in front of everything: it serves the built frontend directly and proxies
`/api/` to the Node backend running under PM2.

```
Browser
  |
  v
Nginx (port 80/443, your domain)
  |-- /        -> serves frontend/dist (static files)
  `-- /api/*   -> proxies to -> Node backend (PM2, port 3000) -> Postgres
```

Because both live behind the same Nginx server on the same domain, the
browser sees everything as **one origin** — no CORS headaches, no separate
DNS records to manage, no juggling two hosting bills.

---

## 0. What you'll need

- A Hostinger VPS (Ubuntu 22.04 recommended) with root/sudo SSH access
- A domain pointed at the VPS's IP address (A record)
- Postgres — either installed on the same VPS, or a managed Postgres add-on
  if Hostinger offers one in your plan (either works; only the
  `DATABASE_URL` changes)

---

## 1. Initial server setup

SSH into the VPS, then:

```bash
sudo apt update && sudo apt upgrade -y

# Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Postgres (skip if using a managed/external DB)
sudo apt install -y postgresql postgresql-contrib

# Nginx + certbot (for free SSL)
sudo apt install -y nginx certbot python3-certbot-nginx

# PM2 (keeps the backend running, restarts it on crash/reboot)
sudo npm install -g pm2
```

Create the database:

```bash
sudo -u postgres psql -c "CREATE DATABASE prodigy;"
sudo -u postgres psql -c "CREATE USER prodigy_user WITH ENCRYPTED PASSWORD 'choose-a-strong-password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE prodigy TO prodigy_user;"
```

---

## 2. Get the code onto the VPS

```bash
sudo mkdir -p /var/www/prodigy
sudo chown $USER:$USER /var/www/prodigy
cd /var/www/prodigy

# however you're shipping the code -- git clone, scp, or unzip the
# deliverable ZIP -- end state should be:
#   /var/www/prodigy/backend/...
#   /var/www/prodigy/frontend/...   (root of this repo, renamed for clarity)
```

If you're unzipping the delivered archive, just make sure the two halves
end up at `/var/www/prodigy/backend` and `/var/www/prodigy/frontend`
(the repo root, containing `src/`, `package.json`, `vite.config.js`, etc.)
-- rename the extracted folder to `frontend` for clarity, or adjust the
Nginx `root` path in step 5 to match wherever it actually lives.

---

## 3. Backend setup

```bash
cd /var/www/prodigy/backend
cp .env.example .env
nano .env        # fill in real values -- see below
npm install
npm run db:generate
npm run db:migrate:prod
npm run build    # compiles to dist/
```

**Key `.env` values for this single-VPS setup:**

```bash
DATABASE_URL="postgresql://prodigy_user:choose-a-strong-password@localhost:5432/prodigy"
NODE_ENV="production"

# Same-origin deployment -- the frontend is served from the same domain,
# so this just needs to match that domain (used for CORS + email links).
FRONTEND_URL="https://yourdomain.com"

JWT_SECRET="<generate with: openssl rand -hex 64>"
JWT_REFRESH_SECRET="<a DIFFERENT 64-byte hex secret>"
JWT_MAGIC_SECRET="<a third, different 64-byte hex secret>"

# Real Paystack live keys when you're ready to take real money;
# sk_test_/unset keys keep withdrawal disbursement in demo mode.
PAYSTACK_SECRET_KEY="sk_live_..."
PAYSTACK_PUBLIC_KEY="pk_live_..."
PAYSTACK_WEBHOOK_SECRET="..."

# SMTP for outgoing emails (OTP, investment/withdrawal notifications, etc.)
SMTP_HOST="smtp.yourprovider.com"
SMTP_PORT="587"
SMTP_USER="..."
SMTP_PASS="..."
SMTP_FROM="Prodigy Finance <no-reply@yourdomain.com>"
```

Start it with PM2 (the `ecosystem.config.js` is already in `backend/`):

```bash
mkdir -p logs
pm2 start ecosystem.config.js --env production
pm2 save                 # persist the process list
pm2 startup              # prints a command -- run the one it gives you,
                          # so PM2 (and your backend) restarts after a reboot
```

Useful PM2 commands going forward:

```bash
pm2 status               # is it running?
pm2 logs prodigy-backend # tail logs
pm2 restart prodigy-backend   # after deploying new backend code
```

---

## 4. Frontend setup

The frontend is a static build -- there's no Node process to keep running
for it; Nginx just serves the files `vite build` produces.

```bash
cd /var/www/prodigy/frontend
nano .env.production
```

```bash
# .env.production -- same-origin: the API is reachable at /api/v1 on the
# SAME domain Nginx serves the frontend from, so this is a relative path.
VITE_API_URL="/api/v1"
```

```bash
npm install
npm run build      # outputs to frontend/dist
```

That's it -- no process manager needed here. Whenever you redeploy, you
just rebuild (`npm run build`) and Nginx immediately serves the new files
on the next request (the index.html cache-control in the Nginx config
makes sure browsers don't keep an old version cached).

---

## 5. Wire it together with Nginx

A template is included at `deploy/nginx.conf.example` in this repo. Copy
it in and adjust the two things marked below:

```bash
sudo cp /var/www/prodigy/frontend/deploy/nginx.conf.example /etc/nginx/sites-available/prodigy
sudo nano /etc/nginx/sites-available/prodigy
```

Inside, change:
- `server_name yourdomain.com www.yourdomain.com;` -> your real domain
- `root /var/www/prodigy/frontend/dist;` -> confirm this matches where
  your build output actually landed

Then enable it:

```bash
sudo ln -s /etc/nginx/sites-available/prodigy /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default   # remove Nginx's placeholder site
sudo nginx -t                                  # check for syntax errors
sudo systemctl reload nginx
```

At this point `http://yourdomain.com` should already work end-to-end
(frontend loads, login calls hit the backend through the proxy).

---

## 6. Add SSL (HTTPS)

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot edits the Nginx config to add the HTTPS server block and an
automatic HTTP-to-HTTPS redirect, and sets up auto-renewal. Confirm
renewal works without you doing anything:

```bash
sudo certbot renew --dry-run
```

Once this is done, update `FRONTEND_URL` in the backend `.env` (if you
hadn't already used `https://`) and restart the backend:

```bash
pm2 restart prodigy-backend
```

---

## 7. Paystack webhook

In your Paystack dashboard, set the webhook URL to:

```
https://yourdomain.com/api/v1/webhooks/paystack
```

This is the same domain/proxy path as everything else -- no separate
backend URL to register anywhere, since the backend isn't directly
internet-facing (Nginx is the only thing listening on 80/443; the
backend only listens on `127.0.0.1:3000`, unreachable from outside the
VPS directly -- which is also a nice security property: the backend is
never exposed to the internet except through Nginx).

---

## 8. Redeploying after code changes

```bash
# Backend
cd /var/www/prodigy/backend
git pull              # or however you're syncing new code
npm install
npm run db:generate
npm run db:migrate:prod   # only if there are new migrations
npm run build
pm2 restart prodigy-backend

# Frontend
cd /var/www/prodigy/frontend
git pull
npm install
npm run build
# nothing to restart -- Nginx serves the new dist/ immediately
```

Consider wrapping both into a single `deploy.sh` script once this settles
into a routine.

---

## 9. Quick troubleshooting

| Symptom | Likely cause |
|---|---|
| Frontend loads but API calls 404/fail | `VITE_API_URL` wasn't `/api/v1` at build time, or the Nginx `/api/` location isn't proxying correctly -- check `pm2 logs` and `sudo nginx -t` |
| "CORS error" in browser console | `FRONTEND_URL` in backend `.env` doesn't match the domain you're actually browsing from (including `https://` vs `http://`, and `www.` vs not) |
| Backend won't start | `pm2 logs prodigy-backend` -- usually a missing/wrong `DATABASE_URL` or JWT secret, or migrations not run yet |
| Refreshing a page like `/joint/portfolio` gives an Nginx 404 | The `try_files $uri $uri/ /index.html;` fallback line is missing from your Nginx config -- this is what makes client-side routing work on a hard refresh |
| Emails not sending | Check `SMTP_*` env vars; emails are sent "fire and forget" so failures won't crash anything, but check `pm2 logs` for warnings |

---

## Alternative: keeping frontend/backend on separate hosts

If you ever DO want to split them again (e.g. frontend on Vercel/Hostinger
static hosting, backend on Render/Railway/a different VPS), the only two
things that change from everything above:

1. `VITE_API_URL` in the frontend build becomes the full backend URL
   (e.g. `https://api.yourdomain.com/api/v1`) instead of the relative `/api/v1`.
2. `FRONTEND_URL` in the backend `.env` becomes the frontend's actual
   public URL, so CORS allows it.

Everything else (migrations, PM2, Paystack webhook path) stays the same.
