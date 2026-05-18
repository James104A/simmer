Simmer iOS — Mac Handoff Guide
==============================

This folder is a complete SwiftUI iOS 17 app targeting the existing Simmer
Next.js backend. Everything is source — no Xcode project is committed. You
generate the `.xcodeproj` on your Mac via [XcodeGen](https://github.com/yonaskolb/XcodeGen).

## 1. One-time Mac setup

```bash
# Install XcodeGen
brew install xcodegen

# Generate the Xcode project
cd ios
xcodegen generate
open Simmer.xcodeproj
```

Anytime you add or move Swift files, rerun `xcodegen generate`. The project
file itself is gitignored — always regenerate.

## 2. Apple Developer setup (one-time)

You need an Apple Developer Program membership ($99/year) to ship.

In [developer.apple.com](https://developer.apple.com/account):

1. **Team ID** — note it (10 chars). Xcode will use this for signing.
2. **Bundle IDs** (Certificates, Identifiers & Profiles → Identifiers):
   - `com.simmer.app` — main app. Enable capabilities: *Push Notifications*,
     *Sign In with Apple*, *App Groups (group.com.simmer.app)*,
     *Associated Domains*.
   - `com.simmer.app.ShareExtension` — share extension. Enable *App Groups*.
3. **App Group** — create `group.com.simmer.app`.
4. **APNs Key** — Keys → +Key → check *Apple Push Notifications service*.
   Download the `.p8` file. Note the Key ID. You'll upload this to the
   backend (see section 5).
5. **Associated Domains** — if you want universal links (`https://simmer.app/recipes/xxx`
   opening the app), add `apple-app-site-association` JSON at
   `https://simmer.app/.well-known/apple-app-site-association`.

## 3. Building in Xcode

1. Open `Simmer.xcodeproj`.
2. Select the **Simmer** target → Signing & Capabilities → set your Team.
3. Do the same for the **ShareExtension** target.
4. Run on a simulator or device. iOS 17+ required.

### Debug environment

The iOS app talks to `http://localhost:3000` in Debug builds. To override,
add `SimmerAPIBaseURL` to the app target's Info.plist (or edit the constant
in `SimmerApp/Core/AppConfig.swift`).

For local device testing against your dev server, you'll need to:
- Expose the Next.js dev server on your LAN (`next dev -H 0.0.0.0`)
- Or use a tunnel like `ngrok http 3000` and set `SimmerAPIBaseURL` to that

## 4. Backend env vars

The Next.js backend now expects these for full iOS support:

```bash
# Sign in with Apple — verifies id_token audience
APPLE_BUNDLE_ID=com.simmer.app

# APNs — for push notifications
APNS_TEAM_ID=XXXXXXXXXX          # 10-char Apple Team ID
APNS_KEY_ID=XXXXXXXXXX           # 10-char Key ID from the .p8 key
APNS_KEY_P8="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
APNS_BUNDLE_ID=com.simmer.app
APNS_ENVIRONMENT=development     # or "production"
```

Paste the .p8 file contents literally (preserve newlines, or escape as `\n`
depending on your platform).

## 5. Database migration

The iOS build added Prisma models (Device, Block, Report + User.appleSub).
Run the migration:

```bash
npx prisma migrate deploy   # production
# or
npx prisma migrate dev      # local
```

## 6. App Store Connect submission

- **App Icon**: generate from your logo (use [Bakery](https://apps.apple.com/app/id1575220747)
  or `xcrun simctl icon`). Drop a 1024x1024 PNG into
  `ios/SimmerApp/Resources/Assets.xcassets/AppIcon.appiconset/Icon-1024.png`.
  The XcodeGen config wires it up.
- **Screenshots**: required for 6.9" and 6.7" displays minimum. Use the simulator
  (Device → Screenshot) or physical device. iPad screenshots only if you ship iPad support.
- **Privacy Policy URL**: required. Host at `https://simmer.app/privacy`.
- **Terms URL**: host at `https://simmer.app/terms`.
- **App Privacy Nutrition Label** (in App Store Connect): declare collection
  of email, name, user-generated content (recipes/notes), contacts (friends via email), and
  analytics (none if you don't add PostHog/Mixpanel later).
- **Account Deletion**: in-app via Settings → Delete Account. Already wired.
- **Content Moderation**: Report button on feed items and user blocks are wired.
  Reports land in the `Report` table — build a tiny admin route or just query
  the DB until you want a full admin UI.
- **Sign in with Apple**: already implemented. Required because you support
  other third-party sign-in flows (and for accounts in general in UGC apps).

## 7. First submission checklist

- [ ] App icon set (1024x1024 minimum) in Assets.xcassets
- [ ] Launch screen looks intentional (currently a simple wordmark)
- [ ] All `NS*UsageDescription` strings reviewed in Info.plist
- [ ] Privacy Policy URL lives and reflects what you collect
- [ ] Terms of Service URL lives
- [ ] Support email lives (mailto: opens correctly)
- [ ] Account deletion flow tested end-to-end
- [ ] Report button tested on a feed item (check DB has the Report row)
- [ ] Block flow tested (blocked user can't send friend requests)
- [ ] TestFlight build archived, uploaded, installed on a physical device
- [ ] Screenshots captured on 6.9" and 6.7" simulators
- [ ] App Review Information: demo account credentials provided

## 8. Directory layout

```
ios/
├── project.yml                        # XcodeGen spec
├── SimmerApp/
│   ├── App/                           # entry point, state, root view
│   ├── Core/
│   │   ├── API/                       # APIClient, APIError
│   │   ├── Analytics/                 # OSLog + ring buffer
│   │   ├── Models/                    # Codable DTOs
│   │   ├── Push/                      # APNs registration
│   │   └── Storage/                   # Keychain
│   ├── Features/                      # one folder per major surface
│   │   ├── Auth/
│   │   ├── Recipes/
│   │   ├── Feed/
│   │   ├── Friends/
│   │   ├── Partner/
│   │   ├── Onboarding/
│   │   ├── Moderation/
│   │   └── Settings/
│   ├── Shared/Components/
│   └── Resources/                     # Info.plist, entitlements, assets
├── ShareExtension/                    # Save-to-Simmer target
└── SimmerAppTests/                    # XCTest unit tests
```

## 9. Known gaps (intentional — finish on Mac)

- App icon is a placeholder — drop your real icon in
  `Assets.xcassets/AppIcon.appiconset/` and rerun xcodegen.
- Universal links entitlement is scaffolded but the
  `apple-app-site-association` file isn't in the web repo yet — add under
  `public/.well-known/` when you're ready.
- No localizations beyond English.
- Analytics is console-only (OSLog). Swap in PostHog/Mixpanel later by
  editing `Core/Analytics/Analytics.swift`.

## 10. Common pitfalls

- **Share Extension can't read Keychain** → verify both targets have the
  same App Group (`group.com.simmer.app`) in Signing & Capabilities.
- **Push notifications don't arrive** → check `aps-environment` in
  `Simmer.entitlements` matches `APNS_ENVIRONMENT` env var
  (`development` for debug builds, `production` for TestFlight/App Store).
- **Sign in with Apple fails** → `APPLE_BUNDLE_ID` env var on the server
  must exactly match your app's bundle ID.
- **`null` response decoding errors** → the `/api/partner` endpoint returns
  raw `null` when there's no partner; we handle this explicitly in
  `APIClient.fetchPartner()`. Don't reuse the generic `perform` helper there.
