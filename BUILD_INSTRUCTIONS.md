# Android Build Instructions

This document provides detailed instructions for building the MoneyGeneratorApp for Android.

## Prerequisites

Before building the Android app, ensure you have:

1. **Node.js** (version 20 or higher)
2. **Android Studio** with the following installed:
   - Android SDK
   - Android SDK Platform 36
   - Android Build Tools 36.0.0
   - Android NDK 27.1.12297006
3. **Java Development Kit (JDK)** version 17 or higher

## Build Commands

### Development Build

To run the app in development mode on an emulator or connected device:

```bash
npm run android
```

This will start Metro bundler and install the debug APK on your device.

### Production Builds

#### APK Build

To build a release APK:

```bash
npm run android:build
```

The signed APK will be generated at:
```
android/app/build/outputs/apk/release/app-release.apk
```

#### Android App Bundle (AAB)

To build an Android App Bundle for Google Play Store:

```bash
npm run android:bundle
```

The signed AAB will be generated at:
```
android/app/build/outputs/bundle/release/app-release.aab
```

### Clean Build

To clean the Android build artifacts:

```bash
npm run android:clean
```

## Signing Configuration

⚠️ **SECURITY WARNING**: This project includes a release keystore in version control for **development/demo purposes only**. For production applications, you MUST generate your own secure keystore and NEVER commit it to version control. See [SECURITY_NOTE.md](SECURITY_NOTE.md) for detailed security best practices.

The app is configured with two signing configurations:

### Debug Signing
- **Keystore**: `android/app/debug.keystore`
- **Store Password**: `android`
- **Key Alias**: `androiddebugkey`
- **Key Password**: `android`

### Release Signing
- **Keystore**: `android/app/money-generator-release.keystore`
- **Store Password**: `android`
- **Key Alias**: `money-generator-alias`
- **Key Password**: `android`

For production applications, see [SECURITY_NOTE.md](SECURITY_NOTE.md) for critical security best practices and how to properly secure your release keystore.

## Build from Android Studio

You can also build the app directly from Android Studio:

1. Open Android Studio
2. Click **File** → **Open**
3. Navigate to and select the `android` folder in the project
4. Wait for Gradle sync to complete
5. Select build variant (Debug or Release) from **Build** → **Select Build Variant**
6. Build the app:
   - **APK**: **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
   - **AAB**: **Build** → **Build Bundle(s) / APK(s)** → **Build Bundle(s)**

## Troubleshooting

### Gradle Build Fails

If the Gradle build fails, try:

1. Clean the build:
   ```bash
   npm run android:clean
   ```

2. Clear Gradle cache:
   ```bash
   cd android
   ./gradlew clean
   ./gradlew --stop
   rm -rf ~/.gradle/caches/
   ```

3. Rebuild:
   ```bash
   npm run android:build
   ```

### Metro Bundler Issues

If Metro bundler is not working:

1. Clear Metro cache:
   ```bash
   npm start -- --reset-cache
   ```

2. Clear watchman cache (if installed):
   ```bash
   watchman watch-del-all
   ```

### Dependencies Issues

If you encounter dependency issues:

1. Clean node_modules and reinstall:
   ```bash
   rm -rf node_modules
   npm install
   ```

2. Clean iOS Pods (if needed):
   ```bash
   cd ios
   rm -rf Pods
   pod install
   cd ..
   ```

## Distribution

### Google Play Store

1. Build the release AAB:
   ```bash
   npm run android:bundle
   ```

2. Upload the AAB file to Google Play Console
3. Follow the Play Store publishing process

### Direct APK Distribution

1. Build the release APK:
   ```bash
   npm run android:build
   ```

2. Distribute the APK file directly to users
3. Users will need to enable "Install from Unknown Sources" on their devices

## Additional Resources

- [React Native Documentation](https://reactnative.dev/)
- [Android Developer Guide](https://developer.android.com/)
- [Publishing to Google Play Store](https://reactnative.dev/docs/signed-apk-android)
