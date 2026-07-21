# Play Store Compliance Guide — Statusly

Everything needed to get Statusly approved and keep it live. Read this **before** building Phase 9 (ads/IAP) and **before** submitting.

Verified against Google Play policy as of **July 2026**. Policies change — re-check the linked sources before you submit.

---

## Part 1 — The four things that get apps like this removed

Status savers are a high-scrutiny category. In order of how often they cause trouble:

### 1. Trademark / impersonation (the #1 killer)

Google's Impersonation policy prohibits app icons, titles, descriptions, or in-app elements that mislead users about a relationship to another app. Apps using a third-party trademark in the app name can be **suspended and the developer account terminated**.

**Rules — follow all of them:**

| ✅ Do | ❌ Never do |
|-------|------------|
| Name it **"Statusly — Status Saver & Repost"** | Put "WhatsApp" in the app title |
| Use `com.statusly.app` as the package ID | Put "whatsapp" in the package ID |
| Say "for WhatsApp" only **descriptively** in the body of the long description | Use WhatsApp's logo, phone glyph, or exact brand green (`#25D366`) in your icon |
| Include the non-affiliation disclaimer in the store description, the app's About screen, the ToS, and the Privacy Policy | Imply endorsement, partnership, or official status anywhere |
| Use our distinct emerald `#0E8F6E` (deliberately different from WhatsApp green) | Mimic WhatsApp's icon shape or screenshots |

**Add this to the very top of your Play store long description:**

> Statusly is an independent app and is not affiliated with, endorsed by, or sponsored by WhatsApp LLC or Meta Platforms, Inc. WhatsApp is a trademark of WhatsApp LLC.

Your generated icon (segmented ring + download arrow, emerald `#0E8F6E`) was designed to be distinct from WhatsApp's branding. **Do not "fix" it toward WhatsApp green.**

### 2. Photo & Video Permissions policy — architect around it

This is the sleeper risk, and it affects your **code**, not just your paperwork.

Since **May 28, 2025**, apps targeting Android 13+ may only request `READ_MEDIA_IMAGES` / `READ_MEDIA_VIDEO` if system pickers are insufficient for **core** functionality. Apps needing broad access must submit a declaration and **pass an access review** demonstrating persistent or frequent access. Apps with one-time or limited needs are told to use the Android Photo Picker.

**The good news: Statusly can almost certainly ship with neither permission.** Here's the architecture that avoids them:

| Task | Naive approach (triggers review) | Compliant approach (no permission) |
|------|----------------------------------|-------------------------------------|
| Read WhatsApp statuses | `READ_MEDIA_*` + broad storage scan | **SAF** — user grants the `.Statuses` folder via `ACTION_OPEN_DOCUMENT_TREE`. This is a user-granted document tree, not a media permission. |
| Save to gallery | `expo-media-library` with read/write permission | **`MediaStore.insert()`** — on Android 10+ an app can write to `MediaStore` collections **without any permission**. |
| Show the "Saved" library | Read the whole gallery via `READ_MEDIA_*` | **Read back only your own files.** An app can always access MediaStore items it created, no permission needed. Store the returned content URI in `saved_items` and read from there. |

> **Instruction for Claude Code:** implement gallery saving with a native `MediaStore.insert()` call rather than `expo-media-library`'s permission-gated path, and build the Saved library from URIs the app itself created. Target: **zero** `READ_MEDIA_IMAGES` / `READ_MEDIA_VIDEO` in the final merged manifest.

**Verify before submitting:**
```bash
# After prebuild, inspect the MERGED manifest (libraries can inject permissions)
npx expo prebuild -p android
cat android/app/build/intermediates/merged_manifests/release/AndroidManifest.xml | grep -i "permission"
```
If `READ_MEDIA_IMAGES` or `READ_MEDIA_VIDEO` appear (often pulled in by a dependency), remove them explicitly:
```xml
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" tools:node="remove" />
<uses-permission android:name="android.permission.READ_MEDIA_VIDEO" tools:node="remove" />
```
**Never** add `MANAGE_EXTERNAL_STORAGE` ("All files access"). It is a restricted permission and is close to an automatic rejection for this app category.

### 3. Data Safety form that contradicts the privacy policy

Google requires a Data Safety declaration for **every** app — including apps that collect nothing — and holds you responsible for its accuracy. Mismatches between the form, the policy, and actual app behaviour cause rejection and removal.

The single most common mistake in this category: declaring **"no data collected"** while shipping AdMob. **AdMob collects the advertising ID.** You must declare it. Fill the form as in Part 2 below.

### 4. Prominent disclosure before requesting access

