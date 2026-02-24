# Fly.io Setup (Free, No Cold Starts)

This guide deploys Checkmate on **Fly.io**. The app stays running 24/7 on the free tier, so **no cold starts** — matchmaking and games work immediately.

You’ll use:
- **Fly.io** — runs your app (Docker). Free allowance: 3 shared-cpu VMs, 3GB storage, 160GB outbound/month.
- **Neon** — free PostgreSQL (same as the Render guide).

You need: a Fly.io account, Neon (or any Postgres), Clerk, and the Fly CLI.

---

## Part 1: Install the Fly CLI

**macOS (Homebrew):**
```bash
brew install flyctl
```

**Windows (PowerShell):**
```bash
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

**Linux:**
```bash
curl -L https://fly.io/install.sh | sh
```

Log in:
```bash
fly auth login
```
This opens a browser to sign up or sign in.

---

## Part 2: Database (Neon)

1. Go to [neon.tech](https://neon.tech) and sign up.
2. **New Project** → name (e.g. `checkmate`), region → **Create Project**.
3. Copy the **connection string** (e.g. `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`). You’ll use it as `DATABASE_URL`.

---

## Part 3: Clerk

1. [dashboard.clerk.com](https://dashboard.clerk.com) → your app (or create one).
2. **API Keys** → copy **Publishable key** (`pk_...`) and **Secret key** (`sk_...`).
3. **Paths**: Sign-in `/sign-in`, Sign-up `/sign-up`, After sign-in `/`, After sign-up `/`.
4. After you have your Fly URL (Part 5), add it to **Allowed origins** and **Redirect URLs** (e.g. `https://your-app.fly.dev` and `https://your-app.fly.dev/*`).

---

## Part 4: Create the Fly App (First Time)

In your project root (where `Dockerfile` and `package.json` are):

```bash
fly launch
```

- **App name:** pick one (e.g. `checkmate-quest`) or press Enter to auto-generate.
- **Region:** choose one near you (e.g. `iad` for Virginia).
- When asked **“Would you like to set up a Postgres database?”** → **No** (we use Neon).
- When asked **“Would you like to deploy now?”** → **No** (we set secrets first).

This creates a `fly.toml` and registers the app. You can edit `fly.toml` later if needed.

---

## Part 5: Set Secrets (Env Vars)

Set your **production** values. Fly stores these as secrets (not in the repo).

```bash
fly secrets set DATABASE_URL="postgresql://USER:PASSWORD@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
fly secrets set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_..."
fly secrets set CLERK_SECRET_KEY="sk_live_..."
fly secrets set NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
fly secrets set NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
fly secrets set NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/"
fly secrets set NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/"
```

Use your real Neon URL and Clerk keys. Replace the example `DATABASE_URL` with your full string (keep the quotes).

---

## Part 6: Deploy

```bash
fly deploy
```

Fly builds the image from the Dockerfile and deploys. First deploy can take a few minutes.

When it’s done, open the app:

```bash
fly open
```

Your URL will be `https://YOUR_APP_NAME.fly.dev`. Copy it.

---

## Part 7: Clerk Production URL

1. In Clerk Dashboard → your app → **Configure** (or **Settings**).
2. **Allowed origins:** add `https://YOUR_APP_NAME.fly.dev`
3. **Redirect URLs:** add `https://YOUR_APP_NAME.fly.dev` and `https://YOUR_APP_NAME.fly.dev/*`
4. Save.

---

## Part 8: Database Schema (One-Time)

Run migrations (or push schema) against your Neon database from your **local** machine:

1. In the project root, create a `.env` with:
   ```bash
   DATABASE_URL="postgresql://USER:PASSWORD@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
   ```
   (Same value you used in `fly secrets set DATABASE_URL`.)

2. Run:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. Optional seeds:
   ```bash
   npm run seed-tournament
   npm run seed-shop
   npm run seed-all-openings
   ```

---

## Part 9: Custom Domain (Optional)

1. Run:
   ```bash
   fly certs add www.checkmate.quest
   ```
   (Use your real domain.)

2. Fly shows the DNS records. Add a **CNAME** (or A/AAAA) at your DNS provider:
   - Name: `www` (or `@` if you want the root domain)
   - Value: `YOUR_APP_NAME.fly.dev`

3. After DNS propagates, Fly issues the certificate automatically. Then add `https://www.checkmate.quest` (and `https://www.checkmate.quest/*`) to Clerk’s **Allowed origins** and **Redirect URLs**.

---

## Useful Commands

| Command | Description |
|--------|-------------|
| `fly status` | App status and URL |
| `fly logs` | Stream logs |
| `fly ssh console` | SSH into the VM |
| `fly secrets list` | List secrets (values are hidden) |
| `fly deploy` | Rebuild and deploy after code changes |

---

## Checklist

- [ ] Fly CLI installed, `fly auth login` done
- [ ] Neon project created, `DATABASE_URL` copied
- [ ] Clerk app: keys and paths set
- [ ] `fly launch` (no Postgres, no deploy yet)
- [ ] `fly secrets set` for all vars (DATABASE_URL, Clerk keys, Clerk paths)
- [ ] `fly deploy`
- [ ] Clerk: add `https://YOUR_APP_NAME.fly.dev` to allowed origins and redirect URLs
- [ ] `npx prisma db push` (and optional seeds) with same `DATABASE_URL` in `.env`
- [ ] Visit `https://YOUR_APP_NAME.fly.dev` and test sign-in and Play → Find Match

After this, the app stays up on Fly’s free tier with no cold starts.
