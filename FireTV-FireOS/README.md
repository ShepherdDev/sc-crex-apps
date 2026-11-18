# Shepherd Church TV app: Fire OS

The Fire OS (Android) build of the TV app, for every Fire TV that isn't on
Vega OS: Fire TV Sticks (4K, 4K Plus, 4K Max), Cubes and Fire TV televisions.
It replaces the 2019 Xamarin/Crex app in `../FireTV` and ships to the same
Amazon Appstore listing (package `com.shepherdchurch.TVApp`).

The screens, menu and design come from `../TV-Shared` (shared with the Vega
app). This project adds the Android shell and an ExoPlayer-based player
(`src/PlayerScreen.tsx`, using react-native-video).

## Requirements

- Node 20+
- Java 17 or 21 and the Android SDK (Android Studio installs both). Set
  `ANDROID_HOME`, or put `sdk.dir=...` in `android/local.properties`.

## Build

```sh
npm install
npm run build:release   # android/app/build/outputs/apk/release/app-release.apk
```

### Signing for the Appstore

Release builds are signed with the Appstore upload key when these are set in
`~/.gradle/gradle.properties` on the build machine (never in this repo):

```
SHEPHERD_TV_STORE_FILE=/full/path/to/shepherd-tv-release.keystore
SHEPHERD_TV_STORE_PASSWORD=...
SHEPHERD_TV_KEY_ALIAS=shepherd-tv
SHEPHERD_TV_KEY_PASSWORD=...
```

The keystore and password are in the church password manager. Without them,
release builds fall back to the debug key (fine for sideloading only).
Amazon re-signs uploads with the account's own Amazon key, so existing
installs update normally.

## Install on a Fire TV for testing

1. On the Fire TV: Settings > My Fire TV > About, click the device name 7
   times, then Developer Options > ADB Debugging: On. Note the IP address
   (Settings > My Fire TV > About > Network).
2. On the Mac (Android platform-tools installed):
   ```sh
   adb connect <fire-tv-ip>
   adb install -r android/app/build/outputs/apk/release/app-release.apk
   ```

## Store requirements

Amazon requires `targetSdkVersion` 34+ for current Fire OS devices (the old
app targeted 27, which is why it disappeared from newer devices).
This app targets 36. `versionCode` must go up with every upload (live: 6).
