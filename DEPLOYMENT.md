# 🚀 PUBLIC DEPLOYMENT GUIDE: THE LAST SLICE

This guide explains how to deploy **THE LAST SLICE – CURSE OF THE PUMPKIN** horror gaming website publicly to **Vercel**, **Netlify**, or **GitHub Pages**.

---

## 📦 Project Build Command & Configuration

- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Node Version:** Node.js 18+ or 20+

The project is pre-configured with:
- [`vite.config.js`](file:///C:/VELMORA/vite.config.js): Sets `base: './'` for universal asset paths and automatic vendor chunk splitting.
- [`vercel.json`](file:///C:/VELMORA/vercel.json): Configured with SPA rewrite rules and immutable asset caching.
- [`netlify.toml`](file:///C:/VELMORA/netlify.toml): Configured with publish directory and status 200 redirect rules.

---

## Option 1: Deploy to Vercel (Recommended)

### Method A: Deploy via GitHub
1. Push your project code to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "feat: The Last Slice Horror Game & Website"
   git branch -M main
   git remote add origin https://github.com/your-username/the-last-slice.git
   git push -u origin main
   ```
2. Go to [vercel.com](https://vercel.com) and log in.
3. Click **Add New** > **Project**.
4. Import your `the-last-slice` repository.
5. Vercel will automatically detect **Vite**:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
6. Click **Deploy**. Your horror website will be live with an SSL HTTPS domain (e.g. `https://the-last-slice.vercel.app`) in under 1 minute!

### Method B: Deploy via Vercel CLI
```bash
npm install -g vercel
vercel
# Choose defaults: Framework: Vite, Build: npm run build, Output: dist
vercel --prod
```

---

## Option 2: Deploy to Netlify

### Method A: Drag & Drop (Zero Setup)
1. Run a fresh production build locally:
   ```bash
   npm run build
   ```
2. Log into [netlify.com](https://netlify.com).
3. Go to the **Sites** tab and simply drag-and-drop the generated `dist` folder into the Netlify upload area.
4. Your site will instantly go live with an HTTPS URL!

### Method B: Deploy via Netlify CLI
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

---

## Option 3: Deploy to GitHub Pages

1. In your GitHub repository, go to **Settings** > **Pages**.
2. Under **Build and deployment**, select **GitHub Actions**.
3. Choose the **Static HTML** or **Vite** action workflow.
4. Because `base: './'` is configured in `vite.config.js`, all scripts, audio synthesis, and procedural 3D textures will load perfectly on any GitHub Pages subpath!

---

## 🎮 Features Included in this Public Release
- **Cinematic Introduction:** 6-Scene animated prologue with rain, thunder, slow zoom, and "Skip Intro" option.
- **Full AAA Horror Website:** Story lore, adaptive AI breakdown, gallery with lightbox modals, controls guide, and editable credits.
- **3D Survival Horror Game:** One seamless 9-room pizzeria, Werewolf AI with "The Beast Remembers", 4 magical Jack-o'-Lantern powers, tactile puzzles, and mobile virtual joystick.

