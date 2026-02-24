# Free Forever Hosting: Render + Neon

This guide gets Checkmate running **for free** using:

- **Render** — hosts your Node app (Next.js + Socket.IO). Free tier: 750 hours/month; service sleeps after ~15 min of no traffic (first load after sleep takes ~30–60 seconds).
- **Neon** — serverless PostgreSQL. Free tier: 0.5 GB storage, no time limit.

You’ll need: a GitHub account, a [Clerk](https://clerk.com) account (free tier), and about 20 minutes.

---

## Part 1: Database (Neon)

1. Go to [neon.tech](https://neon.tech) and sign up (GitHub is fine).
2. Click **New Project**.
3. Pick a name (e.g. `checkmate`), region (choose one near you), and click **Create Project**.
4. On the project dashboard you’ll see a connection string like:
   ```text
   postgresql://USER:PASSWORD@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```
5. Copy that string — you’ll use it as `DATABASE_URL` on Render.
6. (Optional) In Neon’s **SQL Editor**, you can run migrations later from your repo:
   - Locally run `npx prisma migrate deploy` (or `prisma db push`) using that `DATABASE_URL` in `.env`, **or**
   - After the app is on Render, run migrations from your machine once with `DATABASE_URL` set to the same Neon URL.

---

## Part 2: Clerk (Auth)

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com) and sign in.
2. Create an **Application** (or use an existing one).
3. In the app, open **API Keys**. Copy:
   - **Publishable key** (starts with `pk_`)
   - **Secret key** (starts with `sk_`)
4. Go to **Configure → Paths** (or **Paths** in the sidebar). Set:
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in: `/`
   - After sign-up: `/`
5. You’ll add your Render URL to Clerk **after** you create the Render service (Part 4). Clerk needs the exact production URL for redirects and CORS.

---

## Part 3: Push Code to GitHub

1. Create a new repository on GitHub (e.g. `checkmate`).
2. In your project folder:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/checkmate.git
   git branch -M main
   git push -u origin main
   ```
3. Make sure the repo contains `server.js`, `package.json`, `prisma/`, and the rest of the app. Do **not** commit `.env` or `.env.local`.

---

## Part 4: Render (Web Service)

1. Go to [render.com](https://render.com) and sign up (GitHub is fine).
2. Click **New +** → **Web Service**.
3. Connect your GitHub account if needed, then select the **checkmate** repo.
4. Configure the service:
   - **Name:** `checkmate` (or any name).
   - **Region:** pick one close to you.
   - **Runtime:** **Node**.
   - **Build Command:**
     ```bash
     npm install && npx prisma generate && npm run build
     ```
   - **Start Command:**
     ```bash
     npm run start
     ```
   - **Instance Type:** leave as **Free** (or the free option if the UI wording is different).
5. Click **Advanced** and add **Environment Variables** (one by one):

   | Key | Value |
   |-----|--------|
   | `DATABASE_URL` | The full Neon connection string from Part 1 (with password). |
   | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Your Clerk publishable key (`pk_...`). |
   | `CLERK_SECRET_KEY` | Your Clerk secret key (`sk_...`). |
   | `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
   | `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
   | `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | `/` |
   | `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | `/` |
   | `NODE_ENV` | `production` |

   Render provides `PORT` automatically; you don’t need to set it.

6. Click **Create Web Service**. Render will build and deploy. The first deploy can take 5–10 minutes.
7. When it’s live, copy your app URL, e.g. `https://checkmate-xxxx.onrender.com`.

---

## Part 5: Point Clerk to Your Live URL

1. In [Clerk Dashboard](https://dashboard.clerk.com) → your application → **Configure** (or **Settings**).
2. Under **Paths** / **Redirect URLs**, add your Render URL, e.g.:
   - `https://checkmate-xxxx.onrender.com`
   - `https://checkmate-xxxx.onrender.com/*`
3. Under **Allowed origins** (or **CORS**), add:
   - `https://checkmate-xxxx.onrender.com`
4. Save. This avoids “blocked by CORS” or redirect errors in production.

---

## Part 6: Database Schema (Migrations)

Your app needs tables in Neon. Do this **once** from your laptop (or any machine with the repo and Node).

1. In the project root, create a `.env` with the **same** `DATABASE_URL` as on Render (your Neon URL):
   ```bash
   DATABASE_URL="postgresql://USER:PASSWORD@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
   ```
2. Run:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
   (Or, if you use migrations: `npx prisma migrate deploy`.)
3. Optional: seed data (campaign, shop, etc.):
   ```bash
   npm run seed-tournament
   npm run seed-shop
   npm run seed-all-openings
   ```
   Add `puzzles.csv` and run `npm run seed-puzzles` if you use puzzles.

---

## Part 7: Custom Domain (Optional)

1. In Render, open your Web Service → **Settings** → **Custom Domain**.
2. Add your domain (e.g. `www.checkmate.quest`) and follow Render’s DNS instructions (CNAME to `xxx.onrender.com`).
3. In Clerk, add the same domain to **Allowed origins** and **Redirect URLs** (e.g. `https://www.checkmate.quest` and `https://www.checkmate.quest/*`).

---

## Summary Checklist

- [ ] Neon project created; `DATABASE_URL` copied.
- [ ] Clerk app created; publishable and secret keys copied; paths set.
- [ ] Repo pushed to GitHub.
- [ ] Render Web Service created; build = `npm install && npx prisma generate && npm run build`, start = `npm run start`.
- [ ] All env vars set on Render (including `DATABASE_URL` and Clerk keys).
- [ ] Clerk configured with Render URL (and custom domain if used) in redirect URLs and allowed origins.
- [ ] `prisma db push` (or `migrate deploy`) run once against Neon; optional seeds run.
- [ ] App opens at `https://your-app.onrender.com` and sign-in/sign-up work; Play → Find Match uses WebSockets (no “Connecting…” forever if everything is correct).

---

## Free Tier Limits (as of this guide)

- **Render free:** 750 hours/month (enough for one service 24/7). Service sleeps after ~15 min idle; first request after sleep has a cold start (~30–60 s).
- **Neon free:** 0.5 GB storage, 1 project; no hard “expiry” for the DB.
- **Clerk free:** 10,000 MAU; enough for a side project.

If you need **no cold starts** and still free, the next step is to run the same app on **Fly.io** (free allowance) with the same Neon DB; that’s a separate guide (CLI + Dockerfile from `docs/DEPLOYMENT.md`).
