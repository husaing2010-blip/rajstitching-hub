# Rajstitching Hub • Bespoke Brand Academy

A luxury, business-style masterclass web portal built for **Rajstitching Hub**. Features live batch synchronization, 7-day student video access expiry, WhatsApp admissions, and anti-piracy DRM protection.

---

## 🌟 Key Features

1. **Single Fixed Live Batch Timing**:
   - **India (IST)**: 10:30 AM
   - **UAE (GST)**: 9:00 AM
   - **Duration**: 1 Hour Live Session Daily
2. **Direct WhatsApp Admissions**:
   - Direct 1-on-1 WhatsApp chat integration with pre-filled student registration messages.
   - Configurable owner WhatsApp phone number in the Admin Settings.
3. **7-Day Auto-Expiry Access Engine**:
   - Admin enters the **4 customer fields**:
     1. **Full Name**
     2. **Email Address**
     3. **Mobile Number** (international formats supported)
     4. **Country**
   - Automatically calculates a **30-day (7-day) validity timer**.
   - Students can log in using their Email or Mobile Number.
   - When 7 days are complete, access locks with a renewal prompt.
   - Admin/Owner has **permanent, non-expiring master access** to all session recordings.
4. **Anti-Piracy & Content Protection**:
   - **Dynamic Floating Watermark**: Constantly shifts across the screen showing the student's *Name*, *Email*, *Mobile Number*, and live timestamp. If anyone films with an external phone or screen recorder, their identity is stamped all over the video.
   - **Anti-Screenshot & Blur Defense**: Switching apps or pressing screenshot keys (`PrintScreen`, `Cmd+Shift+3/4`) triggers an immediate blackout shield.
   - **Lockdown Controls**: Right-click, text copy, drag-and-drop, DevTools (`F12`, `Ctrl+Shift+I`), and video download buttons are disabled.
5. **Logo Replacement**:
   - Ready for your official logo. Simply place your image file into `assets/logo.png` and the site will display it automatically!

---

## 🚀 How to Host on GitHub for FREE (Step-by-Step)

GitHub Pages provides **100% free hosting forever** with free SSL (HTTPS).

### Step 1: Create a GitHub Repository
1. Log in to [GitHub](https://github.com/).
2. Click the **+** (plus icon) at the top right and select **New repository**.
3. Name your repository (e.g., `raw-stitching-hub`).
4. Set visibility to **Public**.
5. Click **Create repository**.

### Step 2: Upload Project Files
You can either upload the files directly through the GitHub website or via terminal:

#### Option A: Via GitHub Web Interface
1. On your newly created repository page, click **uploading an existing file**.
2. Drag and drop all files from `raw-stitching-hub` (`index.html`, `app.js`, `styles.css`, `assets/`, `README.md`).
3. Click **Commit changes**.

#### Option B: Via Terminal (Mac)
```bash
cd /Users/mac/.gemini/antigravity/scratch/raw-stitching-hub
git init
git add .
git commit -m "Initial launch of Rajstitching Hub"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/raw-stitching-hub.git
git push -u origin main
```

### Step 3: Turn on GitHub Pages
1. In your GitHub repository, click on **Settings** (gear icon).
2. On the left sidebar, click **Pages**.
3. Under **Build and deployment** > **Branch**:
   - Select `main` branch.
   - Folder: `/ (root)`.
4. Click **Save**.
5. In 1 to 2 minutes, GitHub will give you your live URL:
   `https://YOUR_GITHUB_USERNAME.github.io/raw-stitching-hub/`

---

## 🔐 Owner / Admin Access

- Click the **Lock icon** at the top right of the navigation bar.
- Password: Enter your secure master password (protected via cryptographic SHA-256 hash).
- From the Owner Portal you can:
  - Add new customers (Name, Email, Mobile, Country).
  - Track 7-day active vs. expired status.
  - Extend student subscriptions by +7 days with 1 click.
  - Update the live video stream URL.
  - Update the Owner WhatsApp number.
  - Watch the video as Owner (never expires).
  - Export or import customer database backups (JSON).

---

## 🖼️ Adding Your Logo

When you receive your final logo file:
1. Rename it to `logo.png` (or `.svg`).
2. Place it in the `assets/` folder:
   ```
   raw-stitching-hub/
   └── assets/
       └── logo.png
   ```
3. Commit and push to GitHub. It will automatically replace the needle placeholder!