For access users wouldn't expect, Google requires an in-app **prominent disclosure** *before* the permission request — not buried in the policy.

Your onboarding already does this by design. Make sure slide 3 shows this **before** launching the SAF picker:

> **Statusly needs access to your WhatsApp status folder**
> This lets Statusly show the status photos and videos already saved on your device so you can view, save, and repost them. Statusly reads these files only on your device — they are never uploaded or shared with us.
> [ Grant access ]   [ Not now ]

Requirements: it must appear before the request, describe what is accessed and why, be dismissible without granting, and not be a link-only reference to the policy.

---

## Part 2 — Data Safety form answers

Use these exactly, assuming the stack in the TRD (AdMob + Sentry + Play Billing) and no other SDKs. **If you add or remove an SDK, revisit this.**

### Data collection and sharing

| Data type | Collected | Shared | Purpose | Optional? |
|-----------|-----------|--------|---------|-----------|
| **Device or other IDs** (advertising ID) | ✅ Yes | ✅ Yes | Advertising or marketing; Analytics | ❌ Required (unless user buys Remove Ads) |
| **App activity** — app interactions (ad impressions/clicks) | ✅ Yes | ✅ Yes | Advertising or marketing | ❌ Required |
| **App info and performance** — crash logs, diagnostics | ✅ Yes | ❌ No | App functionality; Diagnostics | ❌ Required |
| **Location** — approximate (IP-derived, by ad SDK) | ✅ Yes | ✅ Yes | Advertising or marketing | ❌ Required |
| **Photos and videos** | ❌ **No** | ❌ No | — | — |
| Personal info (name, email, phone) | ❌ No | ❌ No | — | — |
| Contacts | ❌ No | ❌ No | — | — |
| Messages | ❌ No | ❌ No | — | — |
| Financial info | ❌ No | ❌ No | — | — |

> **Why "Photos and videos: No" is correct:** Data Safety asks about data **collected off the device** or transmitted. Statusly reads and saves media entirely on-device and never transmits it. On-device-only processing is not "collection". **Be ready to justify this** — it is accurate, but reviewers scrutinise it in this category. Your privacy policy Section 4 states it explicitly, which is your evidence.

### Security practices

| Question | Answer |
|----------|--------|
| Is data encrypted in transit? | **Yes** (HTTPS/TLS for ads and crash reporting) |
| Can users request data deletion? | **Yes** — uninstalling removes all local data; explain there are no accounts |
| Committed to Play Families Policy? | **No** (target audience 13+, not children) |
| Independent security review? | **No** |

### Other Console declarations

| Declaration | Answer |
|-------------|--------|
| **Advertising ID** | ✅ Yes — used for advertising/marketing and analytics. Declare `com.google.android.gms.permission.AD_ID` in the manifest (required for Android 13+ targets; without it the ID is zeroed out). The AdMob SDK usually merges it automatically — verify it's present. |
| **Target audience** | **13+** — do *not* select "children" categories, which would pull you into Families policy and its restricted ad SDK list |
| **Content rating** | Complete the IARC questionnaire honestly. Note user-shared media in the UGC question. |
| **Ads** | ✅ Yes, this app contains ads |
| **Government app** | No |
| **Financial features** | No |
| **Data deletion** | No account system → select the option indicating no account creation; the policy explains uninstall-based deletion |
| **News app** | No |
| **Contacts permission** | Not requested — confirm `READ_CONTACTS` is absent from the merged manifest. (April 2026 policy: apps not needing broad contact access must use the Android Contact Picker.) Statusly's "tracked contacts" are derived from status file heuristics, **not** the device address book — keep it that way. |

---

## Part 3 — EEA / UK / Switzerland consent (required if you serve there)

Since **16 January 2024**, serving personalised ads to users in the EEA/UK requires a **Google-certified CMP integrated with the IAB TCF**. Without one, only Limited Ads serve on that traffic.

**What to implement:** Google's own **User Messaging Platform (UMP) SDK**, which is free and certified.

```
Requirements:
- Show the consent form on first launch for EEA/UK/CH users, before requesting ads
- Pass consent signals to AdMob before initialising ads
- Provide a "Privacy options" / "Ad settings" entry in Settings so users can change their choice
- Handle the "consent not required" case for non-EEA users without showing a form
```

Package: `react-native-google-mobile-ads` includes UMP support via its `AdsConsent` API.

---

## Part 4 — Hosting the policies

Google requires the privacy policy at a **public, active URL** that is not behind a login and not a downloadable file, linked both in Play Console and **inside the app**.

