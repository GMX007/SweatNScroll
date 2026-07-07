# Rep2Scroll iOS — Screen Time shields (Family Controls)

This folder contains **Swift source** for a native iOS shell that can **shield (block) apps** the user selects, using:

- **FamilyControls** — authorization + `FamilyActivityPicker`
- **ManagedSettings** — apply shields to selected tokens
- **DeviceActivity** — schedules + **Device Activity Monitor** extension callbacks

Your existing **Vite/React** app cannot apply OS-level blocks; this target is what you ship beside (or wrapped around) the web UI.

## What you must do on a Mac (Xcode)

1. **Apple Developer Program** membership.
2. Create a new **iOS App** in Xcode (SwiftUI, iOS 16+ recommended).
3. Set **Bundle ID** (e.g. `com.yourteam.rep2scroll`). Use the same team everywhere.
4. Add a new target: **Device Activity Monitor Extension** (File → New → Target).
5. Add all Swift files from this repo:
   - `Rep2ScrollApp/` → main app target  
   - `Rep2ScrollMonitor/` → monitor extension target only
   - `Shared/` → **both** targets (check the target membership box for each file in Xcode).
6. **Signing & Capabilities** (main app):
   - Enable **Family Controls** (and **App Groups** if you use the shared constants — see `Shared/AppConstants.swift`).
7. **Signing & Capabilities** (extension):
   - Enable **Family Controls**  
   - Same **App Group** as the main app.
8. Copy entitlement keys from `Entitlements/*.entitlements` into each target’s entitlements file (or merge manually in Xcode).

## Request the Family Controls entitlement

In [Apple Developer](https://developer.apple.com) → Certificates, Identifiers & Profiles → Identifiers → your App ID:

- Enable **Family Controls (Distribution)** / related capability as Apple documents for your program.

Without Apple granting this, **shields will not work on device** and App Store review will fail for this feature.

## Info.plist (main app)

Add a usage string (key may vary by Xcode version; search “Family Controls” in the Info tab):

- **Privacy — Family Controls Usage Description**  
  Example: *Rep2Scroll uses Screen Time controls so you can choose which apps to pause until you’ve finished your workout.*

## Run & test

- Use a **physical iPhone** (Screen Time APIs are unreliable/absent on Simulator for many flows).
- First launch: tap **Authorize Screen Time**, then **Choose apps to block**, then **Apply shields**.

## Optional: embed your web app

Add a `WKWebView` screen that loads your production URL (e.g. `https://your-domain.vercel.app`). Native code handles **blocking**; the web app handles **workouts / earned time** and can pass messages to native via `WKScriptMessageHandler` if you want “unlock for N minutes” later.

## Limitations of this scaffold

- **Earned-time unlock** (relax shields for N minutes then re-lock) needs product rules + shared state between app and extension (e.g. App Group + schedule). This repo gives you **picker + shield + monitor hooks**; wire your Rep2Scroll logic on top.
- **Legal copy** in App Store and in-app must match Apple’s expectations for Family Controls apps.
- **`FamilyActivitySelection` encoding** uses `Codable` (needed for the App Group store). If your deployment target is below the OS version where that is available, persist tokens using Apple’s recommended approach for your SDK version.
- This repo does **not** include an `.xcodeproj` (Xcode generates it). Create the project once, then add these folders as a group and assign files to the correct targets.
