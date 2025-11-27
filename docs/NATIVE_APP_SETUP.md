# FinFlow Native App Setup (iOS & Android)

Diese Anleitung erklärt wie du die FinFlow App als native iOS und Android App baust.

## 📋 Voraussetzungen

### Für iOS:
- macOS mit Xcode 14+ installiert
- Apple Developer Account ($99/Jahr) für App Store
- CocoaPods: `sudo gem install cocoapods`

### Für Android:
- Android Studio installiert
- Android SDK
- Java JDK 11+

## 🚀 Quick Start

### 1. Web-App bauen

```bash
# Next.js static export erstellen
npm run build
```

### 2. Capacitor Sync

```bash
# Native Projekte mit Web-App synchronisieren
npx cap sync
```

### 3. iOS App öffnen

```bash
# Xcode öffnen
npx cap open ios
```

### 4. Android App öffnen

```bash
# Android Studio öffnen
npx cap open android
```

## 📱 iOS Konfiguration

### Info.plist Einstellungen

Die folgenden Keys müssen in `ios/App/App/Info.plist` hinzugefügt werden:

```xml
<!-- Face ID Beschreibung -->
<key>NSFaceIDUsageDescription</key>
<string>FinFlow verwendet Face ID für sichere Anmeldung</string>

<!-- Camera (falls benötigt) -->
<key>NSCameraUsageDescription</key>
<string>FinFlow benötigt Kamerazugriff für QR-Code Scanning</string>

<!-- Push Notifications -->
<key>UIBackgroundModes</key>
<array>
    <string>fetch</string>
    <string>remote-notification</string>
</array>
```

### Signing konfigurieren

1. Öffne `ios/App/App.xcworkspace` in Xcode
2. Wähle das "App" Target
3. Unter "Signing & Capabilities":
   - Team: Wähle dein Apple Developer Team
   - Bundle Identifier: `ch.finflowapp`
   - Aktiviere "Automatically manage signing"

### Face ID aktivieren

In Xcode unter "Signing & Capabilities":
- Klicke "+" und füge "Face ID" Capability hinzu

## 🤖 Android Konfiguration

### Biometric Permissions

In `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.USE_BIOMETRIC" />
<uses-permission android:name="android.permission.USE_FINGERPRINT" />
```

### Signing konfigurieren

1. Erstelle einen Keystore:
```bash
keytool -genkey -v -keystore finflow-release.keystore -alias finflow -keyalg RSA -keysize 2048 -validity 10000
```

2. In `android/app/build.gradle`:
```gradle
signingConfigs {
    release {
        storeFile file('finflow-release.keystore')
        storePassword 'YOUR_STORE_PASSWORD'
        keyAlias 'finflow'
        keyPassword 'YOUR_KEY_PASSWORD'
    }
}
```

## 🔧 Entwicklung

### Live Reload aktivieren

Für Entwicklung kannst du Live Reload aktivieren in `capacitor.config.ts`:

```typescript
const config: CapacitorConfig = {
  // ... andere config
  server: {
    // Für Entwicklung - zeigt auf lokalen Dev-Server
    url: 'http://YOUR_LOCAL_IP:3000',
    cleartext: true, // Nur für Entwicklung!
  },
};
```

### Auf physischem Gerät testen

#### iOS:
1. Verbinde iPhone mit Mac via USB
2. In Xcode: Wähle dein iPhone als Target
3. Klicke "Run" (⌘R)

#### Android:
1. Aktiviere "USB Debugging" auf dem Android Gerät
2. Verbinde via USB
3. In Android Studio: Wähle dein Gerät und klicke "Run"

## 📦 App Store Submission

### iOS App Store

1. **Archive erstellen:**
   - In Xcode: Product → Archive
   - Warte bis Build fertig

2. **App Store Connect:**
   - Öffne https://appstoreconnect.apple.com
   - Erstelle neue App mit Bundle ID `ch.finflowapp`
   - Fülle alle Metadaten aus (Screenshots, Beschreibung, etc.)

3. **Upload:**
   - Im Xcode Organizer: "Distribute App"
   - Wähle "App Store Connect"
   - Folge den Anweisungen

4. **Review:**
   - Apple Review dauert 1-7 Tage
   - Bei Ablehnung: Fehler beheben und erneut einreichen

### Google Play Store

1. **AAB erstellen:**
   ```bash
   cd android
   ./gradlew bundleRelease
   ```

2. **Play Console:**
   - Öffne https://play.google.com/console
   - Erstelle neue App
   - Lade AAB hoch unter "Release" → "Production"

3. **Store Listing:**
   - Screenshots (mind. 2)
   - Feature Graphic (1024x500)
   - App Icon (512x512)
   - Beschreibung (Kurz + Lang)

## 🔔 Push Notifications Setup

### iOS:
1. In Apple Developer Portal: Erstelle Push Certificate
2. Konfiguriere in Xcode unter Capabilities
3. Implementiere `didRegisterForRemoteNotificationsWithDeviceToken`

### Android:
1. Erstelle Firebase Projekt
2. Füge `google-services.json` zu `android/app/`
3. Konfiguriere FCM

## 🎨 App Icons & Splash Screens

Icons sind bereits generiert in `/public/icons/`. 

Für native Apps:
- iOS Icons in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- Android Icons in `android/app/src/main/res/mipmap-*/`

Nutze Tools wie:
- https://www.appicon.co/
- https://capacitorjs.com/docs/guides/splash-screens-and-icons

## 📋 Checkliste vor Release

- [ ] App Icon in allen Größen
- [ ] Splash Screen
- [ ] Face ID / Biometric funktioniert
- [ ] Push Notifications funktionieren
- [ ] Alle Screens auf verschiedenen Geräten getestet
- [ ] Privacy Policy URL
- [ ] Terms of Service URL
- [ ] App Store Screenshots (6.5", 5.5" für iOS)
- [ ] Play Store Screenshots
- [ ] App Beschreibungen (DE/EN)
- [ ] Keywords für App Store Optimization (ASO)

## 🐛 Troubleshooting

### iOS Build Fehler
```bash
cd ios/App
pod install --repo-update
```

### Android Build Fehler
```bash
cd android
./gradlew clean
```

### Capacitor Sync Probleme
```bash
npx cap sync --force
```
