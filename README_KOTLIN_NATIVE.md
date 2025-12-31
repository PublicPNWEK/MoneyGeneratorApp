# Money Generator App - Kotlin Native Build

This is a Kotlin Multiplatform application using Compose Multiplatform for the UI. The application is built as a native app for Android and iOS using Kotlin Native.

## Architecture

The project uses a Kotlin Multiplatform structure:

- **composeApp**: Contains shared Kotlin code and UI components using Compose Multiplatform
  - `commonMain`: Platform-agnostic business logic and UI
  - `androidMain`: Android-specific implementations
  - `iosMain`: iOS-specific implementations (framework)

- **androidApp**: Android application module that depends on composeApp

## Prerequisites

- **JDK 17** or higher
- **Kotlin 2.1.20**
- **Android SDK** with:
  - SDK Platform 36
  - Build Tools 36.0.0
- **Gradle 8.4+** (wrapper included)

For iOS builds (on macOS):
- **Xcode 15.0+**
- **CocoaPods** (optional for iOS dependencies)

## Building the Application

### Android

#### Debug Build

```bash
./gradlew :androidApp:assembleDebug
```

The APK will be located at: `androidApp/build/outputs/apk/debug/androidApp-debug.apk`

#### Release Build

```bash
./gradlew :androidApp:assembleRelease
```

The APK will be located at: `androidApp/build/outputs/apk/release/androidApp-release.apk`

#### Install on Device/Emulator

```bash
./gradlew :androidApp:installDebug
```

### iOS (macOS only)

#### Build iOS Framework

```bash
./gradlew :composeApp:linkDebugFrameworkIosSimulatorArm64
```

The framework will be located at: `composeApp/build/bin/iosSimulatorArm64/debugFramework/`

For physical devices:
```bash
./gradlew :composeApp:linkReleaseFrameworkIosArm64
```

## Running the Application

### Android

Run on connected device or emulator:
```bash
./gradlew :androidApp:installDebug
adb shell am start -n com.moneygeneratorapp/.MainActivity
```

Or use Android Studio:
1. Open the project in Android Studio
2. Select `androidApp` configuration
3. Click Run

### iOS

1. Open the iOS project in Xcode (located in `iosApp/` if created)
2. Build and run the project

Or use command line:
```bash
xcodebuild -workspace iosApp/iosApp.xcworkspace -scheme iosApp -configuration Debug -destination 'platform=iOS Simulator,name=iPhone 15'
```

## Project Structure

```
MoneyGeneratorApp/
├── composeApp/               # Shared Kotlin Multiplatform module
│   ├── src/
│   │   ├── commonMain/       # Shared code (UI + logic)
│   │   │   └── kotlin/
│   │   │       └── com/moneygeneratorapp/
│   │   │           └── App.kt
│   │   ├── androidMain/      # Android-specific code
│   │   └── iosMain/          # iOS-specific code
│   └── build.gradle.kts
│
├── androidApp/               # Android application
│   ├── src/main/
│   │   ├── kotlin/
│   │   │   └── com/moneygeneratorapp/
│   │   │       └── MainActivity.kt
│   │   └── AndroidManifest.xml
│   └── build.gradle.kts
│
├── build.gradle.kts         # Root build configuration
├── settings.gradle.kts      # Project structure definition
└── gradle/                  # Gradle wrapper and dependencies
    └── libs.versions.toml   # Version catalog

```

## Technology Stack

- **Kotlin 2.1.20**: Programming language
- **Compose Multiplatform 1.8.1**: UI framework for cross-platform development
- **Material 3**: Design system
- **Kotlin Native**: Native compilation for iOS
- **Android Gradle Plugin 8.4.1**: Build system for Android

## Key Features

- **Cross-platform UI**: Single codebase for Android and iOS using Compose Multiplatform
- **Native Performance**: Compiled to native code for optimal performance
- **Modern Architecture**: Kotlin Multiplatform with shared business logic
- **Material Design 3**: Modern, adaptive UI components

## Development

### Clean Build

```bash
./gradlew clean
```

### Build All Targets

```bash
./gradlew build
```

### Run Tests

```bash
./gradlew test
```

## Migration from React Native

This application has been migrated from React Native to Kotlin Native. The key changes include:

1. **UI Framework**: React Native → Compose Multiplatform
2. **Language**: TypeScript/JavaScript → Kotlin
3. **Build System**: Metro + Gradle → Pure Gradle with Kotlin Native
4. **Architecture**: JS Bridge → Native compilation

## Troubleshooting

### Gradle Sync Issues

If Gradle sync fails:
```bash
./gradlew --stop
rm -rf ~/.gradle/caches/
./gradlew clean build --refresh-dependencies
```

### Android Build Issues

Ensure you have the correct SDK versions installed:
- Target SDK: 36
- Min SDK: 24
- Build Tools: 36.0.0

### iOS Build Issues (macOS)

Make sure Xcode Command Line Tools are installed:
```bash
xcode-select --install
```

## License

See the project license for details.
