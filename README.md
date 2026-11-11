# جاسوس (Spy)

A party game for one phone. Persian and English. Works offline, can be installed on a phone's home screen,
and can be built as an Android / iPhone app.

**Play:** https://j-sadeghi.github.io/jasoos/

---

## What is where

| Folder / file | What it is |
|---|---|
| `src/i18n/fa.json`, `src/i18n/en.json` | **All texts and word lists.** Edit words here. |
| `src/game/rules.js` | The game rules (dealing roles, who wins). |
| `src/game/gameReducer.js` | Screen flow (deal → reveal → discussion → vote → result). |
| `src/screens/` | One file per screen. |
| `src/components/` | Buttons, switches, dialogs… |
| `src/styles/app.css` | Colors, sizes, animations. |
| `src/config.js` | **Footer credit text.** The version number is in `package.json`. |
| `public/icons/` | App icons. `resources/` = source images for the Android/iOS icons. |
| `build/` | Makes the offline service worker + manifest during the build. |
| `android/`, `ios/` | The phone app projects (Capacitor). |
| `netlify-redirect/` | The tiny page that sends the old Netlify site to the new address. |
| `tests/` | Automatic tests. |

## Run it on your computer

Install [Node.js](https://nodejs.org) (the "LTS" version), then in this folder:

```bash
npm install
```

```bash
npm run dev
```

Open the address it prints (for example `http://localhost:5173/jasoos/`).

Run the rule tests:

```bash
npm test
```

## Publishing a new version

1. Change what you want (e.g. words in `src/i18n/fa.json`).
2. Increase `"version"` in `package.json` (e.g. `3.0.0` → `3.0.1`). It is shown in the footer.
3. Commit and push to `main`. GitHub builds and publishes it automatically in about 1 minute
   (see the **Actions** tab). Every build gets a new offline-cache name, so players get the new
   version the next time they open the game and go back to the home screen.

---

## Android APK (install on your own phone)

### Easiest way: let GitHub build it (no software needed)
1. On GitHub open the repository → **Actions** tab → **Build Android APK** (left side).
2. Click **Run workflow** → **Run workflow**. Wait ~5 minutes until it shows a green check.
3. Click the finished run, scroll to **Artifacts**, download **jasoos-apk** (a zip). Unzip it → `app-debug.apk`.
4. Send the APK to your phone (e.g. Google Drive, Telegram, USB cable) and tap it.
   Android asks to allow "Install unknown apps" for that app (Files/Drive/Telegram) — allow it, then **Install**.

### On your own computer (Android Studio)
1. Install [Android Studio](https://developer.android.com/studio) and Node.js.
2. In this folder:

   ```bash
   npm install
   ```

   ```bash
   npm run cap:sync
   ```

   ```bash
   npx cap open android
   ```

3. In Android Studio wait for "Gradle sync" to finish, then menu **Build → Build App Bundle(s) / APK(s) → Build APK(s)**.
   Click **locate** in the message that appears: the file is `android/app/build/outputs/apk/debug/app-debug.apk`.
4. Or connect your phone with USB (turn on *Developer options → USB debugging*) and press the green ▶ button.

> A "debug" APK is fine for your own phones and friends. To publish on Google Play you need a signed
> release build and a Google Play developer account (one-time $25).

## iPhone app

You need:
- **A Mac** with **Xcode** (free from the Mac App Store). iPhone apps can only be built on a Mac.
- An **Apple ID**. With a free Apple ID you can install the app on your own iPhone, but it stops opening
  after 7 days and must be reinstalled from Xcode. To keep it working, or to share it through TestFlight or
  the App Store, you need the **Apple Developer Program** ($99/year).

Steps on the Mac:

```bash
npm install
```

```bash
npm run cap:sync
```

```bash
npx cap open ios
```

In Xcode: click **App** in the left list → **Signing & Capabilities** → choose your Apple ID under **Team**.
Connect the iPhone, select it at the top, press ▶. On the iPhone go to *Settings → General → VPN & Device
Management* and trust your developer profile the first time.

**Without any of this:** iPhone users can simply open the website in Safari → Share → **Add to Home Screen**.
It then works full-screen and offline, like an app.

---

## Moving from Netlify
Upload the `netlify-redirect` folder once to the old site (see the step-by-step guide in the chat / below):
Netlify → your site *beamish-fox-be1d4f* → **Deploys** → drag the **netlify-redirect folder** onto the
"Drag and drop your site output folder here" box. Visitors of the old address are sent to the new one,
and phones that installed the old version get their old offline copy cleaned up.
