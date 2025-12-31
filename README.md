# Money Generator App - Kotlin Multiplatform

This application has been converted to **Kotlin Multiplatform** with **Compose Multiplatform** for native Android and iOS builds.

## What Changed

This project was migrated from **React Native** (TypeScript/JavaScript) to **Kotlin Native** (pure Kotlin multiplatform). Key changes include:

### Before (React Native)
- **UI Framework**: React Native with TypeScript
- **Build**: Metro bundler + React Native CLI
- **Runtime**: JavaScript bridge to native modules
- **Platform Support**: Android & iOS via React Native

### After (Kotlin Native)
- **UI Framework**: Compose Multiplatform (Kotlin)
- **Build**: Gradle with Kotlin Native compiler
- **Runtime**: Compiled to native machine code (no bridge)
- **Platform Support**: Android & iOS via Kotlin Native

## Architecture

The project uses a Kotlin Multiplatform structure:

```
MoneyGeneratorApp/
├── composeApp/              # Shared library module
│   ├── src/
│   │   ├── commonMain/      # Shared UI and business logic
│   │   ├── androidMain/     # Android-specific code
│   │   └── iosMain/         # iOS-specific code
│   └── build.gradle.kts
│
├── androidApp/              # Android application module
│   └── build.gradle.kts
│
├── build.gradle.kts         # Root build configuration
└── settings.gradle.kts      # Project modules
```

## Prerequisites

- **JDK 17** or higher
- **Kotlin 2.1.20**
- **Android SDK** with:
  - Compile SDK: 36
  - Min SDK: 24
  - Target SDK: 36
  - Build Tools: 36.0.0
- **Gradle 9.0.0** (via wrapper)

For iOS builds (macOS only):
- **Xcode 15.0+**
- **CocoaPods**

## Building the Application

### Android

#### Debug Build
```bash
./gradlew :androidApp:assembleDebug
```

Output: `androidApp/build/outputs/apk/debug/androidApp-debug.apk`

#### Release Build
```bash
./gradlew :androidApp:assembleRelease
```

Output: `androidApp/build/outputs/apk/release/androidApp-release.apk`

#### Install to Device/Emulator
```bash
./gradlew :androidApp:installDebug
```

### iOS (macOS only)

#### Build Framework
```bash
./gradlew :composeApp:linkDebugFrameworkIosSimulatorArm64
```

For physical devices:
```bash
./gradlew :composeApp:linkReleaseFrameworkIosArm64
```

## Technology Stack

- **Kotlin 2.1.20**: Programming language for all platforms
- **Compose Multiplatform 1.8.1**: Cross-platform UI framework
- **Material 3**: Modern design system
- **Kotlin Native**: Native compilation for iOS
- **Android Gradle Plugin 8.5.2**: Build system

## Key Features

- **Single Codebase**: Shared UI and business logic across platforms
- **Native Performance**: Compiled to machine code (no JavaScript bridge)
- **Modern UI**: Compose Multiplatform with Material 3
- **Type Safety**: Full Kotlin type system across all code

## Application Features

The Money Generator app provides:

- **Job Boards**: Categorized job listings (Local Missions, Digital Services, Shift-Based Ops)
- **Smart Workflows**: Delivery Mode, Freelance Mode, Support Mode
- **Financial Stack**: Liquidity, Benefits, Expense Intelligence
- **Integration Hub**: Unified API Gateway and White-Label Marketplace
- **Master Key Architecture**: Secure routing and billing
- **Monetization Engine**: Subscriptions, cost-plus billing, commissions
- **Compliance**: Enterprise-grade security and audit trails
- **Roadmap**: MVP → Scale → Enterprise phases

## Development

### Clean Build
```bash
./gradlew clean
```

### Build All Modules
```bash
./gradlew build
```

### List Available Tasks
```bash
./gradlew tasks
```

## Migration Notes

The TypeScript/React UI has been fully ported to Kotlin Compose:

- **React Components** → **@Composable functions**
- **StyleSheet** → **Modifier chains**
- **useState/useEffect** → **remember/LaunchedEffect**
- **Props** → **Function parameters**
- **Type definitions** → **data classes**

All business logic, data models, and UI styling have been preserved in the conversion.

## Troubleshooting

### Gradle Sync Failures
```bash
./gradlew --stop
rm -rf ~/.gradle/caches/
./gradlew build --refresh-dependencies
```

### Android SDK Issues
Ensure correct SDK versions in Android Studio:
- SDK Platform 36
- Build Tools 36.0.0

### Network/Repository Issues
If Maven repositories are unavailable:
```bash
./gradlew build --offline
```

## Additional Documentation

See [README_KOTLIN_NATIVE.md](README_KOTLIN_NATIVE.md) for detailed Kotlin Native build instructions.

See [README_REACT_NATIVE.md.backup](README_REACT_NATIVE.md.backup) for the original React Native documentation (deprecated).

See [BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md) for the original React Native build documentation (deprecated).

## License

See LICENSE file for details.