**Recommended (free):** GitHub Pages.

```bash
# 1. Create a public repo, e.g. statusly-legal
# 2. Build the HTML (see legal/build-legal-html.py)
python3 legal/build-legal-html.py
# 3. Commit the /legal/site folder, push
# 4. Settings → Pages → deploy from branch (main, /docs or /root)
```

Resulting URLs:
```
https://<username>.github.io/statusly-legal/privacy-policy.html
https://<username>.github.io/statusly-legal/terms-of-service.html
```

Put those URLs in: Play Console → App content → Privacy policy; your store listing; the app's Settings screen; and the `[PRIVACY POLICY URL]` placeholder in the ToS.

---

## Part 5 — Pre-submission checklist

### Legal documents
- [ ] Every `[BRACKETED]` placeholder filled in both documents
- [ ] Postal address added (required for developer verification)
- [ ] Both hosted at public, non-login URLs and loading correctly
- [ ] Privacy policy URL entered in Play Console → App content
- [ ] Both linked from the app's Settings screen
- [ ] Effective dates set
- [ ] **Reviewed by a lawyer**

### Code and manifest
- [ ] Merged manifest contains **no** `READ_MEDIA_IMAGES` / `READ_MEDIA_VIDEO`
- [ ] Merged manifest contains **no** `MANAGE_EXTERNAL_STORAGE`
- [ ] Merged manifest contains **no** `READ_CONTACTS`
- [ ] `com.google.android.gms.permission.AD_ID` present
- [ ] Prominent disclosure shown before the SAF request
- [ ] UMP consent flow implemented and tested with an EEA test device
- [ ] "Privacy options" entry in Settings for EEA users
- [ ] Ads fully hidden when `hasRemovedAds` is true
- [ ] Real AdMob unit IDs (not test IDs) in the production build
- [ ] Sentry configured to scrub PII (`sendDefaultPii: false`)

### Store listing
- [ ] Title has no third-party trademark
- [ ] Non-affiliation disclaimer at the top of the long description
- [ ] Screenshots don't show WhatsApp's UI, logo, or real people's private content
- [ ] Icon distinct from WhatsApp's
- [ ] Description accurately describes functionality (no overpromising)

### Console declarations
- [ ] Data Safety form matches Part 2 **and** the privacy policy
- [ ] Advertising ID declaration completed
- [ ] Target audience = 13+, Families policy **not** opted into
- [ ] Content rating questionnaire completed, UGC disclosed
- [ ] Ads declaration = yes

### Final verification
- [ ] Read the privacy policy line by line against the finished build — does every claim still hold?
- [ ] Confirm no user media is transmitted (check with a network proxy such as Charles/mitmproxy)
- [ ] Test on Android 11, 13, 14, and 15+ — SAF behaviour differs

---

## Part 6 — If you get rejected

1. **Read the exact policy cited.** Google names the specific policy; the fix is almost always narrow.
2. **Common causes in this category, in order:** trademark in title/icon → Data Safety mismatch → missing prominent disclosure → restricted storage permission → screenshots showing another app's UI.
3. **Fix, then appeal with specifics.** Explain precisely what changed and where. Vague appeals fail.
4. **Don't resubmit unchanged.** Repeated violations escalate toward account termination.

---

## Sources

- [Provide information for Google Play's Data safety section](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en)
- [User Data policy](https://support.google.com/googleplay/android-developer/answer/10144311?hl=en)
- [Details on Google Play's Photo and Video Permissions policy](https://support.google.com/googleplay/android-developer/answer/14115180?hl=en)
- [Required actions to comply with the Photo & Video Permissions policy](https://support.google.com/googleplay/android-developer/answer/15800983?hl=en)
- [Impersonation policy](https://support.google.com/googleplay/android-developer/answer/9888374?hl=en)
- [Intellectual Property policy](https://support.google.com/googleplay/android-developer/answer/9888072?hl=en)
- [Advertising ID](https://support.google.com/googleplay/android-developer/answer/6048248?hl=en)
- [Google consent management requirements for the EEA, UK and Switzerland](https://support.google.com/admob/answer/13554116?hl=en)
- [Disclose to EEA users (AdMob GDPR)](https://developers.google.com/admob/android/privacy/gdpr)
- [Google Play data disclosure requirements (AdMob)](https://developers.google.com/admob/android/next-gen/privacy/play-data-disclosure)
- [Policy announcement: April 15, 2026](https://support.google.com/googleplay/android-developer/answer/16926792?hl=en)
- [Grant partial access to photos and videos](https://developer.android.com/about/versions/14/changes/partial-photo-video-access)
