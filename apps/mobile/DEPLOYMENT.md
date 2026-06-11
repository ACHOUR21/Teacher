# Mobile App Deployment Guide

This document describes all GitHub Actions secrets required to deploy the EduAI Ultimate
Flutter mobile app to Google Play Store (Android) and Apple App Store / TestFlight (iOS).

---

## Android — Required Secrets

### `ANDROID_KEYSTORE_BASE64`

Base64-encoded JKS (Java KeyStore) file used to sign the Android App Bundle for release.

**How to generate:**

```bash
# Generate a new keystore (skip if you already have one)
keytool -genkey -v \
  -keystore eduai-release.jks \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias eduai-key

# Encode to base64 and copy to clipboard
base64 -i eduai-release.jks | tr -d '\n' | pbcopy   # macOS
base64 -w 0 eduai-release.jks                        # Linux
```

Store the output as the `ANDROID_KEYSTORE_BASE64` secret.

---

### `ANDROID_KEY_ALIAS`

The alias of the signing key inside the keystore. This is the value you passed to `-alias`
when generating the keystore (e.g. `eduai-key`).

---

### `ANDROID_KEY_PASSWORD`

The password protecting the specific key entry inside the keystore. Set during keystore
generation when prompted for "key password".

---

### `ANDROID_STORE_PASSWORD`

The password protecting the keystore file itself. Set during keystore generation when
prompted for "keystore password".

---

### `ANDROID_SERVICE_ACCOUNT_JSON`

Full JSON content (not base64) of a Google Play service account with permission to upload
releases.

**How to generate:**

1. Open [Google Play Console](https://play.google.com/console) and select your app.
2. Navigate to **Setup → API access**.
3. Link to a Google Cloud project (or create one).
4. In Google Cloud Console, go to **IAM & Admin → Service Accounts**.
5. Create a new service account, e.g. `github-actions-deploy`.
6. Grant the service account the **Release Manager** role in Play Console
   (**Users and permissions → Invite new users**).
7. In Google Cloud Console, create a JSON key for the service account
   (**Actions → Manage keys → Add key → JSON**).
8. Copy the entire content of the downloaded `.json` file as the secret value.

---

## iOS — Required Secrets

### `IOS_CERTIFICATE_P12_BASE64`

Base64-encoded Apple Distribution certificate in `.p12` format.

**How to generate:**

1. In **Xcode → Settings → Accounts**, select your Apple ID and team.
2. Click **Manage Certificates → + → Apple Distribution**.
3. In **Keychain Access**, find the certificate under **My Certificates**.
4. Right-click → **Export** → save as `.p12`, set a strong password.
5. Encode:

```bash
base64 -i distribution_certificate.p12 | tr -d '\n' | pbcopy   # macOS
base64 -w 0 distribution_certificate.p12                        # Linux
```

---

### `IOS_CERTIFICATE_PASSWORD`

The password you set when exporting the `.p12` distribution certificate from Keychain Access.

---

### `IOS_PROVISIONING_PROFILE_BASE64`

Base64-encoded `.mobileprovision` file for App Store distribution.

**How to generate:**

1. Open [Apple Developer Portal](https://developer.apple.com/account/resources/profiles/list).
2. Create a new **Distribution → App Store** provisioning profile for your App ID.
3. Download the `.mobileprovision` file.
4. Encode:

```bash
base64 -i EduAI_AppStore.mobileprovision | tr -d '\n' | pbcopy   # macOS
base64 -w 0 EduAI_AppStore.mobileprovision                       # Linux
```

---

### `APPLE_API_KEY_ID`

The key ID of your App Store Connect API key (e.g. `ABCD1234EF`).

**How to generate:**

1. Open [App Store Connect](https://appstoreconnect.apple.com/access/api).
2. Click **+** to create a new API key with **Developer** or **App Manager** role.
3. Copy the **Key ID** shown in the table.

---

### `APPLE_API_ISSUER_ID`

The issuer ID of your App Store Connect API keys. Displayed at the top of the
**App Store Connect → Users and Access → Keys** page.

Format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

---

### `APPLE_API_KEY_BASE64`

Base64-encoded `.p8` private key file downloaded from App Store Connect.

**How to generate:**

1. After creating the API key (see `APPLE_API_KEY_ID` above), click **Download API Key**.
   This file can only be downloaded once — store it securely.
2. Encode:

```bash
base64 -i AuthKey_ABCD1234EF.p8 | tr -d '\n' | pbcopy   # macOS
base64 -w 0 AuthKey_ABCD1234EF.p8                        # Linux
```

---

## Optional — Shared Secrets

### `CODECOV_TOKEN`

Token for uploading test coverage reports to [Codecov](https://codecov.io).

1. Sign in to Codecov with your GitHub account.
2. Add the repository.
3. Copy the **Repository Upload Token** from the repository settings page.

---

## Adding Secrets to GitHub

1. Open your repository on GitHub.
2. Go to **Settings → Secrets and variables → Actions**.
3. Click **New repository secret**.
4. Enter the secret name and value, then click **Add secret**.

Repeat for each secret listed above.

---

## Workflow Overview

| Workflow | Trigger | Jobs |
|---|---|---|
| `mobile-android.yml` | Push to `main` (mobile paths) or manual | test → build → deploy (Play Store) |
| `mobile-ios.yml` | Push to `main` (mobile paths) or manual | test → build (macOS) → deploy (TestFlight/App Store) |
| `mobile-ci.yml` | Pull request (mobile paths) | analyze, test, build-check-android, build-check-ios, coverage |
